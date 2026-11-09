import { FastifyInstance } from 'fastify';
import { PendingFriendRequestModel, ActivityNotificationModel, UserModel, ConnectionModel } from '../models/index.js';
import { isMongoConnected } from '../db/connection.js';
import { validateBody, validateParams, SendFriendRequestSchema, RequestIdParamSchema, SendFriendRequestInput, RequestIdParamInput } from '../validation/index.js';

export interface PendingFriendRequest {
  id: string;
  recipientUserId?: string;
  requesterUserId?: string;
  userId?: string;
  name: string;
  handle: string;
  avatarUrl: string;
  status: 'pending' | 'accepted' | 'declined';
  mutualCount?: number;
  timestamp: string;
}

export interface ActivityNotification {
  id: string;
  userId?: string;
  relatedUserId?: string;
  type: 'gift_sync' | 'event_reminder' | 'expense_settled' | 'subscription_renewed';
  title: string;
  description: string;
  timeAgo: string;
  iconType: 'heart' | 'calendar' | 'payments' | 'subscription';
  isRead: boolean;
  timestamp: string;
}

let pendingRequests: PendingFriendRequest[] = [];

let activityNotifications: ActivityNotification[] = [];

export async function notificationRoutes(fastify: FastifyInstance) {
  // GET all notifications and pending friend requests for the specific userId
  fastify.get('/api/notifications', async (request) => {
    const query = request.query as { userId?: string };
    const currentUserId = (query.userId || '').trim().toLowerCase().replace(/^@+/, '');

    let requests: PendingFriendRequest[] = [];
    let notifs: ActivityNotification[] = [];

    if (isMongoConnected) {
      try {
        // Clean up legacy mock records if any exist
        await Promise.allSettled([
          ActivityNotificationModel.deleteMany({ id: { $in: ['notif_1', 'notif_2', 'notif_3', 'notif_4'] } }),
          PendingFriendRequestModel.deleteMany({ id: { $in: ['req_marcus', 'req_chloe'] } })
        ]);

        // 1. Fetch pending requests targeted at this user
        const reqFilter: any = {
          status: 'pending',
          id: { $nin: ['req_marcus', 'req_chloe'] }
        };

        if (currentUserId) {
          reqFilter.$or = [
            { recipientUserId: currentUserId },
            { userId: currentUserId }
          ];
        }

        const dbReqs = await PendingFriendRequestModel.find(reqFilter).lean();
        const foundReqIds = new Set<string>();

        if (dbReqs && dbReqs.length > 0) {
          for (const r of dbReqs) {
            foundReqIds.add(r.id);
            requests.push({
              id: r.id,
              recipientUserId: r.recipientUserId,
              requesterUserId: r.requesterUserId,
              name: r.name,
              handle: r.handle,
              avatarUrl: r.avatarUrl,
              status: r.status as any,
              mutualCount: r.mutualCount,
              timestamp: r.timestamp
            });
          }
        }

        // 2. Also cross-reference ConnectionModel for pending connections where current user is the recipient
        if (currentUserId) {
          const pendingConns = await ConnectionModel.find({
            recipientUserId: currentUserId,
            status: 'pending'
          }).lean();

          for (const conn of pendingConns) {
            if (!foundReqIds.has(conn.connectionId)) {
              foundReqIds.add(conn.connectionId);
              requests.push({
                id: conn.connectionId,
                recipientUserId: conn.recipientUserId,
                requesterUserId: conn.requesterUserId,
                name: conn.requesterName,
                handle: `@${conn.requesterUserId}`,
                avatarUrl: conn.requesterAvatarUrl || '',
                status: 'pending',
                mutualCount: 1,
                timestamp: conn.createdAt
              });
            }
          }
        }

        // 3. Fetch notifications specifically meant for this user
        const notifFilter: any = {
          id: { $nin: ['notif_1', 'notif_2', 'notif_3', 'notif_4'] }
        };

        if (currentUserId) {
          notifFilter.userId = currentUserId;
        }

        const dbNotifs = await ActivityNotificationModel.find(notifFilter).sort({ timestamp: -1 }).limit(30).lean();
        if (dbNotifs) {
          notifs = dbNotifs.map(n => ({
            id: n.id,
            userId: n.userId,
            relatedUserId: n.relatedUserId,
            type: n.type as any,
            title: n.title,
            description: n.description,
            timeAgo: n.timeAgo,
            iconType: n.iconType as any,
            isRead: n.isRead,
            timestamp: n.timestamp
          }));
        }
      } catch (err) {
        fastify.log.warn('MongoDB query for notifications: ' + err);
      }
    } else {
      // In-memory fallback
      requests = currentUserId
        ? pendingRequests.filter(r => (r.recipientUserId === currentUserId || r.userId === currentUserId))
        : pendingRequests;
      notifs = currentUserId
        ? activityNotifications.filter(n => n.userId === currentUserId)
        : activityNotifications;
    }

    return {
      success: true,
      userId: currentUserId || null,
      pendingRequests: requests.filter(r => r.status === 'pending'),
      notifications: notifs,
      unreadCount: notifs.filter(n => !n.isRead).length + requests.filter(r => r.status === 'pending').length
    };
  });

  // POST send friend request by userId or handle
  fastify.post('/api/notifications/friend-request', { preHandler: validateBody(SendFriendRequestSchema) }, async (request, reply) => {
    const body = request.body as SendFriendRequestInput & { requesterUserId?: string };
    const rawId = (body.userId || body.handle || '').trim().replace(/^@+/, '');
    const cleanHandle = `@${rawId.toLowerCase()}`;
    const cleanRequesterId = (body.requesterUserId || 'vetriselvan_11').trim().toLowerCase().replace(/^@+/, '');

    let targetName = rawId;
    let targetAvatar = '';
    let requesterName = cleanRequesterId;

    if (isMongoConnected) {
      try {
        const found = await UserModel.findOne({ userId: rawId.toLowerCase() }).lean();
        if (found) {
          targetName = found.name;
          if (found.avatarUrl) targetAvatar = found.avatarUrl;
        }

        const reqUser = await UserModel.findOne({ userId: cleanRequesterId }).lean();
        if (reqUser) requesterName = reqUser.name;
      } catch (err) {
        fastify.log.warn('User lookup for friend request: ' + err);
      }
    }

    const newPendingReq: PendingFriendRequest = {
      id: `req_${rawId.toLowerCase()}_${Date.now().toString(36)}`,
      recipientUserId: rawId.toLowerCase(),
      requesterUserId: cleanRequesterId,
      userId: rawId.toLowerCase(),
      name: requesterName,
      handle: `@${cleanRequesterId}`,
      avatarUrl: '',
      status: 'pending',
      mutualCount: 1,
      timestamp: new Date().toISOString()
    };

    if (isMongoConnected) {
      try {
        await PendingFriendRequestModel.create(newPendingReq);
      } catch (err) {
        fastify.log.error('Failed to create pending request in MongoDB: ' + err);
      }
    }
    pendingRequests.unshift(newPendingReq);

    // Notification for the requester (User A)
    const newActivity: ActivityNotification = {
      id: `notif_sent_${Date.now()}`,
      userId: cleanRequesterId,
      relatedUserId: rawId.toLowerCase(),
      type: 'gift_sync',
      title: 'Friend Request Sent',
      description: `You sent a connection request to ${targetName} (${cleanHandle}). Awaiting confirmation.`,
      timeAgo: 'Just now',
      iconType: 'heart',
      isRead: false,
      timestamp: new Date().toISOString()
    };

    // Notification for the recipient (User B)
    const recipientNotif: ActivityNotification = {
      id: `notif_recv_${Date.now()}`,
      userId: rawId.toLowerCase(),
      relatedUserId: cleanRequesterId,
      type: 'gift_sync',
      title: 'Connection Request',
      description: `${requesterName} (@${cleanRequesterId}) sent you a partner connection request.`,
      timeAgo: 'Just now',
      iconType: 'heart',
      isRead: false,
      timestamp: new Date().toISOString()
    };

    if (isMongoConnected) {
      try {
        await ActivityNotificationModel.create(newActivity);
        await ActivityNotificationModel.create(recipientNotif);
      } catch (err) {
        fastify.log.error('Failed to create notification in MongoDB: ' + err);
      }
    }
    activityNotifications.unshift(newActivity);

    return {
      success: true,
      message: `Friend request sent to ${targetName} (${cleanHandle})`,
      handle: cleanHandle,
      user: {
        userId: rawId.toLowerCase(),
        name: targetName,
        avatarUrl: targetAvatar
      },
      pendingRequest: newPendingReq,
      notification: newActivity
    };
  });

  // POST accept pending request
  fastify.post('/api/notifications/requests/:id/accept', { preHandler: validateParams(RequestIdParamSchema) }, async (request, reply) => {
    const { id } = request.params as RequestIdParamInput;
    const now = new Date().toISOString();

    let acceptedName = 'Partner';

    if (isMongoConnected) {
      try {
        const reqDoc = await PendingFriendRequestModel.findOneAndUpdate(
          { id },
          { $set: { status: 'accepted' } },
          { new: true }
        ).lean();

        const connDoc = await ConnectionModel.findOneAndUpdate(
          { connectionId: id },
          { $set: { status: 'connected', connectedAt: now } },
          { new: true }
        ).lean();

        if (connDoc) {
          acceptedName = connDoc.requesterName;

          // Notify requester
          await ActivityNotificationModel.create({
            id: `notif_conn_acc_${Date.now()}_req`,
            userId: connDoc.requesterUserId,
            relatedUserId: connDoc.recipientUserId,
            type: 'gift_sync',
            title: 'Connection Accepted',
            description: `${connDoc.recipientName} (@${connDoc.recipientUserId}) accepted your connection request!`,
            timeAgo: 'Just now',
            iconType: 'heart',
            isRead: false,
            timestamp: now
          });

          // Notify recipient
          await ActivityNotificationModel.create({
            id: `notif_conn_acc_${Date.now()}_rec`,
            userId: connDoc.recipientUserId,
            relatedUserId: connDoc.requesterUserId,
            type: 'gift_sync',
            title: 'Connected with Partner',
            description: `You are now connected with ${connDoc.requesterName} (@${connDoc.requesterUserId})!`,
            timeAgo: 'Just now',
            iconType: 'heart',
            isRead: false,
            timestamp: now
          });
        } else if (reqDoc) {
          acceptedName = reqDoc.name;
        }
      } catch (err) {
        fastify.log.warn('MongoDB accept friend request: ' + err);
      }
    }

    const reqIndex = pendingRequests.findIndex(r => r.id === id);
    if (reqIndex !== -1) {
      pendingRequests[reqIndex].status = 'accepted';
      acceptedName = pendingRequests[reqIndex].name;
    }

    return {
      success: true,
      message: `Connected with ${acceptedName}!`,
      activePendingCount: pendingRequests.filter(r => r.status === 'pending').length
    };
  });

  // POST decline pending request
  fastify.post('/api/notifications/requests/:id/decline', { preHandler: validateParams(RequestIdParamSchema) }, async (request, reply) => {
    const { id } = request.params as RequestIdParamInput;

    if (isMongoConnected) {
      try {
        await PendingFriendRequestModel.findOneAndUpdate({ id }, { $set: { status: 'declined' } });
        await ConnectionModel.findOneAndUpdate({ connectionId: id }, { $set: { status: 'declined' } });
      } catch (err) {
        fastify.log.warn('MongoDB decline friend request: ' + err);
      }
    }

    const reqIndex = pendingRequests.findIndex(r => r.id === id);
    if (reqIndex !== -1) {
      pendingRequests[reqIndex].status = 'declined';
    }

    return {
      success: true,
      message: `Declined request`,
      activePendingCount: pendingRequests.filter(r => r.status === 'pending').length
    };
  });

  // POST mark all notifications as read for current user
  fastify.post('/api/notifications/mark-all-read', async (request) => {
    const query = request.query as { userId?: string };
    const currentUserId = (query.userId || '').trim().toLowerCase().replace(/^@+/, '');

    if (isMongoConnected) {
      try {
        const filter: any = {};
        if (currentUserId) filter.userId = currentUserId;
        await ActivityNotificationModel.updateMany(filter, { $set: { isRead: true } });
      } catch (err) {
        fastify.log.warn('Failed to mark notifications read: ' + err);
      }
    }

    activityNotifications.forEach(n => {
      if (!currentUserId || n.userId === currentUserId) {
        n.isRead = true;
      }
    });

    return {
      success: true,
      message: 'All notifications marked as read'
    };
  });
}


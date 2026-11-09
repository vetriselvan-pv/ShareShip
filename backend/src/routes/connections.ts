import { FastifyInstance } from 'fastify';
import { ConnectionModel, IConnection, UserModel, PendingFriendRequestModel, ActivityNotificationModel } from '../models/index.js';
import { isMongoConnected } from '../db/connection.js';
import { inMemoryUsers } from './auth.js';
import {
  validateBody,
  validateParams,
  ConnectionRequestSchema,
  ConnectionIdParamSchema,
  ConnectionRequestInput,
  ConnectionIdParamInput
} from '../validation/index.js';

// In-memory fallback list if MongoDB is offline
const inMemoryConnections: IConnection[] = [];

export async function connectionRoutes(fastify: FastifyInstance) {
  // SEARCH USERS TO CONNECT WITH
  fastify.get('/api/connections/search', async (request) => {
    const query = request.query as { query?: string; currentUserId?: string };
    const term = (query.query || '').trim().toLowerCase().replace(/^@+/, '');
    const currentUserId = (query.currentUserId || 'vetriselvan_11').trim().toLowerCase().replace(/^@+/, '');

    if (!term) {
      return { success: true, users: [] };
    }

    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    const userMap = new Map<string, { userId: string; name: string; avatarUrl: string; bio: string }>();

    // 1. Search MongoDB Atlas users
    if (isMongoConnected) {
      try {
        const dbUsers = await UserModel.find({
          userId: { $ne: currentUserId },
          $or: [
            { userId: { $regex: regex } },
            { name: { $regex: regex } },
            { email: { $regex: regex } }
          ]
        })
          .select('userId name avatarUrl bio')
          .limit(10)
          .lean();

        for (const u of dbUsers) {
          userMap.set(u.userId.toLowerCase(), {
            userId: u.userId,
            name: u.name,
            avatarUrl: u.avatarUrl || '',
            bio: u.bio || 'Shareship partner'
          });
        }
      } catch (err) {
        fastify.log.warn('MongoDB user search error: ' + err);
      }
    }

    // 2. Search in-memory users
    for (const [id, u] of inMemoryUsers.entries()) {
      const cleanId = id.toLowerCase();
      if (cleanId === currentUserId) continue;
      if (
        cleanId.includes(term) ||
        (u.name && u.name.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term))
      ) {
        if (!userMap.has(cleanId)) {
          userMap.set(cleanId, {
            userId: u.userId,
            name: u.name,
            avatarUrl: u.avatarUrl || '',
            bio: u.bio || 'Shareship partner'
          });
        }
      }
    }

    // 3. Annotate connection status for each found user
    let userConnections: IConnection[] = [];
    if (isMongoConnected) {
      try {
        userConnections = await ConnectionModel.find({
          $or: [{ requesterUserId: currentUserId }, { recipientUserId: currentUserId }]
        }).lean();
      } catch {}
    }
    if (userConnections.length === 0) {
      userConnections = inMemoryConnections.filter(
        c => c.requesterUserId === currentUserId || c.recipientUserId === currentUserId
      );
    }

    const results = Array.from(userMap.values()).map(u => {
      const uId = u.userId.toLowerCase();
      const conn = userConnections.find(
        c =>
          (c.requesterUserId === uId && c.recipientUserId === currentUserId) ||
          (c.recipientUserId === uId && c.requesterUserId === currentUserId)
      );
      let status: 'none' | 'pending' | 'connected' = 'none';
      let isRequester = false;
      if (conn) {
        status = conn.status;
        isRequester = conn.requesterUserId === currentUserId;
      }

      return {
        ...u,
        status,
        isRequester,
        connectionId: conn?.connectionId
      };
    });

    return {
      success: true,
      users: results
    };
  });

  // SEND CONNECTION REQUEST
  fastify.post('/api/connections/request', { preHandler: validateBody(ConnectionRequestSchema) }, async (request, reply) => {
    const body = request.body as ConnectionRequestInput;
    const cleanTargetId = body.targetUserId.trim().toLowerCase().replace(/^@+/, '');
    const cleanRequesterId = (body.requesterUserId || 'vetriselvan_11').trim().toLowerCase().replace(/^@+/, '');

    // Prevent connecting with oneself
    if (cleanTargetId === cleanRequesterId) {
      return reply.code(400).send({
        success: false,
        error: 'You cannot connect with your own User ID.'
      });
    }

    // Lookup target user in MongoDB or in-memory
    let targetUser: any = null;
    let requesterUser: any = null;

    if (isMongoConnected) {
      try {
        const escaped = cleanTargetId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        targetUser = await UserModel.findOne({
          $or: [
            { userId: cleanTargetId },
            { email: cleanTargetId },
            { userId: { $regex: new RegExp(`^${escaped}$`, 'i') } },
            { email: { $regex: new RegExp(`^${escaped}$`, 'i') } }
          ]
        }).lean();

        requesterUser = await UserModel.findOne({ userId: cleanRequesterId }).lean();
      } catch (err) {
        fastify.log.warn('MongoDB lookup for connection: ' + err);
      }
    }

    if (!targetUser) {
      return reply.code(404).send({
        success: false,
        error: `User '@${cleanTargetId}' not found. Please verify the User ID.`
      });
    }

    const requesterName = requesterUser?.name || 'You';
    const requesterAvatar = requesterUser?.avatarUrl || '';
    const recipientName = targetUser.name || cleanTargetId;
    const recipientAvatar = targetUser.avatarUrl || '';

    // Check if an existing connection already exists
    let existing: IConnection | null = null;
    if (isMongoConnected) {
      try {
        existing = await ConnectionModel.findOne({
          $or: [
            { requesterUserId: cleanRequesterId, recipientUserId: cleanTargetId },
            { requesterUserId: cleanTargetId, recipientUserId: cleanRequesterId }
          ]
        }).lean();
      } catch (err) {
        fastify.log.warn('MongoDB check existing connection: ' + err);
      }
    }

    if (!existing) {
      existing = inMemoryConnections.find(c =>
        (c.requesterUserId === cleanRequesterId && c.recipientUserId === cleanTargetId) ||
        (c.requesterUserId === cleanTargetId && c.recipientUserId === cleanRequesterId)
      ) || null;
    }

    if (existing) {
      if (existing.status === 'connected') {
        return reply.code(400).send({
          success: false,
          error: `You are already connected with @${cleanTargetId} (${recipientName}).`
        });
      }
      if (existing.status === 'pending') {
        return reply.code(400).send({
          success: false,
          error: `A connection request with @${cleanTargetId} is already pending.`
        });
      }
    }

    const newConnection: IConnection = {
      connectionId: `conn_${cleanTargetId}_${Date.now().toString(36)}`,
      requesterUserId: cleanRequesterId,
      recipientUserId: cleanTargetId,
      requesterName,
      recipientName,
      requesterAvatarUrl: requesterAvatar,
      recipientAvatarUrl: recipientAvatar,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    if (isMongoConnected) {
      try {
        await ConnectionModel.create(newConnection);

        // Create a pending friend request specifically targeted at recipientUserId (cleanTargetId)
        await PendingFriendRequestModel.create({
          id: newConnection.connectionId,
          recipientUserId: cleanTargetId,
          requesterUserId: cleanRequesterId,
          userId: cleanTargetId,
          name: requesterName,
          handle: `@${cleanRequesterId}`,
          avatarUrl: requesterAvatar,
          status: 'pending',
          mutualCount: 1,
          timestamp: newConnection.createdAt
        });

        // 1. Notification for the recipient user (User B) that they received a request
        await ActivityNotificationModel.create({
          id: `notif_conn_recv_${Date.now()}`,
          userId: cleanTargetId,
          relatedUserId: cleanRequesterId,
          type: 'gift_sync',
          title: 'Connection Request',
          description: `${requesterName} (@${cleanRequesterId}) sent you a partner connection request.`,
          timeAgo: 'Just now',
          iconType: 'heart',
          isRead: false,
          timestamp: newConnection.createdAt
        });

        // 2. Notification for the requester user (User A) that their request was sent
        await ActivityNotificationModel.create({
          id: `notif_conn_sent_${Date.now()}`,
          userId: cleanRequesterId,
          relatedUserId: cleanTargetId,
          type: 'gift_sync',
          title: 'Connection Request Sent',
          description: `You sent a connection request to ${recipientName} (@${cleanTargetId}).`,
          timeAgo: 'Just now',
          iconType: 'heart',
          isRead: false,
          timestamp: newConnection.createdAt
        });
      } catch (err) {
        fastify.log.error('Failed to persist connection to MongoDB: ' + err);
      }
    }

    inMemoryConnections.unshift(newConnection);

    return reply.code(201).send({
      success: true,
      message: `Connection request sent to @${cleanTargetId} (${recipientName})!`,
      connection: newConnection
    });
  });

  // GET CURRENT PARTNER CONNECTION STATUS
  fastify.get('/api/connections/partner', async (request, reply) => {
    const query = request.query as { userId?: string };
    const currentUserId = (query.userId || 'vetriselvan_11').trim().toLowerCase().replace(/^@+/, '');

    let connected: IConnection | null = null;
    let pending: IConnection | null = null;

    if (isMongoConnected) {
      try {
        connected = await ConnectionModel.findOne({
          status: 'connected',
          $or: [{ requesterUserId: currentUserId }, { recipientUserId: currentUserId }]
        }).sort({ connectedAt: -1 }).lean();

        if (!connected) {
          pending = await ConnectionModel.findOne({
            status: 'pending',
            $or: [{ requesterUserId: currentUserId }, { recipientUserId: currentUserId }]
          }).sort({ createdAt: -1 }).lean();
        }
      } catch (err) {
        fastify.log.warn('MongoDB query for partner connection: ' + err);
      }
    }

    if (!connected) {
      connected = inMemoryConnections.find(
        c => c.status === 'connected' && (c.requesterUserId === currentUserId || c.recipientUserId === currentUserId)
      ) || null;
    }

    if (connected) {
      const isRequester = connected.requesterUserId === currentUserId;
      const partner = {
        userId: isRequester ? connected.recipientUserId : connected.requesterUserId,
        name: isRequester ? connected.recipientName : connected.requesterName,
        avatarUrl: isRequester ? connected.recipientAvatarUrl : connected.requesterAvatarUrl,
        status: 'connected',
        connectedAt: connected.connectedAt || connected.createdAt
      };

      return {
        success: true,
        connected: true,
        partner
      };
    }

    if (pending) {
      const isRequester = pending.requesterUserId === currentUserId;
      const partner = {
        userId: isRequester ? pending.recipientUserId : pending.requesterUserId,
        name: isRequester ? pending.recipientName : pending.requesterName,
        avatarUrl: isRequester ? pending.recipientAvatarUrl : pending.requesterAvatarUrl,
        status: 'pending',
        isRequester,
        createdAt: pending.createdAt
      };

      return {
        success: true,
        connected: false,
        pendingPartner: partner
      };
    }

    return {
      success: true,
      connected: false,
      partner: null
    };
  });

  // GET ALL CONNECTIONS FOR CURRENT USER
  fastify.get('/api/connections', async (request) => {
    const query = request.query as { userId?: string };
    const currentUserId = (query.userId || 'vetriselvan_11').trim().toLowerCase().replace(/^@+/, '');

    let list = inMemoryConnections;
    if (isMongoConnected) {
      try {
        const dbList = await ConnectionModel.find({
          $or: [{ requesterUserId: currentUserId }, { recipientUserId: currentUserId }]
        }).sort({ createdAt: -1 }).lean();

        if (dbList && dbList.length > 0) {
          list = dbList;
        }
      } catch (err) {
        fastify.log.warn('MongoDB list connections: ' + err);
      }
    }

    return {
      success: true,
      count: list.length,
      connections: list
    };
  });

  // ACCEPT CONNECTION
  fastify.post('/api/connections/:connectionId/accept', { preHandler: validateParams(ConnectionIdParamSchema) }, async (request, reply) => {
    const { connectionId } = request.params as ConnectionIdParamInput;

    let targetConn: IConnection | null = null;
    const now = new Date().toISOString();

    if (isMongoConnected) {
      try {
        targetConn = await ConnectionModel.findOneAndUpdate(
          { connectionId },
          { $set: { status: 'connected', connectedAt: now } },
          { new: true }
        ).lean();

        await PendingFriendRequestModel.findOneAndUpdate(
          { id: connectionId },
          { $set: { status: 'accepted' } }
        );

        if (targetConn) {
          // Notify requester (User A)
          await ActivityNotificationModel.create({
            id: `notif_conn_acc_${Date.now()}_req`,
            userId: targetConn.requesterUserId,
            relatedUserId: targetConn.recipientUserId,
            type: 'gift_sync',
            title: 'Connection Accepted',
            description: `${targetConn.recipientName} (@${targetConn.recipientUserId}) accepted your connection request! You are now connected.`,
            timeAgo: 'Just now',
            iconType: 'heart',
            isRead: false,
            timestamp: now
          });

          // Notify recipient (User B)
          await ActivityNotificationModel.create({
            id: `notif_conn_acc_${Date.now()}_rec`,
            userId: targetConn.recipientUserId,
            relatedUserId: targetConn.requesterUserId,
            type: 'gift_sync',
            title: 'Connected with Partner',
            description: `You are now connected with ${targetConn.requesterName} (@${targetConn.requesterUserId})!`,
            timeAgo: 'Just now',
            iconType: 'heart',
            isRead: false,
            timestamp: now
          });
        }
      } catch (err) {
        fastify.log.warn('MongoDB update connection: ' + err);
      }
    }

    if (!targetConn) {
      const idx = inMemoryConnections.findIndex(c => c.connectionId === connectionId);
      if (idx !== -1) {
        inMemoryConnections[idx].status = 'connected';
        inMemoryConnections[idx].connectedAt = now;
        targetConn = inMemoryConnections[idx];
      }
    }

    if (!targetConn) {
      return reply.code(404).send({ success: false, error: 'Connection not found.' });
    }

    return {
      success: true,
      message: `Connected with ${targetConn.requesterName} (@${targetConn.requesterUserId})!`,
      connection: targetConn
    };
  });

  // DECLINE CONNECTION
  fastify.post('/api/connections/:connectionId/decline', { preHandler: validateParams(ConnectionIdParamSchema) }, async (request, reply) => {
    const { connectionId } = request.params as ConnectionIdParamInput;

    if (isMongoConnected) {
      try {
        await ConnectionModel.findOneAndUpdate(
          { connectionId },
          { $set: { status: 'declined' } }
        );
      } catch (err) {
        fastify.log.warn('MongoDB decline connection: ' + err);
      }
    }

    const idx = inMemoryConnections.findIndex(c => c.connectionId === connectionId);
    if (idx !== -1) {
      inMemoryConnections[idx].status = 'declined';
    }

    return {
      success: true,
      message: 'Connection declined.'
    };
  });
}

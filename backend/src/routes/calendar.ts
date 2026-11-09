import { FastifyInstance } from 'fastify';
import { syncManager } from '../plugins/sync.js';
import { CalendarEventModel, RegistryItemModel, ICalendarEvent, IRegistryItem, ConnectionModel, UserModel } from '../models/index.js';
import { isMongoConnected } from '../db/connection.js';
import { validateBody, CreateCalendarEventSchema, CreateRegistryItemSchema, CreateCalendarEventInput, CreateRegistryItemInput } from '../validation/index.js';

interface CalendarEventItem {
  id: string;
  userId?: string;
  title: string;
  date: string;
  time: string;
  location: string;
  creator: string;
  creatorRole: 'me' | 'partner';
  gift?: string;
  giftAmount: number;
  category: string;
  icon: string;
  createdAt?: Date;
}

interface RegistryItem {
  id: string;
  recipient: string;
  initials: string;
  occasion: string;
  date: string;
  amount: number;
  giftType: string;
  creator: string;
  creatorRole: 'me' | 'partner';
  status: 'Fulfilled' | 'Pending Wrap' | 'Idea Saved';
}

// In-memory fallback list if MongoDB is offline (no dummy initial data)
const inMemoryEvents: CalendarEventItem[] = [];

const mockRegistry: RegistryItem[] = [];

export async function calendarRoutes(fastify: FastifyInstance) {
  fastify.get('/api/calendar/events', async (request) => {
    const query = request.query as { userId?: string };
    const currentUserId = (query.userId || '').trim().toLowerCase().replace(/^@+/, '');

    const allowedUserIds = new Set<string>();
    if (currentUserId) {
      allowedUserIds.add(currentUserId);
      if (isMongoConnected) {
        try {
          const partnerConn = await ConnectionModel.findOne({
            status: 'connected',
            $or: [{ requesterUserId: currentUserId }, { recipientUserId: currentUserId }]
          }).lean();
          if (partnerConn) {
            const partnerId = partnerConn.requesterUserId === currentUserId
              ? partnerConn.recipientUserId
              : partnerConn.requesterUserId;
            if (partnerId) allowedUserIds.add(partnerId.toLowerCase());
          }
        } catch (err) {
          fastify.log.warn('MongoDB partner lookup error for calendar: ' + err);
        }
      }
    }

    let events: CalendarEventItem[] = [];
    if (isMongoConnected) {
      try {
        let filter: any = {};
        if (allowedUserIds.size > 0) {
          const idList = Array.from(allowedUserIds);
          filter = {
            $or: [
              { userId: { $in: idList } },
              { userId: '' },
              { userId: { $exists: false } }
            ]
          };
        }
        const dbEvents = await CalendarEventModel.find(filter).sort({ date: 1 }).lean();
        
        // Resolve real user names from UserModel
        const allEventUserIds = Array.from(new Set(dbEvents.map(e => e.userId).filter((id): id is string => Boolean(id))));
        const userMap = new Map<string, string>();
        if (allEventUserIds.length > 0) {
          try {
            const userDocs = await UserModel.find({ userId: { $in: allEventUserIds } }).select('userId name').lean();
            for (const u of userDocs as any[]) {
              if (u.name) userMap.set(u.userId.toLowerCase(), u.name);
            }
          } catch {}
        }

        events = dbEvents.map(e => {
          const isMe = Boolean(currentUserId && e.userId && e.userId.toLowerCase() === currentUserId);
          let realName = e.creator;
          if (e.userId && userMap.has(e.userId.toLowerCase())) {
            realName = userMap.get(e.userId.toLowerCase())!;
          } else if (!realName) {
            realName = isMe ? 'You' : 'Partner';
          }
          return {
            id: e.id,
            userId: e.userId,
            title: e.title,
            date: e.date,
            time: e.time,
            location: e.location,
            creator: realName,
            creatorRole: isMe ? 'me' : 'partner',
            gift: e.gift || '',
            giftAmount: e.giftAmount || 0,
            category: (e.category as any) || 'Event',
            icon: (e.icon as any) || 'celebration',
            createdAt: e.createdAt
          };
        });
      } catch (err) {
        fastify.log.warn('MongoDB query fallback to in-memory events: ' + err);
      }
    }

    if (events.length === 0 && inMemoryEvents.length > 0) {
      events = inMemoryEvents.filter(e => {
        if (allowedUserIds.size === 0) return true;
        if (!e.userId) return true;
        return allowedUserIds.has(e.userId.toLowerCase());
      });
    }

    return {
      success: true,
      events,
      count: events.length
    };
  });

  fastify.post('/api/calendar/events', { preHandler: validateBody(CreateCalendarEventSchema) }, async (request, reply) => {
    const body = request.body as CreateCalendarEventInput;
    const authorUserId = (body.userId || '').trim().toLowerCase().replace(/^@+/, '');
    
    // Resolve author name from UserModel
    let authorName = body.creator;
    if (isMongoConnected && authorUserId) {
      try {
        const u = await UserModel.findOne({ userId: authorUserId }).select('name').lean();
        if (u?.name) {
          authorName = u.name;
        }
      } catch (err) {}
    }
    if (!authorName || authorName === 'You') {
      authorName = authorUserId || 'You';
    }

    const newEvent: CalendarEventItem = {
      id: `evt_${Date.now()}`,
      userId: authorUserId,
      title: body.title,
      date: body.date,
      time: body.time || '12:00 PM',
      location: body.location || '',
      creator: authorName,
      creatorRole: 'me',
      gift: body.gift || '',
      giftAmount: body.giftAmount || 0,
      category: body.category || 'Event',
      icon: body.icon || 'celebration',
      createdAt: new Date()
    };

    if (isMongoConnected) {
      try {
        await CalendarEventModel.create(newEvent);
      } catch (err) {
        fastify.log.error('Failed to persist event in MongoDB: ' + err);
      }
    }
    inMemoryEvents.unshift(newEvent);

    // Broadcast sync event to partner
    syncManager.publishSyncEvent('shareship-space', {
      spaceId: 'shareship-space',
      authorId: authorUserId,
      authorRole: 'me',
      authorName: newEvent.creator,
      type: 'calendar',
      action: 'create',
      payload: { title: newEvent.title, date: newEvent.date, gift: newEvent.gift, location: newEvent.location }
    });

    return reply.code(201).send({ success: true, event: newEvent });
  });

  fastify.get('/api/calendar/registry', async () => {
    let registry = mockRegistry;
    if (isMongoConnected) {
      try {
        const dbRegistry = await RegistryItemModel.find().lean();
        if (dbRegistry && dbRegistry.length > 0) {
          registry = dbRegistry.map(r => ({
            id: r.id,
            recipient: r.recipient,
            initials: r.initials,
            occasion: r.occasion,
            date: r.date,
            amount: r.amount,
            giftType: r.giftType,
            creator: r.creator,
            creatorRole: r.creatorRole as 'me' | 'partner',
            status: r.status as any
          }));
        }
      } catch (err) {
        fastify.log.warn('MongoDB query fallback to in-memory registry: ' + err);
      }
    }

    return {
      success: true,
      registry
    };
  });

  fastify.post('/api/calendar/registry', { preHandler: validateBody(CreateRegistryItemSchema) }, async (request, reply) => {
    const body = request.body as CreateRegistryItemInput;
    const authorName = body.creator || 'You';
    const newRegItem: RegistryItem = {
      id: `reg_${Date.now()}`,
      recipient: body.recipient,
      initials: (body.recipient || 'NF').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      occasion: body.occasion || 'Celebration',
      date: body.date || 'Oct 2025',
      amount: body.amount || 100,
      giftType: body.giftType || 'Gift Card',
      creator: authorName,
      creatorRole: body.creatorRole || 'me',
      status: body.status || 'Idea Saved'
    };

    if (isMongoConnected) {
      try {
        await RegistryItemModel.create(newRegItem);
      } catch (err) {
        fastify.log.error('Failed to persist registry item in MongoDB: ' + err);
      }
    }
    mockRegistry.push(newRegItem);

    syncManager.publishSyncEvent('shareship-space', {
      spaceId: 'shareship-space',
      authorId: 'user_active',
      authorRole: 'me',
      authorName,
      type: 'note',
      action: 'create',
      payload: { title: `Added registry item for ${newRegItem.recipient} ($${newRegItem.amount})` }
    });

    return { success: true, item: newRegItem };
  });
}

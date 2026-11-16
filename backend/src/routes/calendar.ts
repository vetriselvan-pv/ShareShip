import { FastifyInstance } from 'fastify';
import { syncManager } from '../plugins/sync.js';
import { CalendarEventModel, RegistryItemModel, ICalendarEvent, IRegistryItem, ConnectionModel, UserModel } from '../models/index.js';
import { isMongoConnected } from '../db/connection.js';
import { validateBody, CreateCalendarEventSchema, UpdateCalendarEventSchema, CreateRegistryItemSchema, CreateCalendarEventInput, UpdateCalendarEventInput, CreateRegistryItemInput } from '../validation/index.js';

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
  relativeId?: string;
  relativeName?: string;
  relativeVillage?: string;
  recipient: string;
  initials: string;
  occasion: string;
  type?: 'credit' | 'debit';
  date: string;
  amount: number;
  notes?: string;
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
    const currentUserId = (request.user?.userId || query.userId || '').trim().toLowerCase().replace(/^@+/, '');

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
    const authorUserId = (request.user?.userId || body.userId || '').trim().toLowerCase().replace(/^@+/, '');
    
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

  // PUT /api/calendar/events/:id - Update an existing calendar event
  fastify.put('/api/calendar/events/:id', { preHandler: validateBody(UpdateCalendarEventSchema) }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateCalendarEventInput;
    const currentUserId = (request.user?.userId || '').trim().toLowerCase().replace(/^@+/, '');

    let updatedEvent: CalendarEventItem | null = null;

    if (isMongoConnected) {
      try {
        const updateData: any = {};
        if (body.title !== undefined) updateData.title = body.title.trim();
        if (body.date !== undefined) updateData.date = body.date;
        if (body.time !== undefined) updateData.time = body.time;
        if (body.location !== undefined) updateData.location = body.location.trim();
        if (body.gift !== undefined) updateData.gift = body.gift.trim();
        if (body.giftAmount !== undefined) updateData.giftAmount = body.giftAmount;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.icon !== undefined) updateData.icon = body.icon;

        const doc = await CalendarEventModel.findOneAndUpdate({ id }, { $set: updateData }, { new: true }).lean();
        if (doc) {
          const isMe = Boolean(currentUserId && doc.userId && doc.userId.toLowerCase() === currentUserId);
          let realName = doc.creator;
          if (doc.userId) {
            try {
              const u = await UserModel.findOne({ userId: doc.userId }).select('name').lean();
              if (u?.name) realName = u.name;
            } catch {}
          }
          updatedEvent = {
            id: doc.id,
            userId: doc.userId,
            title: doc.title,
            date: doc.date,
            time: doc.time,
            location: doc.location,
            creator: realName || (isMe ? 'You' : 'Partner'),
            creatorRole: isMe ? 'me' : 'partner',
            gift: doc.gift || '',
            giftAmount: doc.giftAmount || 0,
            category: doc.category || 'Event',
            icon: doc.icon || 'celebration',
            createdAt: doc.createdAt
          };
        }
      } catch (err) {
        fastify.log.warn('MongoDB event update error: ' + err);
      }
    }

    // Update in-memory event list fallback
    const memIdx = inMemoryEvents.findIndex(e => e.id === id);
    if (memIdx !== -1) {
      inMemoryEvents[memIdx] = {
        ...inMemoryEvents[memIdx],
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.date !== undefined ? { date: body.date } : {}),
        ...(body.time !== undefined ? { time: body.time } : {}),
        ...(body.location !== undefined ? { location: body.location.trim() } : {}),
        ...(body.gift !== undefined ? { gift: body.gift.trim() } : {}),
        ...(body.giftAmount !== undefined ? { giftAmount: body.giftAmount } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.icon !== undefined ? { icon: body.icon } : {})
      };
      if (!updatedEvent) {
        updatedEvent = inMemoryEvents[memIdx];
      }
    }

    if (!updatedEvent) {
      return reply.code(404).send({ success: false, error: 'Event not found' });
    }

    // Broadcast sync event to partner
    syncManager.publishSyncEvent('shareship-space', {
      spaceId: 'shareship-space',
      authorId: currentUserId || 'user_active',
      authorRole: 'me',
      authorName: updatedEvent.creator,
      type: 'calendar',
      action: 'update',
      payload: {
        id: updatedEvent.id,
        title: updatedEvent.title,
        date: updatedEvent.date,
        gift: updatedEvent.gift,
        location: updatedEvent.location
      }
    });

    return reply.send({ success: true, event: updatedEvent });
  });

  // DELETE /api/calendar/events/:id - Delete a calendar event
  fastify.delete('/api/calendar/events/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUserId = (request.user?.userId || '').trim().toLowerCase().replace(/^@+/, '');

    let deletedTitle = 'Event';

    if (isMongoConnected) {
      try {
        const existing = await CalendarEventModel.findOne({ id }).lean();
        if (existing) {
          deletedTitle = existing.title;
          await CalendarEventModel.deleteOne({ id });
        }
      } catch (err) {
        fastify.log.warn('MongoDB event delete error: ' + err);
      }
    }

    const idx = inMemoryEvents.findIndex(e => e.id === id);
    if (idx !== -1) {
      deletedTitle = inMemoryEvents[idx].title;
      inMemoryEvents.splice(idx, 1);
    }

    // Broadcast sync event to partner
    syncManager.publishSyncEvent('shareship-space', {
      spaceId: 'shareship-space',
      authorId: currentUserId || 'user_active',
      authorRole: 'me',
      authorName: 'User',
      type: 'calendar',
      action: 'delete',
      payload: { id, title: deletedTitle }
    });

    return reply.send({ success: true, message: `Event "${deletedTitle}" deleted successfully` });
  });

  // GET /api/calendar/occasions - returns distinct occasions list (user events + recorded registry occasions)
  fastify.get('/api/calendar/occasions', async () => {
    const occasionsSet = new Set<string>();

    if (isMongoConnected) {
      try {
        const events = await CalendarEventModel.find().select('title').lean();
        events.forEach(e => {
          if (e.title && e.title.trim()) occasionsSet.add(e.title.trim());
        });
        const regItems = await RegistryItemModel.find().select('occasion').lean();
        regItems.forEach(r => {
          if (r.occasion && r.occasion.trim()) occasionsSet.add(r.occasion.trim());
        });
      } catch (err) {
        fastify.log.warn('MongoDB occasions query fallback: ' + err);
      }
    }

    inMemoryEvents.forEach(e => {
      if (e.title && e.title.trim()) occasionsSet.add(e.title.trim());
    });
    mockRegistry.forEach(r => {
      if (r.occasion && r.occasion.trim()) occasionsSet.add(r.occasion.trim());
    });

    return {
      success: true,
      occasions: Array.from(occasionsSet)
    };
  });

  fastify.get('/api/calendar/registry', async (request) => {
    const query = request.query as { occasion?: string; name?: string; type?: string };
    const occasionFilter = (query.occasion || '').trim();
    const nameFilter = (query.name || '').trim().toLowerCase();
    const typeFilter = (query.type || '').trim().toLowerCase();

    let registry = mockRegistry;
    if (isMongoConnected) {
      try {
        let filter: any = {};
        if (occasionFilter && occasionFilter.toLowerCase() !== 'all') {
          filter.occasion = { $regex: new RegExp(`^${occasionFilter}$`, 'i') };
        }
        if (typeFilter && typeFilter !== 'all') {
          filter.type = typeFilter;
        }
        if (nameFilter) {
          filter.$or = [
            { relativeName: { $regex: nameFilter, $options: 'i' } },
            { recipient: { $regex: nameFilter, $options: 'i' } },
            { relativeVillage: { $regex: nameFilter, $options: 'i' } },
          ];
        }

        const dbRegistry = await RegistryItemModel.find(filter).sort({ createdAt: -1 }).lean();
        if (dbRegistry) {
          registry = dbRegistry.map(r => ({
            id: r.id,
            relativeId: r.relativeId || '',
            relativeName: r.relativeName || r.recipient,
            relativeVillage: r.relativeVillage || '',
            recipient: r.recipient,
            initials: r.initials,
            occasion: r.occasion,
            type: (r.type as 'credit' | 'debit') || 'credit',
            date: r.date,
            amount: r.amount,
            notes: r.notes || '',
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

    if (!isMongoConnected || registry === mockRegistry) {
      if (occasionFilter && occasionFilter.toLowerCase() !== 'all') {
        registry = registry.filter(r => r.occasion && r.occasion.toLowerCase() === occasionFilter.toLowerCase());
      }
      if (typeFilter && typeFilter !== 'all') {
        registry = registry.filter(r => (r.type || 'credit') === typeFilter);
      }
      if (nameFilter) {
        registry = registry.filter(r =>
          (r.relativeName && r.relativeName.toLowerCase().includes(nameFilter)) ||
          (r.recipient && r.recipient.toLowerCase().includes(nameFilter)) ||
          (r.relativeVillage && r.relativeVillage.toLowerCase().includes(nameFilter))
        );
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
    const relativeName = (body.relativeName || body.recipient || 'Guest').trim();
    const initials = (body.initials || relativeName.split(' ').map(n => n[0]).join('').substring(0, 2)).toUpperCase() || 'GL';
    const giftType = body.giftType || (body.type === 'debit' ? 'Gift Given' : 'Gift Received');
    const todayStr = body.date || new Date().toISOString().split('T')[0];

    const newRegItem: RegistryItem = {
      id: `reg_${Date.now()}`,
      relativeId: body.relativeId || '',
      relativeName: relativeName,
      relativeVillage: (body.relativeVillage || '').trim(),
      recipient: relativeName,
      initials,
      occasion: body.occasion || 'Celebration',
      type: body.type || 'credit',
      date: todayStr,
      amount: body.amount || 0,
      notes: (body.notes || '').trim(),
      giftType,
      creator: authorName,
      creatorRole: body.creatorRole || 'me',
      status: body.status || 'Fulfilled'
    };

    if (isMongoConnected) {
      try {
        await RegistryItemModel.create(newRegItem);
      } catch (err) {
        fastify.log.error('Failed to persist registry item in MongoDB: ' + err);
      }
    }
    mockRegistry.unshift(newRegItem);

    syncManager.publishSyncEvent('shareship-space', {
      spaceId: 'shareship-space',
      authorId: 'user_active',
      authorRole: 'me',
      authorName,
      type: 'note',
      action: 'create',
      payload: {
        title: `${authorName} recorded ${newRegItem.type === 'debit' ? 'given' : 'received'} gift of ₹${newRegItem.amount} for ${newRegItem.occasion} (${newRegItem.recipient})`
      }
    });

    return reply.code(201).send({ success: true, item: newRegItem });
  });

  // DELETE /api/calendar/registry/:id - Delete registry item
  fastify.delete('/api/calendar/registry/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    if (isMongoConnected) {
      try {
        await RegistryItemModel.deleteOne({ id });
      } catch (err) {
        fastify.log.warn('MongoDB registry delete fallback: ' + err);
      }
    }

    const idx = mockRegistry.findIndex(r => r.id === id);
    if (idx !== -1) {
      mockRegistry.splice(idx, 1);
    }

    return { success: true, message: `Gift item ${id} deleted` };
  });
}

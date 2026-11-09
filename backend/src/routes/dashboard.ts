import { FastifyInstance } from 'fastify';
import { syncManager } from '../plugins/sync.js';
import { CalendarEventModel, ExpenseTransactionModel, RegistryItemModel } from '../models/index.js';
import { isMongoConnected } from '../db/connection.js';

export async function dashboardRoutes(fastify: FastifyInstance) {
  // Get full dashboard data
  fastify.get('/api/dashboard', async (request, reply) => {
    let upcomingEvent = null;
    let transactions: any[] = [];
    let gifts: any[] = [];

    if (isMongoConnected) {
      try {
        const dbEvent = await CalendarEventModel.findOne().sort({ date: 1 }).lean();
        if (dbEvent) {
          upcomingEvent = {
            id: dbEvent.id,
            badge: dbEvent.category || 'Upcoming Event',
            countdown: dbEvent.date,
            title: dbEvent.title,
            location: `${dbEvent.date} • ${dbEvent.location}`,
            giftAttribution: dbEvent.gift ? `Gift: ${dbEvent.gift}` : '',
            itinerary: []
          };
        }

        const dbTx = await ExpenseTransactionModel.find().sort({ createdAt: -1 }).limit(5).lean();
        if (dbTx) {
          transactions = dbTx.map(t => ({
            id: t.id,
            title: t.title,
            author: t.author,
            authorInitial: (t.author || 'U').charAt(0).toUpperCase(),
            authorRole: t.authorRole,
            amount: t.amount
          }));
        }

        const dbReg = await RegistryItemModel.find().sort({ createdAt: -1 }).limit(5).lean();
        if (dbReg) {
          gifts = dbReg.map(r => ({
            id: r.id,
            title: `${r.occasion} for ${r.recipient}`,
            status: r.status,
            context: r.giftType,
            claimedBy: r.creator,
            claimedRole: r.creatorRole,
            claimedInitial: (r.creator || 'U').charAt(0).toUpperCase(),
            imageUrl: ''
          }));
        }
      } catch (err) {
        fastify.log.warn('Dashboard fetch fallback: ' + err);
      }
    }

    return {
      upcomingEvent,
      expenses: {
        monthTotal: transactions.reduce((acc, t) => acc + Math.abs(t.amount || 0), 0),
        yourBalance: 0,
        balanceStatus: 'Balanced',
        transactions
      },
      gifts,
      dateNightSuggestions: []
    };
  });

  // Action: Settle up balance and notify partner via WebSocket
  fastify.post('/api/dashboard/settle-up', async (request, reply) => {
    const body = request.body as { amount?: number; partnerName?: string; spaceId?: string };
    const amount = body.amount || 0;
    const partnerName = body.partnerName || 'Partner';
    const spaceId = body.spaceId || 'shareship-space';

    syncManager.publishSyncEvent(spaceId, {
      spaceId,
      authorId: 'user_active',
      authorRole: 'me',
      authorName: 'You',
      type: 'expense',
      action: 'update',
      payload: {
        title: `Settled up balance ($${amount.toFixed(2)}) with ${partnerName}`,
        amount,
        status: 'settled',
        timestamp: new Date().toISOString()
      }
    });

    return {
      success: true,
      message: `Payment transfer of $${amount.toFixed(2)} to ${partnerName} initiated.`,
      newBalance: 0.00
    };
  });
}

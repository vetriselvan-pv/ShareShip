import { FastifyInstance } from 'fastify';
import { ExpenseTransactionModel, EventExpenseModel, ConnectionModel, UserModel } from '../models/index.js';
import { isMongoConnected } from '../db/connection.js';
import { validateBody, CreateExpenseSchema, CreateExpenseInput } from '../validation/index.js';

export type ExpenseCategoryName = 'Gift' | 'Utilities' | 'Food' | 'Home Expenses' | 'Travel' | 'Cattle' | 'Lifestyle';

export interface ExpenseTransaction {
  id: string;
  userId?: string;
  title: string;
  category: ExpenseCategoryName | string;
  amount: number;
  paidBy: string;
  splitType: 'split_50_50' | 'owes_half' | 'covered_by_you' | 'custom' | string;
  splitLabel: string;
  iconType: string;
  timestamp: string;
  expenseType: 'monthly' | 'event';
  eventId?: string;
  eventTitle?: string;
}

export interface ExpenseCategory {
  id: string;
  name: ExpenseCategoryName;
  amount: number;
  transactionCount: number;
  countLabel: string;
  icon: string;
  colorClass: string;
}

export interface EventExpense {
  id: string;
  title: string;
  status: 'Active Trip' | 'Completed';
  spent: number;
  budget: number;
  bgImageUrl: string;
  members: { name: string; avatarUrl: string }[];
  userId?: string;
}

export const CATEGORY_DEFINITIONS: {
  id: string;
  name: ExpenseCategoryName;
  aliases: string[];
  icon: string;
  colorClass: string;
  countSuffix: string;
}[] = [
  { id: 'cat_gift', name: 'Gift', aliases: ['gift', 'gifts'], icon: 'gift', colorClass: 'bg-[#fed65b] text-[#745c00]', countSuffix: 'gifts' },
  { id: 'cat_utilities', name: 'Utilities', aliases: ['utilities', 'util', 'bills', 'bill'], icon: 'bolt', colorClass: 'bg-[#7a9a8b] text-[#133126]', countSuffix: 'bills paid' },
  { id: 'cat_food', name: 'Food', aliases: ['food', 'dining', 'meals', 'grocery'], icon: 'coffee', colorClass: 'bg-[#c8ead9] text-[#012016]', countSuffix: 'orders' },
  { id: 'cat_home', name: 'Home Expenses', aliases: ['home expenses', 'home', 'house', 'household'], icon: 'home', colorClass: 'bg-[#e6ddc8] text-[#422e16]', countSuffix: 'expenses' },
  { id: 'cat_travel', name: 'Travel', aliases: ['travel', 'flight', 'trip', 'transport'], icon: 'flight', colorClass: 'bg-[#ffe088] text-[#241a00]', countSuffix: 'bookings' },
  { id: 'cat_cattle', name: 'Cattle', aliases: ['cattle', 'cow', 'farm', 'livestock'], icon: 'cattle', colorClass: 'bg-[#c5e8d1] text-[#0d3f23]', countSuffix: 'records' },
  { id: 'cat_lifestyle', name: 'Lifestyle', aliases: ['lifestyle', 'life', 'wellness', 'shopping'], icon: 'lifestyle', colorClass: 'bg-[#e6d7f8] text-[#3e136b]', countSuffix: 'activities' }
];

// In-memory fallbacks when MongoDB is offline
const transactions: ExpenseTransaction[] = [];
const eventExpensesList: EventExpense[] = [];

export function getCurrencyConfig() {
  return {
    code: process.env.CURRENCY_CODE || 'INR',
    symbol: process.env.CURRENCY_SYMBOL || '₹'
  };
}

export async function expenseRoutes(fastify: FastifyInstance) {
  // GET application/currency configuration from environment
  fastify.get('/api/config', async () => {
    return {
      success: true,
      currency: getCurrencyConfig()
    };
  });

  // GET all expenses data filtered by logged-in user (and partner if connected)
  fastify.get('/api/expenses', async (request) => {
    const query = request.query as { userId?: string };
    const currentUserId = (query.userId || 'vetriselvan_11').trim().toLowerCase().replace(/^@+/, '');

    const allowedUserIds = new Set<string>();
    if (currentUserId) {
      allowedUserIds.add(currentUserId);
    }

    let partnerId = '';
    let partnerName = 'Partner';
    let currentUserName = 'You';

    if (isMongoConnected && currentUserId) {
      try {
        const [partnerConn, currentUserDoc] = await Promise.all([
          ConnectionModel.findOne({
            status: 'connected',
            $or: [{ requesterUserId: currentUserId }, { recipientUserId: currentUserId }]
          }).lean(),
          UserModel.findOne({ userId: currentUserId }).select('name').lean()
        ]);

        if (currentUserDoc?.name) {
          currentUserName = currentUserDoc.name;
        }

        if (partnerConn) {
          partnerId = partnerConn.requesterUserId.toLowerCase() === currentUserId
            ? partnerConn.recipientUserId.toLowerCase()
            : partnerConn.requesterUserId.toLowerCase();
          if (partnerId) {
            allowedUserIds.add(partnerId);
            const partnerDoc = await UserModel.findOne({ userId: partnerId }).select('name').lean();
            if (partnerDoc?.name) {
              partnerName = partnerDoc.name;
            }
          }
        }
      } catch (err) {
        fastify.log.warn('MongoDB partner lookup error for expenses: ' + err);
      }
    }

    let activeTransactions: ExpenseTransaction[] = [];
    let activeEventExpenses: EventExpense[] = [];
    const idList = Array.from(allowedUserIds);
    const userRegexes = idList.map(id => new RegExp(`^${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));

    if (isMongoConnected) {
      try {
        // Query transactions belonging to allowed users or legacy unassigned transactions
        const txFilter: any = {
          $and: [
            { id: { $nin: ['tx_1', 'tx_2', 'tx_3'] } }
          ]
        };

        if (idList.length > 0) {
          txFilter.$and.push({
            $or: [
              { userId: { $in: userRegexes } },
              { userId: '' },
              { userId: { $exists: false } }
            ]
          });
        }

        const dbTx = await ExpenseTransactionModel.find(txFilter).sort({ timestamp: -1 }).lean();

        if (dbTx && dbTx.length > 0) {
          activeTransactions = dbTx.map(t => ({
            id: t.id,
            userId: t.userId,
            title: t.title,
            category: t.category as any,
            amount: t.amount,
            paidBy: t.paidBy,
            splitType: t.splitType as any,
            splitLabel: t.splitLabel,
            iconType: t.iconType as any,
            timestamp: t.timestamp,
            expenseType: (t.expenseType as any) || 'monthly',
            eventId: t.eventId,
            eventTitle: t.eventTitle
          }));
        }

        // Query events belonging to allowed users
        const eventFilter: any = {
          $and: [
            { id: { $nin: ['evt_amalfi', 'evt_birthday'] } }
          ]
        };

        if (idList.length > 0) {
          eventFilter.$and.push({
            $or: [
              { userId: { $in: userRegexes } },
              { 'members.name': { $in: [currentUserName, partnerName] } },
              { userId: '' },
              { userId: { $exists: false } }
            ]
          });
        }

        const dbEvents = await EventExpenseModel.find(eventFilter).lean();

        if (dbEvents && dbEvents.length > 0) {
          activeEventExpenses = dbEvents.map(e => ({
            id: e.id,
            title: e.title,
            status: e.status as any,
            spent: e.spent,
            budget: e.budget,
            bgImageUrl: e.bgImageUrl,
            members: e.members as any,
            userId: e.userId
          }));
        }
      } catch (err) {
        fastify.log.warn('MongoDB query fallback for expenses: ' + err);
      }
    }

    // Fall back to in-memory records if MongoDB has none
    if (activeTransactions.length === 0 && transactions.length > 0) {
      activeTransactions = transactions.filter(t => !t.userId || allowedUserIds.has(t.userId.toLowerCase()));
    }
    if (activeEventExpenses.length === 0 && eventExpensesList.length > 0) {
      activeEventExpenses = eventExpensesList.filter(e => !e.userId || allowedUserIds.has(e.userId.toLowerCase()));
    }

    // Consolidated Total Month: includes both general monthly expenses AND event-specific expenses
    const totalMonth = activeTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
    const consolidatedEventAmount = activeTransactions
      .filter(t => t.expenseType === 'event')
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    const monthlyOnlyAmount = Math.max(0, totalMonth - consolidatedEventAmount);

    // You vs Partner amounts
    const youAmount = activeTransactions.filter(t => {
      if (t.userId && t.userId.toLowerCase() === currentUserId) return true;
      if (t.paidBy === 'You' || (currentUserName && t.paidBy.toLowerCase() === currentUserName.toLowerCase())) return true;
      return false;
    }).reduce((acc, t) => acc + (t.amount || 0), 0);

    const partnerAmount = Math.max(0, totalMonth - youAmount);
    const youPercent = totalMonth > 0 ? Math.round((youAmount / totalMonth) * 100) : 0;
    const partnerPercent = totalMonth > 0 ? 100 - youPercent : 0;

    // Compute all 7 category summaries dynamically from actual transactions
    const categories: ExpenseCategory[] = CATEGORY_DEFINITIONS.map(def => {
      const txs = activeTransactions.filter(t => {
        const catStr = (t.category || '').toLowerCase().trim();
        return def.aliases.some(alias => catStr === alias || catStr.includes(alias));
      });
      const amount = txs.reduce((acc, t) => acc + t.amount, 0);
      return {
        id: def.id,
        name: def.name,
        amount,
        transactionCount: txs.length,
        countLabel: `${txs.length} ${def.countSuffix}`,
        icon: def.icon,
        colorClass: def.colorClass
      };
    });

    return {
      success: true,
      currency: getCurrencyConfig(),
      summary: {
        totalMonth,
        consolidatedEventAmount,
        monthlyOnlyAmount,
        status: totalMonth === 0 ? 'No Expenses' : 'Active',
        you: {
          name: currentUserName || 'You',
          amount: youAmount,
          percentage: youPercent
        },
        partner: {
          name: partnerName,
          amount: partnerAmount,
          percentage: partnerPercent
        }
      },
      categories,
      recentTransactions: activeTransactions,
      eventExpenses: activeEventExpenses
    };
  });

  // POST add new expense
  fastify.post('/api/expenses', { preHandler: validateBody(CreateExpenseSchema) }, async (request, reply) => {
    const body = request.body as CreateExpenseInput;
    const authorUserId = (body.userId || (request.query as any)?.userId || 'vetriselvan_11').trim().toLowerCase().replace(/^@+/, '');

    let paidBy = body.paidBy || 'You';
    if (isMongoConnected && authorUserId) {
      try {
        const u = await UserModel.findOne({ userId: authorUserId }).select('name').lean();
        if (u?.name) {
          paidBy = u.name;
        }
      } catch {}
    }

    // Match input category against the 7 configured options: Gift, Utilities, Food, Home Expenses, Travel, Cattle, Lifestyle
    let cat: ExpenseCategoryName = 'Food';
    const rawCat = (body.category || '').toLowerCase().trim();
    const matchedDef = CATEGORY_DEFINITIONS.find(def =>
      def.aliases.some(alias => rawCat === alias || rawCat.includes(alias))
    );
    if (matchedDef) {
      cat = matchedDef.name;
    }

    let iconType = 'coffee';
    if (cat === 'Gift') iconType = 'gift';
    else if (cat === 'Utilities') iconType = 'bolt';
    else if (cat === 'Food') iconType = 'coffee';
    else if (cat === 'Home Expenses') iconType = 'home';
    else if (cat === 'Travel') iconType = 'flight';
    else if (cat === 'Cattle') iconType = 'cattle';
    else if (cat === 'Lifestyle') iconType = 'lifestyle';

    // Normalize split type (Default: covered 100% by you)
    let splitType: ExpenseTransaction['splitType'] = 'covered_by_you';
    const rawSplit = (body.splitType || '').toLowerCase();
    if (rawSplit.includes('half') || rawSplit.includes('owe')) splitType = 'owes_half';
    else if (rawSplit.includes('covered') || rawSplit.includes('you')) splitType = 'covered_by_you';
    else if (rawSplit.includes('50') || rawSplit.includes('equal')) splitType = 'split_50_50';
    else if (rawSplit.includes('custom')) splitType = 'custom';

    const expenseType = body.expenseType || 'monthly';
    const eventId = body.eventId || '';
    const eventTitle = body.eventTitle || '';
    const amountNum = Number(body.amount);

    const newTx: ExpenseTransaction = {
      id: `tx_${Date.now()}`,
      userId: authorUserId,
      title: body.title,
      category: cat,
      amount: amountNum,
      paidBy,
      splitType,
      splitLabel: body.splitLabel || 'Covered 100% by You',
      iconType,
      timestamp: new Date().toISOString(),
      expenseType,
      eventId,
      eventTitle
    };

    // If event-specific, update event spent in MongoDB & in-memory
    if (expenseType === 'event') {
      let matchedEvtId = eventId;

      if (isMongoConnected) {
        try {
          const queryConditions: any[] = [];
          if (eventId) queryConditions.push({ id: eventId });
          if (eventTitle) queryConditions.push({ title: new RegExp(`^${eventTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });

          let existingMongoEvt = queryConditions.length > 0
            ? await EventExpenseModel.findOne({ $or: queryConditions })
            : null;

          if (existingMongoEvt) {
            matchedEvtId = existingMongoEvt.id;
            await EventExpenseModel.updateOne(
              { id: existingMongoEvt.id },
              { $inc: { spent: amountNum } }
            );
          } else if (eventTitle || eventId) {
            matchedEvtId = eventId || `evt_${Date.now()}`;
            await EventExpenseModel.create({
              id: matchedEvtId,
              title: eventTitle || body.title,
              status: 'Active Trip',
              spent: amountNum,
              budget: Math.max(500, Math.round(amountNum * 1.5)),
              bgImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
              members: [{ name: paidBy, avatarUrl: '' }],
              userId: authorUserId
            });
          }
        } catch (err) {
          fastify.log.warn('MongoDB event expense update error: ' + err);
        }
      }

      // Sync in-memory event list
      const memIndex = eventExpensesList.findIndex(e =>
        (matchedEvtId && e.id === matchedEvtId) ||
        (eventTitle && e.title.toLowerCase() === eventTitle.toLowerCase())
      );
      if (memIndex !== -1) {
        eventExpensesList[memIndex].spent += amountNum;
      } else if (eventTitle || eventId) {
        eventExpensesList.unshift({
          id: matchedEvtId || `evt_${Date.now()}`,
          title: eventTitle || body.title,
          status: 'Active Trip',
          spent: amountNum,
          budget: Math.max(500, Math.round(amountNum * 1.5)),
          bgImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
          members: [{ name: paidBy, avatarUrl: '' }],
          userId: authorUserId
        });
      }
    }

    if (isMongoConnected) {
      try {
        await ExpenseTransactionModel.create(newTx);
      } catch (err) {
        fastify.log.error('Failed to save expense in MongoDB: ' + err);
      }
    }
    transactions.unshift(newTx);

    // Fetch refreshed events list for author
    let currentEvents: EventExpense[] = [];
    if (isMongoConnected) {
      try {
        const dbEvents = await EventExpenseModel.find({
          $and: [
            { id: { $nin: ['evt_amalfi', 'evt_birthday'] } },
            {
              $or: [
                { userId: new RegExp(`^${authorUserId}$`, 'i') },
                { userId: '' },
                { userId: { $exists: false } }
              ]
            }
          ]
        }).lean();
        currentEvents = dbEvents.map(e => ({
          id: e.id,
          title: e.title,
          status: e.status as any,
          spent: e.spent,
          budget: e.budget,
          bgImageUrl: e.bgImageUrl,
          members: e.members as any,
          userId: e.userId
        }));
      } catch {}
    }
    if (currentEvents.length === 0) {
      currentEvents = eventExpensesList.filter(e => !e.userId || e.userId.toLowerCase() === authorUserId);
    }

    return {
      success: true,
      message: expenseType === 'event'
        ? `Event expense "${newTx.title}" added to "${eventTitle || 'Event'}" and consolidated into monthly expenses.`
        : `Monthly expense "${newTx.title}" added successfully.`,
      transaction: newTx,
      currency: getCurrencyConfig(),
      eventExpenses: currentEvents
    };
  });

  // POST settle balance
  fastify.post('/api/expenses/settle', async () => {
    return {
      success: true,
      message: 'All shared balances are settled up!'
    };
  });
}

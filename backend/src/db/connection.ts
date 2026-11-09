import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  CalendarEventModel,
  RegistryItemModel,
  ExpenseTransactionModel,
  EventExpenseModel,
  SharedNoteModel,
  LiveScratchpadModel,
  PendingFriendRequestModel,
  ActivityNotificationModel
} from '../models/index.js';

dotenv.config();

export let isMongoConnected = false;

export async function connectMongoDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://learnerkid_dev:<db_password>@learndev.zitnxvh.mongodb.net/Shareship?retryWrites=true&w=majority';

  if (uri.includes('<db_password>')) {
    console.warn('\n⚠️  [MongoDB] Connection string contains placeholder "<db_password>".');
    console.warn('   Please provide your MongoDB Atlas password in backend/.env:');
    console.warn('   MONGODB_URI=mongodb+srv://learnerkid_dev:YOUR_PASSWORD@learndev.zitnxvh.mongodb.net/Shareship?retryWrites=true&w=majority\n');
    console.warn('   Backend is operating in in-memory fallback mode until password is provided.\n');
    return false;
  }

  try {
    console.log('[MongoDB] Attempting connection to MongoDB Atlas (Shareship database)...');
    await mongoose.connect(uri, {
      dbName: 'Shareship',
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });
    isMongoConnected = true;
    console.log('✓ [MongoDB] Connected successfully to MongoDB Atlas (Shareship database)');

    // Seed initial collections if empty
    await seedInitialDataIfEmpty();
    return true;
  } catch (error) {
    console.error('✘ [MongoDB] Failed to connect to MongoDB Atlas:', (error as Error).message);
    console.warn('   Operating with resilient in-memory data fallback.\n');
    isMongoConnected = false;
    return false;
  }
}

async function seedInitialDataIfEmpty() {
  try {
    // Clean up all mock/dummy documents from MongoDB Atlas
    await Promise.allSettled([
      CalendarEventModel.deleteMany({
        $or: [
          { id: { $in: ['evt_sarah_liam', 'evt_uncle_david', 'evt_emily_marcus'] } },
          { creator: { $in: ['Elena', 'Julian'] } }
        ]
      }),
      RegistryItemModel.deleteMany({
        $or: [
          { id: { $in: ['reg_1', 'reg_2', 'reg_3'] } },
          { creator: { $in: ['Elena', 'Julian'] } }
        ]
      }),
      ExpenseTransactionModel.deleteMany({
        id: { $in: ['tx_1', 'tx_2', 'tx_3'] }
      }),
      EventExpenseModel.deleteMany({
        id: { $in: ['evt_amalfi', 'evt_birthday'] }
      }),
      SharedNoteModel.deleteMany({
        id: { $in: ['note_1', 'note_2', 'note_3'] }
      }),
      LiveScratchpadModel.deleteMany({
        lastEditor: { $in: ['Elena', 'Julian'] }
      }),
      ActivityNotificationModel.deleteMany({ id: { $in: ['notif_1', 'notif_2', 'notif_3', 'notif_4'] } }),
      PendingFriendRequestModel.deleteMany({ id: { $in: ['req_marcus', 'req_chloe'] } })
    ]);
    console.log('✓ [MongoDB] Cleaned up mock data; no dummy records seeded');
  } catch (err) {
    console.error('Error during initial MongoDB data cleanup:', err);
  }
}


import mongoose, { Schema } from 'mongoose';

export type ExpenseCategoryType = 'Gift' | 'Utilities' | 'Food' | 'Home Expenses' | 'Travel' | 'Cattle' | 'Lifestyle';

export interface IExpenseTransaction {
  id: string;
  userId?: string;
  title: string;
  category: ExpenseCategoryType | string;
  amount: number;
  paidBy: string;
  splitType: 'split_50_50' | 'owes_half' | 'covered_by_you' | 'custom' | string;
  splitLabel: string;
  iconType: string;
  timestamp: string;
  expenseType?: 'monthly' | 'event';
  eventId?: string;
  eventTitle?: string;
}

export const ExpenseTransactionSchema = new Schema<IExpenseTransaction>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, default: '' },
  title: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Gift', 'Utilities', 'Food', 'Home Expenses', 'Travel', 'Cattle', 'Lifestyle', 'Dining', 'Gifts'], 
    default: 'Food' 
  },
  amount: { type: Number, required: true },
  paidBy: { type: String, default: 'You' },
  splitType: { 
    type: String, 
    default: 'split_50_50' 
  },
  splitLabel: { type: String, default: 'Split 50/50' },
  iconType: { type: String, default: 'restaurant' },
  timestamp: { type: String, default: () => new Date().toISOString() },
  expenseType: { type: String, enum: ['monthly', 'event'], default: 'monthly' },
  eventId: { type: String, default: '' },
  eventTitle: { type: String, default: '' }
});

// Performance query indexes
ExpenseTransactionSchema.index({ userId: 1, timestamp: -1 });
ExpenseTransactionSchema.index({ eventId: 1, expenseType: 1 });
ExpenseTransactionSchema.index({ timestamp: -1 });

export const ExpenseTransactionModel = mongoose.model<IExpenseTransaction>('ExpenseTransaction', ExpenseTransactionSchema);

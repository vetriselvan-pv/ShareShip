import mongoose, { Schema } from 'mongoose';

export interface IEventExpense {
  id: string;
  title: string;
  status: 'Active Trip' | 'Completed';
  spent: number;
  budget: number;
  bgImageUrl: string;
  members: { name: string; avatarUrl: string }[];
  userId?: string;
}

export const EventExpenseSchema = new Schema<IEventExpense>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['Active Trip', 'Completed'], default: 'Active Trip' },
  spent: { type: Number, default: 0 },
  budget: { type: Number, default: 1000 },
  bgImageUrl: { type: String, default: '' },
  members: {
    type: [{ name: String, avatarUrl: String }],
    default: []
  },
  userId: { type: String, default: '' }
});

export const EventExpenseModel = mongoose.model<IEventExpense>('EventExpense', EventExpenseSchema);


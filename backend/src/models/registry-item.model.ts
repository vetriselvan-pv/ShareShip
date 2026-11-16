import mongoose, { Schema } from 'mongoose';

export interface IRegistryItem {
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
  createdAt?: Date;
}

export const RegistryItemSchema = new Schema<IRegistryItem>({
  id: { type: String, required: true, unique: true },
  relativeId: { type: String, default: '' },
  relativeName: { type: String, default: '' },
  relativeVillage: { type: String, default: '' },
  recipient: { type: String, required: true },
  initials: { type: String, default: 'GL' },
  occasion: { type: String, default: 'Celebration' },
  type: { type: String, enum: ['credit', 'debit'], default: 'credit' },
  date: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  giftType: { type: String, default: 'Cash' },
  creator: { type: String, default: '' },
  creatorRole: { type: String, enum: ['me', 'partner'], default: 'me' },
  status: { 
    type: String, 
    enum: ['Fulfilled', 'Pending Wrap', 'Idea Saved'], 
    default: 'Fulfilled' 
  },
  createdAt: { type: Date, default: Date.now }
});

export const RegistryItemModel = mongoose.model<IRegistryItem>('RegistryItem', RegistryItemSchema);

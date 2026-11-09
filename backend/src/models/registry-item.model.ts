import mongoose, { Schema } from 'mongoose';

export interface IRegistryItem {
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
  createdAt?: Date;
}

export const RegistryItemSchema = new Schema<IRegistryItem>({
  id: { type: String, required: true, unique: true },
  recipient: { type: String, required: true },
  initials: { type: String, default: 'GL' },
  occasion: { type: String, default: 'Celebration' },
  date: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  giftType: { type: String, default: 'Gift Card' },
  creator: { type: String, default: '' },
  creatorRole: { type: String, enum: ['me', 'partner'], default: 'me' },
  status: { 
    type: String, 
    enum: ['Fulfilled', 'Pending Wrap', 'Idea Saved'], 
    default: 'Idea Saved' 
  },
  createdAt: { type: Date, default: Date.now }
});

export const RegistryItemModel = mongoose.model<IRegistryItem>('RegistryItem', RegistryItemSchema);

import mongoose, { Schema } from 'mongoose';

export interface IRelative {
  id: string;
  userId?: string;
  firstName: string;
  lastName?: string;
  village: string;
  phone?: string;
  relationship?: string;
  createdAt?: Date;
}

export const RelativeSchema = new Schema<IRelative>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, default: '' },
  firstName: { type: String, required: true },
  lastName: { type: String, default: '' },
  village: { type: String, required: true },
  phone: { type: String, default: '' },
  relationship: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export const RelativeModel = mongoose.model<IRelative>('Relative', RelativeSchema);

import mongoose, { Schema } from 'mongoose';

export interface IUser {
  userId: string;
  name: string;
  email?: string;
  password?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
}

export const UserSchema = new Schema<IUser>({
  userId: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: false, trim: true, lowercase: true },
  password: { type: String, required: false },
  avatarUrl: { type: String, default: '' },
  bio: { type: String, default: 'Shareship partner' },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);

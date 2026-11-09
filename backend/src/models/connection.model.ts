import mongoose, { Schema } from 'mongoose';

export interface IConnection {
  connectionId: string;
  requesterUserId: string;
  recipientUserId: string;
  requesterName: string;
  recipientName: string;
  requesterAvatarUrl?: string;
  recipientAvatarUrl?: string;
  status: 'pending' | 'connected' | 'declined';
  createdAt: string;
  connectedAt?: string;
}

export const ConnectionSchema = new Schema<IConnection>({
  connectionId: { type: String, required: true, unique: true, index: true },
  requesterUserId: { type: String, required: true, index: true, lowercase: true, trim: true },
  recipientUserId: { type: String, required: true, index: true, lowercase: true, trim: true },
  requesterName: { type: String, required: true, trim: true },
  recipientName: { type: String, required: true, trim: true },
  requesterAvatarUrl: { type: String, default: '' },
  recipientAvatarUrl: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'connected', 'declined'], default: 'pending' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  connectedAt: { type: String }
});

// Compound and lookup indexes
ConnectionSchema.index({ requesterUserId: 1, recipientUserId: 1 });
ConnectionSchema.index({ recipientUserId: 1, status: 1 });
ConnectionSchema.index({ status: 1 });

export const ConnectionModel = mongoose.model<IConnection>('Connection', ConnectionSchema);

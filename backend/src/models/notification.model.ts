import mongoose, { Schema } from 'mongoose';

export interface IPendingFriendRequest {
  id: string;
  recipientUserId?: string; // Target user who sees and can accept the request
  requesterUserId?: string; // User who initiated the request
  userId?: string;          // Alias for recipientUserId
  name: string;
  handle: string;
  avatarUrl: string;
  status: 'pending' | 'accepted' | 'declined';
  mutualCount?: number;
  timestamp: string;
}

export const PendingFriendRequestSchema = new Schema<IPendingFriendRequest>({
  id: { type: String, required: true, unique: true },
  recipientUserId: { type: String, required: false, index: true, lowercase: true, trim: true },
  requesterUserId: { type: String, required: false, index: true, lowercase: true, trim: true },
  userId: { type: String, required: false, index: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  handle: { type: String, required: true },
  avatarUrl: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  mutualCount: { type: Number, default: 0 },
  timestamp: { type: String, default: () => new Date().toISOString() }
});

export const PendingFriendRequestModel = mongoose.model<IPendingFriendRequest>('PendingFriendRequest', PendingFriendRequestSchema);

export interface IActivityNotification {
  id: string;
  userId: string; // The user who should receive and see this notification
  relatedUserId?: string; // The other party involved (partner/requester)
  type: 'gift_sync' | 'event_reminder' | 'expense_settled' | 'subscription_renewed';
  title: string;
  description: string;
  timeAgo: string;
  iconType: 'heart' | 'calendar' | 'payments' | 'subscription';
  isRead: boolean;
  timestamp: string;
}

export const ActivityNotificationSchema = new Schema<IActivityNotification>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true, lowercase: true, trim: true },
  relatedUserId: { type: String, required: false, lowercase: true, trim: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  timeAgo: { type: String, default: 'Just now' },
  iconType: { type: String, default: 'heart' },
  isRead: { type: Boolean, default: false },
  timestamp: { type: String, default: () => new Date().toISOString() }
});

// Notifications lookup and unread filter indexes
ActivityNotificationSchema.index({ userId: 1, isRead: 1, timestamp: -1 });

export const ActivityNotificationModel = mongoose.model<IActivityNotification>('ActivityNotification', ActivityNotificationSchema);


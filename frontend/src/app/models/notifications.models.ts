export type NotificationItemType =
  | 'gift_sync'
  | 'event_reminder'
  | 'expense_settled'
  | 'subscription_renewed';

export interface PendingRequestItem {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  status?: 'pending' | 'accepted' | 'declined';
}

export interface FeedNotificationItem {
  id: string;
  type: NotificationItemType;
  title: string;
  description: string;
  timeAgo: string;
  iconType: 'heart' | 'calendar' | 'payments' | 'subscription';
  isRead?: boolean;
}

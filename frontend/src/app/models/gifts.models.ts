export type RegistryItemStatus = 'Fulfilled' | 'Pending Wrap' | 'Idea Saved';

export interface RegistryEntry {
  id: string;
  recipient: string;
  initials: string;
  occasion: string;
  date: string;
  amount: number;
  giftType: string;
  creator: string;
  creatorRole?: string;
  avatarUrl?: string;
  status: RegistryItemStatus;
}

export interface TrackerGiftItem {
  id: string;
  title: string;
  status: string;
  context?: string;
  claimedBy: string;
  claimedInitial?: string;
  imageUrl?: string;
}

export interface NewGiftPayload {
  recipient: string;
  occasion: string;
  amount: number;
  giftType: string;
  creator: string;
  creatorRole: string;
  status: RegistryItemStatus;
}

export type RegistryItemStatus = 'Fulfilled' | 'Pending Wrap' | 'Idea Saved';
export type GiftTransactionType = 'credit' | 'debit';

export interface Relative {
  id: string;
  userId?: string;
  firstName: string;
  lastName?: string;
  village: string;
  phone?: string;
  relationship?: string;
  createdAt?: string;
}

export interface RegistryEntry {
  id: string;
  relativeId?: string;
  relativeName?: string;
  relativeVillage?: string;
  recipient: string;
  initials: string;
  occasion: string;
  type?: GiftTransactionType;
  date: string;
  amount: number;
  notes?: string;
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
  relativeId?: string;
  relativeName: string;
  relativeVillage?: string;
  recipient: string;
  occasion: string;
  type: GiftTransactionType;
  amount: number;
  notes?: string;
  date?: string;
  giftType?: string;
  creator: string;
  creatorRole: string;
  status: RegistryItemStatus;
}

export type UserRole = 'me' | 'partner';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  initial: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
}

export interface PartnerLink {
  spaceId: string;
  spaceName: string;
  me: UserProfile;
  partner: UserProfile;
  syncStatus: 'synced' | 'syncing' | 'offline';
  isLiveSyncActive: boolean;
  connectedSince: string;
}

export type SyncItemType = 'calendar' | 'expense' | 'note' | 'presence' | 'heartbeat';

export interface SyncEvent<T = unknown> {
  id: string;
  spaceId: string;
  authorId: string;
  authorRole: UserRole;
  authorName: string;
  type: SyncItemType;
  action: 'create' | 'update' | 'delete' | 'ping';
  payload: T;
  timestamp: string;
  version: number;
}

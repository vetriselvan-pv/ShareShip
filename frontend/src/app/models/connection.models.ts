export type ConnectionStatus = 'none' | 'pending' | 'connected' | 'declined';

export interface SearchedUser {
  userId: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  status: 'none' | 'pending' | 'connected';
  isRequester?: boolean;
  connectionId?: string;
}

export interface PartnerConnection {
  userId: string;
  name: string;
  avatarUrl?: string;
  status: 'connected' | 'pending';
  connectedAt?: string;
  isRequester?: boolean;
}

export interface UserSearchResult {
  userId: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
}

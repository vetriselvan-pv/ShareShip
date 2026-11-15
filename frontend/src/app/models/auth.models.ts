export type AuthMode = 'sign-in' | 'create-space';

export interface AuthUser {
  userId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  id?: string;
  isOnline?: boolean;
}

export interface AuthPartner {
  name: string;
  avatarUrl?: string;
  email?: string;
  isOnline?: boolean;
}

export interface AuthSpace {
  id: string;
  name: string;
  syncStatus?: string;
  isLiveSyncActive?: boolean;
}

export interface RegisterPayload {
  userId: string;
  name: string;
  email?: string;
  password: string;
  avatarUrl?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: AuthUser;
  partner?: AuthPartner | null;
  space?: AuthSpace | null;
  token?: string;
  error?: string;
  message?: string;
}

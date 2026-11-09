export type AuthMode = 'sign-in' | 'create-space';

export interface AuthUser {
  userId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
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
  error?: string;
  message?: string;
}

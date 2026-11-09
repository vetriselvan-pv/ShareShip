import { Injectable, signal } from '@angular/core';
import { encryptPassword } from '../utils/crypto.utils';

export interface RegisterPayload {
  userId: string;
  name: string;
  email?: string;
  password: string;
  avatarUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3001/api/auth';

  readonly isAuthenticating = signal<boolean>(false);
  readonly authError = signal<string | null>(null);
  readonly isAuthenticated = signal<boolean>(false);

  readonly currentUser = signal<{ userId: string; name: string; avatarUrl?: string } | null>(null);

  constructor() {
    try {
      const saved = localStorage.getItem('shareship_user');
      if (saved) {
        const u = JSON.parse(saved);
        this.currentUser.set(u);
        this.isAuthenticated.set(true);
      }
    } catch {}
  }

  getCurrentUser(): { userId: string; name: string; avatarUrl?: string } | null {
    return this.currentUser();
  }

  getCurrentUserId(): string {
    return this.currentUser()?.userId || localStorage.getItem('shareship_last_userid') || 'vetriselvan_11';
  }

  getCurrentUserName(): string {
    return this.currentUser()?.name || localStorage.getItem('shareship_last_name') || 'Vetri';
  }

  logout(): void {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    try {
      localStorage.removeItem('shareship_user');
      localStorage.removeItem('shareship_last_userid');
      localStorage.removeItem('shareship_last_name');
    } catch {}
  }

  async login(
    usernameOrEmail: string,
    rawPassword?: string,
  ): Promise<{ success: boolean; error?: string }> {
    this.isAuthenticating.set(true);
    this.authError.set(null);

    try {
      const encryptedPassword = rawPassword ? await encryptPassword(rawPassword) : '';

      const response = await fetch(`${this.apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameOrEmail,
          password: encryptedPassword,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        const errMsg =
          data?.error || (data?.details && data?.details[0]?.message) || 'Invalid credentials';
        this.authError.set(errMsg);
        return { success: false, error: errMsg };
      }

      if (data?.user) {
        this.currentUser.set(data.user);
        try {
          localStorage.setItem('shareship_user', JSON.stringify(data.user));
          localStorage.setItem('shareship_last_userid', data.user.userId);
          if (data.user.name) {
            localStorage.setItem('shareship_last_name', data.user.name);
          }
        } catch {}
      }
      this.isAuthenticated.set(true);
      return { success: true };
    } catch {
      const netError =
        'Unable to connect to Shareship authentication service. Please ensure the backend server is running.';
      this.authError.set(netError);
      return { success: false, error: netError };
    } finally {
      this.isAuthenticating.set(false);
    }
  }


  async register(
    payload: RegisterPayload,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    this.isAuthenticating.set(true);
    this.authError.set(null);

    try {
      const encryptedPassword = await encryptPassword(payload.password);

      const response = await fetch(`${this.apiUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: payload.userId,
          name: payload.name,
          email: payload.email,
          password: encryptedPassword,
          avatarUrl: payload.avatarUrl || '',
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        const errMsg =
          data?.error || (data?.details && data?.details[0]?.message) || 'Registration failed';
        this.authError.set(errMsg);
        return { success: false, error: errMsg };
      }

      if (data?.user) {
        this.currentUser.set(data.user);
        try {
          localStorage.setItem('shareship_user', JSON.stringify(data.user));
          localStorage.setItem('shareship_last_userid', data.user.userId);
          if (data.user.name) {
            localStorage.setItem('shareship_last_name', data.user.name);
          }
        } catch {}
      }
      return { success: true, message: data.message };
    } catch {
      const netError =
        'Unable to reach backend service to register user. Please check server status.';
      this.authError.set(netError);
      return { success: false, error: netError };
    } finally {
      this.isAuthenticating.set(false);
    }
  }

  async resetPassword(
    identifier: string,
    newPassword: string,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    this.isAuthenticating.set(true);
    this.authError.set(null);

    try {
      const encryptedPassword = await encryptPassword(newPassword);

      const response = await fetch(`${this.apiUrl}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          newPassword: encryptedPassword,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        const errMsg =
          data?.error || (data?.details && data?.details[0]?.message) || 'Password reset failed.';
        this.authError.set(errMsg);
        return { success: false, error: errMsg };
      }

      return { success: true, message: data.message };
    } catch {
      const netError =
        'Unable to reach backend service to reset password. Please check server status.';
      this.authError.set(netError);
      return { success: false, error: netError };
    } finally {
      this.isAuthenticating.set(false);
    }
  }

  async createSpace(spaceName: string, partnerEmail: string): Promise<boolean> {
    this.isAuthenticating.set(true);
    this.authError.set(null);

    try {
      await fetch(`${this.apiUrl}/create-space`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceName, partnerEmail }),
      });
      this.isAuthenticated.set(true);
      return true;
    } catch {
      await new Promise((res) => setTimeout(res, 500));
      this.isAuthenticated.set(true);
      return true;
    } finally {
      this.isAuthenticating.set(false);
    }
  }
}

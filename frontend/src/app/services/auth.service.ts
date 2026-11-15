import { Injectable, inject, signal, computed } from '@angular/core';
import { encryptPassword } from '../utils/crypto.utils';
import { environment } from '../../environments/environment';
import { AuthUser, RegisterPayload, AuthPartner, AuthSpace } from '../models/auth.models';
import { LoaderService } from './loader.service';
import { SecureStorageService } from './secure-storage.service';

export type { AuthUser, RegisterPayload, AuthPartner, AuthSpace };

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly loaderService = inject(LoaderService);
  private readonly secureStorage = inject(SecureStorageService);
  private readonly sessionRestorePromise: Promise<boolean>;
  private apiUrl = `${environment.apiUrl}/api/auth`;

  // --- Common Global Service Variables (In-Memory State) ---
  readonly currentUser = signal<AuthUser | null>(null);
  readonly token = signal<string | null>(null);
  readonly partner = signal<AuthPartner | null>(null);
  readonly space = signal<AuthSpace | null>(null);

  readonly isAuthenticated = signal<boolean>(false);
  readonly isAuthenticating = signal<boolean>(false);
  readonly authError = signal<string | null>(null);

  // Private in-memory fallback cache (completely independent of localStorage)
  private _inMemoryUserId = 'vetriselvan_11';
  private _inMemoryUserName = 'Vetri';

  // --- Global Reactive Computed Accessors ---
  readonly currentUserId = computed(() => this.currentUser()?.userId || this._inMemoryUserId);
  readonly currentUserName = computed(() => this.currentUser()?.name || this._inMemoryUserName);
  readonly currentUserAvatar = computed(() => this.currentUser()?.avatarUrl || '');
  readonly currentUserEmail = computed(() => this.currentUser()?.email || '');

  constructor() {
    this.sessionRestorePromise = this.restoreSession();
  }

  /**
   * Resolves once native secure storage has finished reading during app startup.
   */
  async ensureSessionLoaded(): Promise<boolean> {
    await this.sessionRestorePromise;
    return this.isAuthenticated();
  }

  /**
   * Restores session state from native hardware-backed storage (iOS Keychain / Android Keystore)
   * into the global service variables in memory. Does not touch or rely on localStorage.
   */
  private async restoreSession(): Promise<boolean> {
    try {
      const savedUser = await this.secureStorage.getObject<AuthUser>('shareship_user');
      const savedToken = await this.secureStorage.getItem('shareship_token');
      const savedPartner = await this.secureStorage.getObject<AuthPartner>('shareship_partner');
      const savedSpace = await this.secureStorage.getObject<AuthSpace>('shareship_space');

      if (savedUser) {
        this.currentUser.set(savedUser);
        this._inMemoryUserId = savedUser.userId;
        if (savedUser.name) {
          this._inMemoryUserName = savedUser.name;
        }
        this.token.set(savedToken);
        if (savedPartner) this.partner.set(savedPartner);
        if (savedSpace) this.space.set(savedSpace);
        this.isAuthenticated.set(true);
        return true;
      }
    } catch (err) {
      console.warn('[AuthService] Session restore exception:', err);
    } finally {
      // Purge any legacy unencrypted items from localStorage
      try {
        localStorage.removeItem('shareship_user');
        localStorage.removeItem('shareship_last_userid');
        localStorage.removeItem('shareship_last_name');
        localStorage.removeItem('shareship_token');
      } catch {}
    }
    return false;
  }

  // --- Global Service Variable Accessors & Mutators ---

  getToken(): string | null {
    return this.token();
  }

  setToken(token: string | null): void {
    this.token.set(token);
    if (token) {
      this.secureStorage.setItem('shareship_token', token);
    } else {
      this.secureStorage.removeItem('shareship_token');
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser();
  }

  setCurrentUser(user: AuthUser | null): void {
    this.currentUser.set(user);
    if (user) {
      this._inMemoryUserId = user.userId;
      if (user.name) {
        this._inMemoryUserName = user.name;
      }
      this.secureStorage.setObject('shareship_user', user);
    } else {
      this.secureStorage.removeItem('shareship_user');
    }
  }

  getCurrentUserId(): string {
    return this.currentUser()?.userId || this._inMemoryUserId;
  }

  getCurrentUserName(): string {
    return this.currentUser()?.name || this._inMemoryUserName;
  }

  getPartner(): AuthPartner | null {
    return this.partner();
  }

  getSpace(): AuthSpace | null {
    return this.space();
  }

  /**
   * Sets all global session variables simultaneously.
   */
  async setSession(session: {
    user?: AuthUser | null;
    token?: string | null;
    partner?: AuthPartner | null;
    space?: AuthSpace | null;
  }): Promise<void> {
    if (session.user !== undefined) {
      this.currentUser.set(session.user);
      if (session.user) {
        this._inMemoryUserId = session.user.userId;
        if (session.user.name) this._inMemoryUserName = session.user.name;
        await this.secureStorage.setObject('shareship_user', session.user);
      } else {
        await this.secureStorage.removeItem('shareship_user');
      }
    }

    if (session.token !== undefined) {
      this.token.set(session.token);
      if (session.token) {
        await this.secureStorage.setItem('shareship_token', session.token);
      } else {
        await this.secureStorage.removeItem('shareship_token');
      }
    }

    if (session.partner !== undefined) {
      this.partner.set(session.partner);
      if (session.partner) {
        await this.secureStorage.setObject('shareship_partner', session.partner);
      } else {
        await this.secureStorage.removeItem('shareship_partner');
      }
    }

    if (session.space !== undefined) {
      this.space.set(session.space);
      if (session.space) {
        await this.secureStorage.setObject('shareship_space', session.space);
      } else {
        await this.secureStorage.removeItem('shareship_space');
      }
    }

    this.isAuthenticated.set(!!this.currentUser());
  }

  /**
   * Clears in-memory global variables and hardware-backed secure storage.
   */
  logout(): void {
    // Reset in-memory global variables
    this.currentUser.set(null);
    this.token.set(null);
    this.partner.set(null);
    this.space.set(null);
    this.isAuthenticated.set(false);
    this._inMemoryUserId = 'vetriselvan_11';
    this._inMemoryUserName = 'Vetri';

    // Clear secure storage asynchronously
    this.secureStorage.removeItem('shareship_user');
    this.secureStorage.removeItem('shareship_token');
    this.secureStorage.removeItem('shareship_partner');
    this.secureStorage.removeItem('shareship_space');

    // Purge any legacy localStorage keys
    try {
      localStorage.removeItem('shareship_user');
      localStorage.removeItem('shareship_last_userid');
      localStorage.removeItem('shareship_last_name');
      localStorage.removeItem('shareship_token');
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

      const response = await this.loaderService.track(
        fetch(`${this.apiUrl}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: usernameOrEmail,
            password: encryptedPassword,
          }),
        }),
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        const errMsg =
          data?.error || (data?.details && data?.details[0]?.message) || 'Invalid credentials';
        this.authError.set(errMsg);
        return { success: false, error: errMsg };
      }

      // Store in global service variables & native secure storage
      if (data?.user) {
        this.currentUser.set(data.user);
        this._inMemoryUserId = data.user.userId;
        if (data.user.name) {
          this._inMemoryUserName = data.user.name;
        }
        await this.secureStorage.setObject('shareship_user', data.user);
      }

      if (data?.token) {
        this.token.set(data.token);
        await this.secureStorage.setItem('shareship_token', data.token);
      }

      if (data?.partner) {
        this.partner.set(data.partner);
        await this.secureStorage.setObject('shareship_partner', data.partner);
      }

      if (data?.space) {
        this.space.set(data.space);
        await this.secureStorage.setObject('shareship_space', data.space);
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

      const response = await this.loaderService.track(
        fetch(`${this.apiUrl}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: payload.userId,
            name: payload.name,
            email: payload.email,
            password: encryptedPassword,
            avatarUrl: payload.avatarUrl || '',
          }),
        }),
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        const errMsg =
          data?.error || (data?.details && data?.details[0]?.message) || 'Registration failed';
        this.authError.set(errMsg);
        return { success: false, error: errMsg };
      }

      // Store in global service variables & native secure storage
      if (data?.user) {
        this.currentUser.set(data.user);
        this._inMemoryUserId = data.user.userId;
        if (data.user.name) {
          this._inMemoryUserName = data.user.name;
        }
        await this.secureStorage.setObject('shareship_user', data.user);
      }

      if (data?.token) {
        this.token.set(data.token);
        await this.secureStorage.setItem('shareship_token', data.token);
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

      const response = await this.loaderService.track(
        fetch(`${this.apiUrl}/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier,
            newPassword: encryptedPassword,
          }),
        }),
      );

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
      await this.loaderService.track(
        fetch(`${this.apiUrl}/create-space`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spaceName, partnerEmail }),
        }),
      );
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

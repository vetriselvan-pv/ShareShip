import { Injectable, signal, inject } from '@angular/core';
import { SyncService } from './sync.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

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

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  private syncService = inject(SyncService);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/api/connections`;

  readonly activePartner = signal<PartnerConnection | null>(null);
  readonly pendingPartner = signal<PartnerConnection | null>(null);
  readonly isPartnerConnected = signal<boolean>(false);
  readonly isSending = signal<boolean>(false);
  readonly isSearching = signal<boolean>(false);

  constructor() {
    this.loadPartnerConnection();
  }

  getCurrentUserId(): string {
    return this.authService.getCurrentUserId();
  }

  async searchUsers(query: string): Promise<SearchedUser[]> {
    const cleanQuery = query.trim().replace(/^@+/, '');
    if (!cleanQuery) return [];

    this.isSearching.set(true);
    try {
      const currentUserId = this.getCurrentUserId();
      const res = await fetch(
        `${this.apiUrl}/search?query=${encodeURIComponent(cleanQuery)}&currentUserId=${encodeURIComponent(currentUserId)}`
      );
      const data = await res.json().catch(() => null);
      if (data?.success && Array.isArray(data.users)) {
        return data.users;
      }
      return [];
    } catch (err) {
      console.warn('Search error:', err);
      return [];
    } finally {
      this.isSearching.set(false);
    }
  }

  async loadPartnerConnection(userId?: string): Promise<{ connected: boolean; partner?: PartnerConnection | null }> {
    const effectiveUserId = userId || this.getCurrentUserId();

    try {
      const response = await fetch(`${this.apiUrl}/partner?userId=${encodeURIComponent(effectiveUserId)}`);
      const data = await response.json().catch(() => null);

      if (data?.success) {
        if (data.connected && data.partner) {
          this.activePartner.set(data.partner);
          this.isPartnerConnected.set(true);

          // Update shared SyncService partnerLink so all views display the linked partner
          this.syncService.partnerLink.update(prev => ({
            ...prev,
            partner: {
              id: data.partner.userId,
              name: data.partner.name,
              email: `${data.partner.userId}@shareship.app`,
              avatarUrl: data.partner.avatarUrl,
              initial: (data.partner.name || data.partner.userId).charAt(0).toUpperCase(),
              status: 'online'
            }
          }));

          return { connected: true, partner: data.partner };
        } else if (data.pendingPartner) {
          this.pendingPartner.set(data.pendingPartner);
          this.isPartnerConnected.set(false);
          return { connected: false, partner: data.pendingPartner };
        } else {
          this.activePartner.set(null);
          this.isPartnerConnected.set(false);
          return { connected: false, partner: null };
        }
      }
      return { connected: false, partner: null };
    } catch (err) {
      console.warn('Failed to load partner connection:', err);
      return { connected: false, partner: null };
    }
  }

  async sendConnectionRequest(targetUserId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    this.isSending.set(true);
    const cleanTarget = targetUserId.trim().replace(/^@+/, '');
    const requesterId = this.getCurrentUserId();

    try {
      const response = await fetch(`${this.apiUrl}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: cleanTarget,
          requesterUserId: requesterId
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        const errorMsg = data?.error || (data?.details && data?.details[0]?.message) || 'Failed to send connection request';
        return { success: false, error: errorMsg };
      }

      await this.loadPartnerConnection();
      return { success: true, message: data.message };
    } catch {
      return { success: false, error: 'Network error: Unable to send connection request. Please ensure the backend is running.' };
    } finally {
      this.isSending.set(false);
    }
  }
}


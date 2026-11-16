import { Injectable, signal, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SyncService } from './sync.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { SearchedUser, PartnerConnection, ConnectionStatus, UserSearchResult } from '../models/connection.models';

export type { SearchedUser, PartnerConnection, ConnectionStatus, UserSearchResult };

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  private http = inject(HttpClient);
  private syncService = inject(SyncService);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/api/connections`;

  readonly activePartner = signal<PartnerConnection | null>(null);
  readonly pendingPartner = signal<PartnerConnection | null>(null);
  readonly isPartnerConnected = signal<boolean>(false);
  readonly isSending = signal<boolean>(false);
  readonly isSearching = signal<boolean>(false);

  constructor() {
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.loadPartnerConnection();
      } else {
        this.activePartner.set(null);
        this.pendingPartner.set(null);
        this.isPartnerConnected.set(false);
      }
    });
  }

  getCurrentUserId(): string {
    return this.authService.getCurrentUserId();
  }

  async searchUsers(query: string): Promise<SearchedUser[]> {
    const cleanQuery = query.trim().replace(/^@+/, '');
    if (!cleanQuery) return [];

    this.isSearching.set(true);
    try {
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; users: SearchedUser[] }>(
          `${this.apiUrl}/search?query=${encodeURIComponent(cleanQuery)}`
        )
      );
      if (res?.success && Array.isArray(res.users)) {
        return res.users;
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
    if (!this.authService.isAuthenticated()) {
      return { connected: false, partner: null };
    }

    try {
      const url = userId ? `${this.apiUrl}/partner?userId=${encodeURIComponent(userId)}` : `${this.apiUrl}/partner`;
      const data = await firstValueFrom(
        this.http.get<{
          success: boolean;
          connected?: boolean;
          partner?: PartnerConnection | null;
          pendingPartner?: PartnerConnection | null;
        }>(url)
      );

      if (data?.success) {
        if (data.connected && data.partner) {
          this.activePartner.set(data.partner);
          this.isPartnerConnected.set(true);

          // Update shared SyncService partnerLink so all views display the linked partner
          this.syncService.partnerLink.update(prev => ({
            ...prev,
            partner: {
              id: data.partner!.userId,
              name: data.partner!.name,
              email: `${data.partner!.userId}@shareship.app`,
              avatarUrl: data.partner!.avatarUrl,
              initial: (data.partner!.name || data.partner!.userId).charAt(0).toUpperCase(),
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
      const data = await firstValueFrom(
        this.http.post<{ success: boolean; message?: string }>(`${this.apiUrl}/request`, {
          targetUserId: cleanTarget,
          requesterUserId: requesterId
        })
      );

      await this.loadPartnerConnection();
      return { success: true, message: data.message };
    } catch (err: any) {
      const errorMsg = err?.error?.error || err?.error?.message || err?.message || 'Failed to send connection request';
      return { success: false, error: errorMsg };
    } finally {
      this.isSending.set(false);
    }
  }
}

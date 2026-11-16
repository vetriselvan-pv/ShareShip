import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Relative } from '../models/gifts.models';

export type { Relative };

@Injectable({
  providedIn: 'root',
})
export class RelativeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/relatives`;

  readonly relatives = signal<Relative[]>([]);
  readonly isLoading = signal<boolean>(false);

  async loadRelatives(query?: string): Promise<Relative[]> {
    this.isLoading.set(true);
    try {
      const url = query ? `${this.apiUrl}?q=${encodeURIComponent(query)}` : this.apiUrl;
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; relatives: Relative[] }>(url)
      );
      if (res?.success && Array.isArray(res.relatives)) {
        this.relatives.set(res.relatives);
        return res.relatives;
      }
      return [];
    } catch (err) {
      console.warn('Failed to load relatives from master:', err);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  async createRelative(data: {
    firstName: string;
    lastName?: string;
    village: string;
    phone?: string;
    relationship?: string;
  }): Promise<Relative | null> {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; relative: Relative }>(this.apiUrl, data)
      );
      if (res?.success && res.relative) {
        this.relatives.update((list) => [res.relative, ...list]);
        return res.relative;
      }
      return null;
    } catch (err) {
      console.error('Failed to create relative:', err);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteRelative(id: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.apiUrl}/${encodeURIComponent(id)}`)
      );
      this.relatives.update((list) => list.filter((r) => r.id !== id));
      return true;
    } catch {
      return false;
    }
  }
}

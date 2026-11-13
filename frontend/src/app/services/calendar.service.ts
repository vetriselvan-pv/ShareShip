import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { SyncService } from './sync.service';
import { LoaderService } from './loader.service';
import { environment } from '../../environments/environment';
import { CalendarEvent, CalendarEventCategory, NewEventPayload } from '../models/calendar.models';

export type { CalendarEvent, CalendarEventCategory, NewEventPayload };

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private authService = inject(AuthService);
  private syncService = inject(SyncService);
  private loaderService = inject(LoaderService);
  private apiUrl = `${environment.apiUrl}/api/calendar/events`;

  readonly events = signal<CalendarEvent[]>([]);
  readonly isLoading = signal<boolean>(false);

  /**
   * Filtered list of events occurring within the next 1 month (from today to 30 days ahead),
   * sorted ascending (soonest event first).
   */
  readonly upcomingNextMonthEvents = computed(() => {
    const list = this.events();
    if (!list || list.length === 0) return [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    // 30 days in the future (or 1 full month)
    const oneMonthAheadEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30, 23, 59, 59, 999).getTime();

    return list
      .filter(item => {
        if (!item.date) return false;
        // Parse date string (e.g. YYYY-MM-DD)
        const parts = item.date.split('-');
        let eventTime: number;
        if (parts.length === 3) {
          eventTime = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0).getTime();
        } else {
          eventTime = new Date(item.date).getTime();
        }
        return !isNaN(eventTime) && eventTime >= todayStart && eventTime <= oneMonthAheadEnd;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date.includes('T') ? a.date : `${a.date}T12:00:00`).getTime();
        const timeB = new Date(b.date.includes('T') ? b.date : `${b.date}T12:00:00`).getTime();
        return timeA - timeB;
      });
  });

  constructor() {
    this.loadEvents();
  }

  async loadEvents(userId?: string): Promise<CalendarEvent[]> {
    this.isLoading.set(true);
    const effectiveUserId = userId || this.authService.getCurrentUserId();
    try {
      const res = await this.loaderService.track(
        fetch(`${this.apiUrl}?userId=${encodeURIComponent(effectiveUserId)}`),
      );
      const data = await res.json().catch(() => null);
      if (data?.success && Array.isArray(data.events)) {
        this.events.set(data.events);
        return data.events;
      }
      this.events.set([]);
      return [];
    } catch (err) {
      console.warn('Failed to fetch calendar events:', err);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  getCurrentUserId(): string {
    return this.authService.getCurrentUserId();
  }

  getCurrentUserName(): string {
    return this.authService.getCurrentUserName();
  }

  async createEvent(eventData: {
    title: string;
    date: string;
    location?: string;
    gift?: string;
    time?: string;
    category?: 'Event' | 'celebration' | 'Incident' | 'Task' | string;
  }): Promise<{ success: boolean; event?: CalendarEvent; error?: string }> {
    const currentUserId = this.authService.getCurrentUserId();
    const creatorName = this.authService.getCurrentUserName();

    const category = eventData.category || 'Event';
    let icon = 'event';
    const catLower = category.toLowerCase();
    if (catLower === 'celebration' || catLower === 'wedding' || catLower === 'birthday' || catLower === 'anniversary') {
      icon = 'celebration';
    } else if (catLower === 'incident') {
      icon = 'warning';
    } else if (catLower === 'task') {
      icon = 'task';
    } else {
      icon = 'event';
    }

    const payload = {
      userId: currentUserId,
      title: eventData.title.trim(),
      date: eventData.date,
      time: eventData.time || '12:00 PM',
      location: (eventData.location || '').trim(),
      gift: (eventData.gift || '').trim(),
      creator: creatorName,
      creatorRole: 'me' as const,
      category,
      icon
    };

    try {
      const response = await this.loaderService.track(
        fetch(this.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }),
      );
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        const errorMsg = data?.error || (data?.details && data?.details[0]?.message) || 'Failed to save event.';
        return { success: false, error: errorMsg };
      }

      const created: CalendarEvent = data.event;
      // Prepend to current reactive list
      this.events.update(prev => [created, ...prev]);

      // Broadcast sync
      this.syncService.sendSyncItem('calendar', `Added event: ${created.title}${created.gift ? ` (Gift: ${created.gift})` : ''}`);

      return { success: true, event: created };
    } catch {
      return { success: false, error: 'Network error: Unable to reach backend server.' };
    }
  }

  /**
   * Helper: calculates human-readable days remaining
   */
  getDaysRemainingText(dateStr: string): string {
    if (!dateStr) return '';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const parts = dateStr.split('-');
    let target: number;
    if (parts.length === 3) {
      target = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime();
    } else {
      target = new Date(dateStr).getTime();
    }

    const diffMs = target - today;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
    if (diffDays < 7) return `In ${diffDays} days`;
    const weeks = Math.round(diffDays / 7);
    return `In ${weeks} week${weeks > 1 ? 's' : ''}`;
  }

  /**
   * Helper: format date for display e.g. "Saturday, Nov 15"
   */
  formatDisplayDate(dateStr: string, timeStr?: string): string {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      let d: Date;
      if (parts.length === 3) {
        d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        d = new Date(dateStr);
      }
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = d.getDate();
      const timePart = timeStr ? ` • ${timeStr}` : '';
      return `${dayName}, ${monthName} ${dayNum}${timePart}`;
    } catch {
      return dateStr;
    }
  }
}

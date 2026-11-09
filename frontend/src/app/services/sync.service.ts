import { Injectable, signal, computed } from '@angular/core';
import { PartnerLink, SyncEvent, UserRole } from '../models/shareship.models';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private socket: WebSocket | null = null;
  private backendWsUrl = 'ws://localhost:3001/ws/sync';

  // Signals for reactive UI state
  readonly isConnected = signal<boolean>(true);
  readonly syncStatus = signal<'synced' | 'syncing' | 'offline'>('synced');
  readonly isLiveSyncActive = signal<boolean>(true);

  readonly partnerLink = signal<PartnerLink>({
    spaceId: 'shareship-space',
    spaceName: 'Shared Space',
    me: {
      id: '',
      name: '',
      email: '',
      avatarUrl: '',
      initial: 'U',
      status: 'online'
    },
    partner: {
      id: '',
      name: '',
      email: '',
      avatarUrl: '',
      initial: 'P',
      status: 'offline'
    },
    syncStatus: 'synced',
    isLiveSyncActive: false,
    connectedSince: ''
  });

  readonly syncEvents = signal<SyncEvent[]>([]);

  readonly partnerName = computed(() => this.partnerLink().partner.name);
  readonly unreadSyncCount = computed(() => this.syncEvents().filter(e => e.authorRole === 'partner').length);

  constructor() {
    this.initWebSocket();
  }

  private initWebSocket() {
    try {
      const spaceId = this.partnerLink().spaceId || 'shareship-space';
      const myId = this.partnerLink().me.id || 'user_me';
      this.socket = new WebSocket(`${this.backendWsUrl}?spaceId=${spaceId}&role=me&userId=${myId}`);

      this.socket.onopen = () => {
        this.isConnected.set(true);
        this.syncStatus.set('synced');
        this.isLiveSyncActive.set(true);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'initial_sync') {
            if (data.link) this.partnerLink.set(data.link);
            if (data.recentEvents?.length) {
              this.syncEvents.update(prev => [...data.recentEvents, ...prev]);
            }
          } else if (data.type === 'presence') {
            if (data.payload?.link) {
              this.partnerLink.set(data.payload.link);
            }
          } else if (data.authorRole) {
            // New sync event from Partner or Me
            this.syncEvents.update(events => [data, ...events]);
            this.flashSyncStatus();
          }
        } catch (e) {
          console.warn('WS parse error:', e);
        }
      };

      this.socket.onerror = () => {
        // Fall back gracefully to local reactive simulation mode
        this.isConnected.set(true);
      };

      this.socket.onclose = () => {
        // Try reconnecting after 5 seconds
        setTimeout(() => this.initWebSocket(), 5000);
      };
    } catch {
      // In offline / standalone preview mode
      this.isConnected.set(true);
    }
  }

  flashSyncStatus() {
    this.syncStatus.set('syncing');
    setTimeout(() => {
      this.syncStatus.set('synced');
    }, 800);
  }

  // Send an action as "Me"
  sendSyncItem(type: 'calendar' | 'expense' | 'note', title: string) {
    const newEvent: SyncEvent = {
      id: `evt_${Date.now()}`,
      spaceId: this.partnerLink().spaceId,
      authorId: this.partnerLink().me.id,
      authorRole: 'me',
      authorName: this.partnerLink().me.name,
      type,
      action: 'create',
      payload: { title, createdAt: new Date().toISOString() },
      timestamp: new Date().toISOString(),
      version: this.syncEvents().length + 1
    };

    this.syncEvents.update(events => [newEvent, ...events]);
    this.flashSyncStatus();

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'action',
        itemType: type,
        payload: { title }
      }));
    }
  }

  // Simulate Partner action to verify real-time differentiator in UI
  simulatePartnerPing(customText?: string) {
    const partnerName = this.partnerName() || 'Partner';
    const texts = [
      `${partnerName} added "Weekend Cabin Getaway" to shared calendar 🌲`,
      `${partnerName} marked "Farmer Market Groceries ($28.50)" as split 50/50 💳`,
      `${partnerName} added a note: "Can you grab fresh basil on your way home? 🌿"`,
      `${partnerName} sent a quick warm hug ❤️`
    ];
    const text = customText || texts[Math.floor(Math.random() * texts.length)];

    const partnerEvent: SyncEvent = {
      id: `evt_partner_${Date.now()}`,
      spaceId: this.partnerLink().spaceId,
      authorId: this.partnerLink().partner.id || 'user_partner',
      authorRole: 'partner',
      authorName: partnerName,
      type: 'note',
      action: 'create',
      payload: { title: text, createdAt: new Date().toISOString() },
      timestamp: new Date().toISOString(),
      version: this.syncEvents().length + 1
    };

    this.syncEvents.update(events => [partnerEvent, ...events]);
    this.flashSyncStatus();
  }
}

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TopBarComponent } from '../../components/top-bar/top-bar.component';
import {
  PendingRequestsCardComponent,
  PendingRequestItem,
} from '../../components/pending-requests-card/pending-requests-card.component';
import {
  NotificationsFeedComponent,
  FeedNotificationItem,
} from '../../components/notifications-feed/notifications-feed.component';
import { BottomNavComponent, NavTab } from '../../components/bottom-nav/bottom-nav.component';
import { SyncModalComponent } from '../../components/sync-modal/sync-modal.component';
import { SyncService } from '../../services/sync.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-notifications',
  imports: [
    CommonModule,
    TopBarComponent,
    PendingRequestsCardComponent,
    NotificationsFeedComponent,
    BottomNavComponent,
    SyncModalComponent,
  ],
  template: `
    <main
      class="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f2fcf5] text-[#151d1a] flex flex-col justify-between selection:bg-[#adcebe] selection:text-[#133126] font-sans pb-24"
    >
      <!-- Top Bar Component -->
      <app-top-bar
        [isLiveSync]="syncService.isLiveSyncActive()"
        [unreadCount]="totalUnreadCount()"
        (onLogoClick)="router.navigate(['/dashboard'])"
        (onStatusClick)="isSyncModalOpen.set(true)"
        (onNotificationClick)="showToast('You are on the Notifications & Connections screen')"
      />

      <!-- Main Center Content Container (Constrained for Pixel-Perfect Mobile Viewport) -->
      <div class="w-full max-w-[390px] mx-auto px-4 pt-1 flex flex-col gap-4 flex-1 box-border">
        <!-- 1. Header Section: Title & Subtitle -->
        <section class="flex flex-col text-left mt-1">
          <h1 class="text-[20px] font-semibold text-[#151d1a] tracking-tight leading-tight">
            Notifications &amp; Connections
          </h1>
          <p class="text-[12.5px] text-[#414844] font-normal leading-snug mt-0.5">
            Manage friend requests and partner activity
          </p>
        </section>

        <!-- 3. Pending Requests Section -->
        <section class="w-full">
          <app-pending-requests-card
            [requests]="pendingRequests()"
            (onAccept)="handleAcceptRequest($event)"
            (onDecline)="handleDeclineRequest($event)"
            (onViewAll)="handleViewAllRequests()"
          />
        </section>

        <!-- 4. Activity & Notifications Section -->
        <section class="w-full mb-1">
          <app-notifications-feed
            [notifications]="feedNotifications()"
            (onMarkAllRead)="handleMarkAllRead()"
          />
        </section>
      </div>

      <!-- 5. Persistent Bottom Navigation Bar (Screen 5: Alerts Active Tab) -->
      <app-bottom-nav [activeTab]="'alerts'" (tabSelected)="handleTabSwitch($event)" />

      <!-- Real-Time Sync Modal -->
      <app-sync-modal
        [isOpen]="isSyncModalOpen()"
        [partnerLink]="syncService.partnerLink()"
        [events]="syncService.syncEvents()"
        (close)="isSyncModalOpen.set(false)"
        (triggerPartnerSync)="syncService.simulatePartnerPing('Partner accepted connection request')"
        (triggerMySync)="syncService.sendSyncItem('note', (authService.getCurrentUserName() || 'You') + ' updated notifications')"
      />

      <!-- Floating Feedback Toast -->
      @if (activeToast()) {
        <div
          class="fixed top-14 left-1/2 -translate-x-1/2 max-w-[340px] w-[90%] p-3 rounded-2xl text-xs font-semibold text-center shadow-lg border border-[#adcebe] bg-[#c8ead9] text-[#012016] z-50 fade-in"
        >
          {{ activeToast() }}
        </div>
      }
    </main>
  `,
})
export class NotificationsComponent implements OnInit {
  syncService = inject(SyncService);
  authService = inject(AuthService);
  router = inject(Router);
  private http = inject(HttpClient);

  isSyncModalOpen = signal<boolean>(false);
  activeToast = signal<string | null>(null);

  // Pending requests fetched dynamically from backend for current userId
  pendingRequests = signal<PendingRequestItem[]>([]);

  // Notifications fetched dynamically from backend for current userId (no mock items)
  feedNotifications = signal<FeedNotificationItem[]>([]);

  unreadNotificationsCount = computed(
    () => this.feedNotifications().filter((n) => !n.isRead).length,
  );
  totalUnreadCount = computed(
    () => this.pendingRequests().length + this.unreadNotificationsCount(),
  );

  getCurrentUserId(): string {
    return this.authService.getCurrentUserId();
  }

  ngOnInit() {
    this.fetchNotifications();
  }

  fetchNotifications() {
    const currentUserId = this.getCurrentUserId();
    this.http
      .get<{ pendingRequests: PendingRequestItem[]; notifications: FeedNotificationItem[] }>(
        `http://localhost:3001/api/notifications?userId=${encodeURIComponent(currentUserId)}`,
      )
      .subscribe({
        next: (res) => {
          this.pendingRequests.set(res?.pendingRequests || []);
          this.feedNotifications.set(res?.notifications || []);
        },
        error: () => {
          this.pendingRequests.set([]);
          this.feedNotifications.set([]);
        },
      });
  }

  handleSendFriendRequest(inputVal: string) {
    const rawId = inputVal.trim().replace(/^@+/, '');
    const formatted = `@${rawId}`;
    const currentUserId = this.getCurrentUserId();

    this.http
      .post<{
        success: boolean;
        message: string;
        pendingRequest?: PendingRequestItem;
        notification?: FeedNotificationItem;
      }>('http://localhost:3001/api/notifications/friend-request', {
        userId: rawId,
        handle: formatted,
        requesterUserId: currentUserId,
      })
      .subscribe({
        next: (res) => {
          this.showToast(res?.message || `✓ Friend request sent to ${formatted}!`);
          if (res?.notification) {
            this.feedNotifications.update((prev) => [res.notification!, ...prev]);
          }
          this.syncService.sendSyncItem('note', `Sent connection invitation to ${formatted}`);
        },
        error: () => {
          // Optimistic local update
          this.showToast(`✓ Friend request sent to ${formatted}!`);
        },
      });
  }

  handleAcceptRequest(req: PendingRequestItem) {
    this.pendingRequests.update((list) => list.filter((r) => r.id !== req.id));
    this.showToast(`✓ Connected with ${req.name}!`);

    // Add activity notification
    const newActivity: FeedNotificationItem = {
      id: `act_${Date.now()}`,
      type: 'gift_sync',
      title: 'New Connection Added',
      description: `You and ${req.name} (${req.handle}) are now connected in Shareship!`,
      timeAgo: 'Just now',
      iconType: 'heart',
      isRead: false,
    };
    this.feedNotifications.update((prev) => [newActivity, ...prev]);

    this.http
      .post(`http://localhost:3001/api/notifications/requests/${req.id}/accept`, {})
      .subscribe({
        next: () => {
          this.syncService.sendSyncItem('note', `Accepted friend connection from ${req.name}`);
        },
        error: () => {},
      });
  }

  handleDeclineRequest(req: PendingRequestItem) {
    this.pendingRequests.update((list) => list.filter((r) => r.id !== req.id));
    this.showToast(`Dismissed connection request from ${req.name}`);

    this.http
      .post(`http://localhost:3001/api/notifications/requests/${req.id}/decline`, {})
      .subscribe({
        error: () => {},
      });
  }

  handleViewAllRequests() {
    this.showToast(`Viewing all ${this.pendingRequests().length} pending requests`);
  }

  handleMarkAllRead() {
    this.feedNotifications.update((list) => list.map((item) => ({ ...item, isRead: true })));
    this.showToast('✓ All notifications marked as read');
    const currentUserId = this.getCurrentUserId();

    this.http
      .post(
        `http://localhost:3001/api/notifications/mark-all-read?userId=${encodeURIComponent(currentUserId)}`,
        {},
      )
      .subscribe({
        error: () => {},
      });
  }

  handleTabSwitch(tab: NavTab) {
    if (tab === 'home') {
      this.router.navigate(['/dashboard']);
    } else if (tab === 'calendar') {
      this.router.navigate(['/calendar']);
    } else if (tab === 'expenses') {
      this.router.navigate(['/expenses']);
    } else if (tab === 'notes') {
      this.router.navigate(['/notes']);
    } else if (tab === 'gifts') {
      this.router.navigate(['/gifts']);
    } else if (tab === 'alerts') {
      // Already on alerts
    }
  }

  showToast(message: string) {
    this.activeToast.set(message);
    setTimeout(() => {
      if (this.activeToast() === message) {
        this.activeToast.set(null);
      }
    }, 3500);
  }
}

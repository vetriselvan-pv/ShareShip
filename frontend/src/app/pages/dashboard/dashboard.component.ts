import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TopBarComponent } from '../../components/top-bar/top-bar.component';
import { EventHeroCardComponent } from '../../components/event-hero-card/event-hero-card.component';
import { BottomNavComponent, NavTab } from '../../components/bottom-nav/bottom-nav.component';
import { SyncModalComponent } from '../../components/sync-modal/sync-modal.component';
import { PartnerCardComponent } from '../../components/partner-card/partner-card.component';
import { AddConnectionModalComponent } from '../../components/add-connection-modal/add-connection-modal.component';
import { AddEventModalComponent } from '../../components/add-event-modal/add-event-modal.component';
import { SyncService } from '../../services/sync.service';
import { ConnectionService } from '../../services/connection.service';
import { CalendarService, CalendarEvent } from '../../services/calendar.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    TopBarComponent,
    EventHeroCardComponent,
    BottomNavComponent,
    SyncModalComponent,
    PartnerCardComponent,
    AddConnectionModalComponent,
    AddEventModalComponent,
  ],
  template: `
    <main
      class="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f2fcf5] text-[#151d1a] flex flex-col justify-between selection:bg-[#adcebe] selection:text-[#133126] font-sans pb-24"
    >
      <!-- Top Bar Component -->
      <app-top-bar
        [isLiveSync]="syncService.isLiveSyncActive()"
        [unreadCount]="syncService.unreadSyncCount()"
        (onLogoClick)="router.navigate(['/'])"
        (onStatusClick)="isSyncModalOpen.set(true)"
        (onNotificationClick)="router.navigate(['/notifications'])"
      />

      <!-- Main Center Content Container -->
      <div
        class="w-full max-w-[375px] sm:max-w-[400px] mx-auto px-0.5 pt-0.5 flex flex-col gap-3.5 flex-1 box-border"
      >
        <!-- 1. Upcoming Event Hero Card (Next 1 Month Events, Swipeable, Same Design) -->
        <section class="w-full mt-1">
          <app-event-hero-card
            [events]="calendarService.upcomingNextMonthEvents()"
            (onViewItinerary)="handleViewDetails($event)"
            (onAddEvent)="isAddEventOpen.set(true)"
          />
        </section>

        <!-- 2. Connected Friends / Partner Section (Bottom, Icon Only) -->
        <section class="w-full mb-1">
          <app-partner-card
            [partnerName]="connectionService.activePartner()?.name || syncService.partnerName()"
            [partnerUserId]="connectionService.activePartner()?.userId || ''"
            [partnerInitial]="(connectionService.activePartner()?.name || syncService.partnerName() || 'P').charAt(0).toUpperCase()"
            [avatarUrl]="connectionService.activePartner()?.avatarUrl || ''"
            [status]="connectionService.isPartnerConnected() ? 'connected' : (connectionService.pendingPartner() ? 'pending' : 'none')"
            [isSyncActive]="syncService.isLiveSyncActive()"
            (onBadgeClick)="isSyncModalOpen.set(true)"
            (onConnectClick)="isAddConnectionOpen.set(true)"
          />
        </section>
      </div>

      <!-- Persistent Bottom Navigation Bar -->
      <app-bottom-nav [activeTab]="'home'" (tabSelected)="handleTabSwitch($event)" />

      <!-- Event Details Modal (Dynamic) -->
      @if (isItineraryOpen() && selectedEvent()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs fade-in"
        >
          <div
            class="w-full max-w-sm bg-[#f2fcf5] rounded-3xl border border-[#dbe5df] shadow-2xl p-5 flex flex-col gap-4"
          >
            <div class="flex items-center justify-between pb-2 border-b border-[#dbe5df]">
              <div class="max-w-[240px]">
                <h3 class="text-lg font-semibold text-[#151d1a] truncate">{{ selectedEvent()?.title }}</h3>
                <p class="text-xs text-[#414844] truncate">
                  {{ calendarService.formatDisplayDate(selectedEvent()!.date, selectedEvent()?.time) }}
                  @if (selectedEvent()?.location) {
                    • {{ selectedEvent()?.location }}
                  }
                </p>
              </div>
              <button
                type="button"
                (click)="isItineraryOpen.set(false)"
                class="w-7 h-7 rounded-full bg-[#e6f0ea] flex items-center justify-center text-[#414844] hover:bg-[#dbe5df] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div class="flex flex-col gap-2.5 py-1 text-sm">
              <div class="flex items-center justify-between p-2.5 bg-[#ecf6f0] rounded-xl border border-[#dbe5df]/80">
                <span class="text-xs text-[#414844] font-medium">Category</span>
                <span class="text-xs font-semibold text-[#151d1a] capitalize">{{ selectedEvent()?.category || 'Event' }}</span>
              </div>
              <div class="flex items-center justify-between p-2.5 bg-[#ecf6f0] rounded-xl border border-[#dbe5df]/80">
                <span class="text-xs text-[#414844] font-medium">Event Date</span>
                <span class="text-xs font-semibold text-[#151d1a]">{{ selectedEvent()?.date }}</span>
              </div>
              @if (selectedEvent()?.location) {
                <div class="flex items-center justify-between p-2.5 bg-[#ecf6f0] rounded-xl border border-[#dbe5df]/80">
                  <span class="text-xs text-[#414844] font-medium">Location</span>
                  <span class="text-xs font-semibold text-[#151d1a] truncate max-w-[170px]">{{ selectedEvent()?.location }}</span>
                </div>
              }
              <div class="flex items-center justify-between p-2.5 bg-[#ecf6f0] rounded-xl border border-[#dbe5df]/80">
                <span class="text-xs text-[#414844] font-medium">Gift / Registry</span>
                <span class="text-xs font-semibold text-[#151d1a]">{{ selectedEvent()?.gift || 'None noted' }}</span>
              </div>
              <div class="flex items-center justify-between p-2.5 bg-[#ecf6f0] rounded-xl border border-[#dbe5df]/80">
                <span class="text-xs text-[#414844] font-medium">Created By</span>
                <span class="text-xs font-semibold text-[#151d1a]">
                  {{ isCreatedByMe(selectedEvent()!) ? 'You (' + calendarService.getCurrentUserName() + ')' : (selectedEvent()?.creator || 'Partner') }}
                </span>
              </div>
              <div class="flex items-center justify-between p-2.5 bg-[#ecf6f0] rounded-xl border border-[#dbe5df]/80">
                <span class="text-xs text-[#414844] font-medium">Countdown</span>
                <span class="text-xs font-semibold text-[#466557]">{{ calendarService.getDaysRemainingText(selectedEvent()!.date) }}</span>
              </div>
            </div>

            <button
              type="button"
              (click)="isItineraryOpen.set(false)"
              class="w-full py-2.5 rounded-xl bg-[#466557] text-white font-medium text-xs shadow-xs cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      }

      <!-- Interactive Floating Toast -->
      @if (activeToast()) {
        <div
          class="fixed top-14 left-1/2 -translate-x-1/2 max-w-[340px] w-[90%] p-3 rounded-2xl text-xs font-semibold text-center shadow-lg border border-[#adcebe] bg-[#c8ead9] text-[#012016] z-50 fade-in"
        >
          {{ activeToast() }}
        </div>
      }

      <!-- Real-Time Sync Modal -->
      <app-sync-modal
        [isOpen]="isSyncModalOpen()"
        [partnerLink]="syncService.partnerLink()"
        [events]="syncService.syncEvents()"
        (close)="isSyncModalOpen.set(false)"
        (triggerPartnerSync)="syncService.simulatePartnerPing()"
        (triggerMySync)="syncService.sendSyncItem('calendar', 'Partner checked calendar events')"
      />

      <!-- Add Partner Connection Modal -->
      <app-add-connection-modal
        [isOpen]="isAddConnectionOpen()"
        (close)="isAddConnectionOpen.set(false)"
      />

      <!-- Add Event Modal (Available directly from Dashboard empty state or action) -->
      <app-add-event-modal
        [isOpen]="isAddEventOpen()"
        (close)="isAddEventOpen.set(false)"
        (eventCreated)="handleEventCreated($event)"
      />
    </main>
  `,
})
export class DashboardComponent {
  syncService = inject(SyncService);
  connectionService = inject(ConnectionService);
  calendarService = inject(CalendarService);
  router = inject(Router);

  isSyncModalOpen = signal<boolean>(false);
  isItineraryOpen = signal<boolean>(false);
  isAddConnectionOpen = signal<boolean>(false);
  isAddEventOpen = signal<boolean>(false);
  selectedEvent = signal<CalendarEvent | null>(null);
  activeToast = signal<string | null>(null);

  isCreatedByMe(event: CalendarEvent): boolean {
    if (!event) return false;
    const myId = this.calendarService.getCurrentUserId().toLowerCase();
    if (event.userId && event.userId.toLowerCase() === myId) return true;
    if (event.creatorRole === 'me') return true;
    const myName = this.calendarService.getCurrentUserName().toLowerCase();
    if (event.creator && event.creator.toLowerCase() === myName) return true;
    return false;
  }

  handleViewDetails(event: CalendarEvent) {
    this.selectedEvent.set(event);
    this.isItineraryOpen.set(true);
  }

  async handleEventCreated(event: { title: string; category: string; date: string; location: string; gift: string }) {
    this.isAddEventOpen.set(false);
    const dateVal = event.date || new Date().toISOString().split('T')[0];
    const res = await this.calendarService.createEvent({
      title: event.title,
      category: event.category,
      date: dateVal,
      location: event.location,
      gift: event.gift
    });
    if (res.success) {
      this.showToast(`✓ "${event.title}" saved & added to upcoming events!`);
    } else {
      this.showToast(`Failed to save: ${res.error || 'Server error'}`);
    }
  }

  handleTabSwitch(tab: NavTab) {
    if (tab === 'home') {
      // already on dashboard
    } else if (tab === 'calendar') {
      this.router.navigate(['/calendar']);
    } else if (tab === 'expenses') {
      this.router.navigate(['/expenses']);
    } else if (tab === 'notes') {
      this.router.navigate(['/notes']);
    } else if (tab === 'gifts') {
      this.router.navigate(['/gifts']);
    } else if (tab === 'alerts') {
      this.router.navigate(['/notifications']);
    }
  }

  showToast(message: string) {
    this.activeToast.set(message);
    setTimeout(() => {
      if (this.activeToast() === message) {
        this.activeToast.set(null);
      }
    }, 4000);
  }
}

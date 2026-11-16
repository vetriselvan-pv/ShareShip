import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TopBarComponent } from '../../components/top-bar/top-bar.component';
import { CalendarMonthWidgetComponent } from '../../components/calendar-month-widget/calendar-month-widget.component';
import { SelectedEventsCardComponent } from '../../components/selected-events-card/selected-events-card.component';
import { SyncBannerComponent } from '../../components/sync-banner/sync-banner.component';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';
import { AddEventModalComponent } from '../../components/add-event-modal/add-event-modal.component';
import { EditEventModalComponent } from '../../components/edit-event-modal/edit-event-modal.component';
import { SyncModalComponent } from '../../components/sync-modal/sync-modal.component';
import { SyncService } from '../../services/sync.service';
import { CalendarService } from '../../services/calendar.service';
import { NavTab } from '../../models/navigation.models';
import { CalendarEvent } from '../../models/calendar.models';

@Component({
  selector: 'app-calendar-gifts',
  imports: [
    TopBarComponent,
    CalendarMonthWidgetComponent,
    SelectedEventsCardComponent,
    SyncBannerComponent,
    BottomNavComponent,
    AddEventModalComponent,
    EditEventModalComponent,
    SyncModalComponent
  ],
  template: `
    <main class="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f2fcf5] text-[#151d1a] flex flex-col justify-between selection:bg-[#adcebe] selection:text-[#133126] font-sans pb-28">
      
      <!-- Top Bar Component -->
      <app-top-bar
        [isLiveSync]="syncService.isLiveSyncActive()"
        [unreadCount]="syncService.unreadSyncCount()"
        (onLogoClick)="router.navigate(['/dashboard'])"
        (onNotificationClick)="router.navigate(['/notifications'])"
      />

      <!-- Main Center Content Container -->
      <div class="w-full max-w-[390px] mx-auto px-4 pt-1 flex flex-col gap-3.5 flex-1 box-border">
        
        <!-- 1. Header Section -->
        <section class="flex flex-col text-left mt-1">
          <h1 class="text-[19px] sm:text-[20px] font-semibold text-[#151d1a] tracking-tight leading-tight">
            Shared Calendar
          </h1>
          <p class="text-[12px] text-[#414844] font-normal leading-snug mt-0.5">
            Moments of celebration &amp; shared events
          </p>
        </section>

        <!-- 2. Interactive Calendar Widget -->
        <section class="w-full">
          <app-calendar-month-widget 
            [eventDays]="eventDaysForActiveMonth()"
            (dateSelected)="handleDateSelected($event)"
            (monthChange)="handleMonthChange($event)"
          />
        </section>

        <!-- 3. Selected Date Events Section -->
        @if (selectedDateTitle()) {
          <section class="w-full">
            <app-selected-events-card 
              [sectionTitle]="selectedDateTitle()"
              [events]="selectedDayEvents()"
              (onAddEvent)="isAddEventModalOpen.set(true)"
              (onEditEvent)="handleOpenEdit($event)"
              (onDeleteEvent)="handleOpenDeleteConfirm($event)"
            />
          </section>
        }

        <!-- 4. Informational Sync Banner -->
        <section class="w-full mb-1">
          <app-sync-banner />
        </section>

      </div>

      <!-- Floating Action Button ("Add Event") -->
      <div class="fixed bottom-24 right-4 sm:right-8 z-40">
        <button
          type="button"
          (click)="isAddEventModalOpen.set(true)"
          class="flex items-center gap-2 bg-[#466557] hover:bg-[#395347] active:scale-95 text-white font-semibold text-xs py-3 px-4 rounded-full shadow-lg transition-all cursor-pointer"
        >
          <!-- Add Circle Icon -->
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
          <span>Add Event</span>
        </button>
      </div>

      <!-- Persistent Bottom Navigation Bar (Calendar Active Tab) -->
      <app-bottom-nav
        [activeTab]="'calendar'"
        (tabSelected)="handleTabSwitch($event)"
      />

      <!-- Add Event Modal -->
      <app-add-event-modal
        [isOpen]="isAddEventModalOpen()"
        (close)="isAddEventModalOpen.set(false)"
        (eventCreated)="handleEventCreated($event)"
      />

      <!-- Edit Event Modal -->
      <app-edit-event-modal
        [isOpen]="isEditEventModalOpen()"
        [event]="eventToEdit()"
        (close)="isEditEventModalOpen.set(false)"
        (eventUpdated)="handleEventUpdated($event)"
        (eventDeleted)="handlePromptDeleteFromEdit($event)"
      />

      <!-- Delete Confirmation Modal Dialog -->
      @if (isDeleteConfirmModalOpen() && eventToDelete()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div class="w-full max-w-xs bg-[#f2fcf5] rounded-3xl border border-[#dbe5df] shadow-2xl p-5 flex flex-col gap-3 text-center">
            <div class="w-12 h-12 rounded-full bg-[#fcdad7] text-[#ba1a1a] flex items-center justify-center mx-auto shadow-2xs">
              <svg class="w-6 h-6 stroke-current fill-none" viewBox="0 0 24 24" stroke-width="2">
                <path d="M3 6h18"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </div>

            <h3 class="text-base font-bold text-[#151d1a]">Delete Event?</h3>
            <p class="text-xs text-[#414844]">
              Are you sure you want to delete <span class="font-semibold text-[#151d1a]">"{{ eventToDelete()?.title }}"</span>? This will remove it from your shared calendar.
            </p>

            <div class="flex items-center gap-2 pt-2 border-t border-[#dbe5df]">
              <button
                type="button"
                (click)="isDeleteConfirmModalOpen.set(false)"
                class="flex-1 py-2 rounded-xl bg-[#e6f0ea] hover:bg-[#dbe5df] text-[#151d1a] font-medium text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="confirmDeleteEvent()"
                class="flex-1 py-2 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Real-Time Sync Modal -->
      <app-sync-modal
        [isOpen]="isSyncModalOpen()"
        [partnerLink]="syncService.partnerLink()"
        [events]="syncService.syncEvents()"
        (close)="isSyncModalOpen.set(false)"
        (triggerPartnerSync)="syncService.simulatePartnerPing('Partner added an event')"
        (triggerMySync)="syncService.sendSyncItem('calendar', 'Updated calendar schedule')"
      />

      <!-- Floating Toast -->
      @if (activeToast()) {
        <div class="fixed top-14 left-1/2 -translate-x-1/2 max-w-[340px] w-[90%] p-3 rounded-2xl text-xs font-semibold text-center shadow-lg border border-[#adcebe] bg-[#c8ead9] text-[#012016] z-50 fade-in">
          {{ activeToast() }}
        </div>
      }

    </main>
  `
})
export class CalendarGiftsComponent implements OnInit {
  syncService = inject(SyncService);
  calendarService = inject(CalendarService);
  router = inject(Router);

  isSyncModalOpen = signal<boolean>(false);
  isAddEventModalOpen = signal<boolean>(false);
  isEditEventModalOpen = signal<boolean>(false);
  eventToEdit = signal<CalendarEvent | null>(null);

  isDeleteConfirmModalOpen = signal<boolean>(false);
  eventToDelete = signal<CalendarEvent | null>(null);

  activeToast = signal<string | null>(null);

  activeMonth = signal<number>(new Date().getMonth());
  activeYear = signal<number>(new Date().getFullYear());
  selectedDateTitle = signal<string>('');
  selectedDateStr = signal<string>('');

  ngOnInit() {
    const today = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    this.handleDateSelected({
      day: today.getDate(),
      month: monthNames[today.getMonth()],
      year: today.getFullYear()
    });
  }

  readonly eventDaysForActiveMonth = computed(() => {
    const events = this.calendarService.events();
    const m = this.activeMonth() + 1; // 1-indexed
    const y = this.activeYear();
    const days: number[] = [];
    for (const ev of events) {
      if (!ev.date) continue;
      const parts = ev.date.split('-');
      if (parts.length === 3) {
        const evYear = Number(parts[0]);
        const evMonth = Number(parts[1]);
        const evDay = Number(parts[2]);
        if (evYear === y && evMonth === m) {
          days.push(evDay);
        }
      }
    }
    return days;
  });

  readonly selectedDayEvents = computed(() => {
    const selected = this.selectedDateStr();
    if (!selected) return [];
    return this.calendarService.events().filter(e => e.date === selected);
  });

  handleDateSelected(event: { day: number; month: string; year: number }) {
    // Format YYYY-MM-DD
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = monthNames.findIndex(m => m.toLowerCase().startsWith(event.month.toLowerCase()));
    const mNum = (monthIndex >= 0 ? monthIndex + 1 : 1).toString().padStart(2, '0');
    const dNum = event.day.toString().padStart(2, '0');
    this.selectedDateStr.set(`${event.year}-${mNum}-${dNum}`);

    this.selectedDateTitle.set(`Events on ${event.month.substring(0, 3)} ${event.day}, ${event.year}`);
  }

  handleMonthChange(event: { month: string; year: number }) {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = monthNames.findIndex(m => m.toLowerCase().startsWith(event.month.toLowerCase()));
    if (monthIndex >= 0) {
      this.activeMonth.set(monthIndex);
    }
    this.activeYear.set(event.year);
    this.selectedDateTitle.set('');
    this.selectedDateStr.set('');
  }

  async handleEventCreated(event: { title: string; category: string; date: string; location: string; gift: string }) {
    this.isAddEventModalOpen.set(false);
    const dateVal = event.date || this.selectedDateStr() || new Date().toISOString().split('T')[0];
    const res = await this.calendarService.createEvent({
      title: event.title,
      category: event.category,
      date: dateVal,
      location: event.location,
      gift: event.gift
    });
    if (res.success) {
      this.showToast(`✓ "${event.title}" saved to calendar & database!`);
    } else {
      this.showToast(`Failed to save: ${res.error || 'Server error'}`);
    }
  }

  handleOpenEdit(event: CalendarEvent) {
    this.eventToEdit.set(event);
    this.isEditEventModalOpen.set(true);
  }

  async handleEventUpdated(updated: {
    id: string;
    title: string;
    category: string;
    date: string;
    time?: string;
    location?: string;
    gift?: string;
  }) {
    this.isEditEventModalOpen.set(false);
    const res = await this.calendarService.updateEvent(updated.id, {
      title: updated.title,
      category: updated.category,
      date: updated.date,
      time: updated.time,
      location: updated.location,
      gift: updated.gift
    });

    if (res.success) {
      this.showToast(`✓ "${updated.title}" updated successfully!`);
    } else {
      this.showToast(`Failed to update: ${res.error || 'Server error'}`);
    }
  }

  handleOpenDeleteConfirm(event: CalendarEvent) {
    this.eventToDelete.set(event);
    this.isDeleteConfirmModalOpen.set(true);
  }

  handlePromptDeleteFromEdit(event: CalendarEvent) {
    this.isEditEventModalOpen.set(false);
    this.handleOpenDeleteConfirm(event);
  }

  async confirmDeleteEvent() {
    const ev = this.eventToDelete();
    this.isDeleteConfirmModalOpen.set(false);
    if (!ev) return;

    const res = await this.calendarService.deleteEvent(ev.id);
    if (res.success) {
      this.showToast(`✓ "${ev.title}" deleted from calendar`);
    } else {
      this.showToast(`Failed to delete: ${res.error || 'Server error'}`);
    }
  }

  handleTabSwitch(tab: NavTab) {
    if (tab === 'home') {
      this.router.navigate(['/dashboard']);
    } else if (tab === 'calendar') {
      // already on calendar
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
    }, 3500);
  }
}

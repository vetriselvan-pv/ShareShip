import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { TopBarComponent } from '../../components/top-bar/top-bar.component';
import { CalendarStatsCardComponent } from '../../components/calendar-stats-card/calendar-stats-card.component';
import { RegistrySectionComponent } from '../../components/registry-section/registry-section.component';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';
import { SyncModalComponent } from '../../components/sync-modal/sync-modal.component';
import { SyncService } from '../../services/sync.service';
import { AuthService } from '../../services/auth.service';
import { ConnectionService } from '../../services/connection.service';
import { CurrencyService } from '../../services/currency.service';
import { NavTab } from '../../models/navigation.models';
import { RegistryEntry } from '../../models/gifts.models';

@Component({
  selector: 'app-gifts-registry',
  imports: [
    FormsModule,
    TopBarComponent,
    CalendarStatsCardComponent,
    RegistrySectionComponent,
    BottomNavComponent,
    SyncModalComponent,
  ],
  template: `
    <main
      class="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f2fcf5] text-[#151d1a] flex flex-col justify-between selection:bg-[#adcebe] selection:text-[#133126] font-sans pb-28"
    >
      <!-- Top Bar Component (with direct navigation to Notifications/Alerts) -->
      <app-top-bar
        [isLiveSync]="syncService.isLiveSyncActive()"
        [unreadCount]="syncService.unreadSyncCount()"
        (onLogoClick)="router.navigate(['/dashboard'])"
        (onNotificationClick)="router.navigate(['/notifications'])"
      />

      <!-- Main Center Content Container -->
      <div
        class="w-full max-w-[390px] mx-auto px-4 pt-1 flex flex-col gap-3.5 flex-1 box-border"
      >
        <!-- 1. Header Section -->
        <section class="flex flex-col text-left mt-1">
          <h1
            class="text-[19px] sm:text-[20px] font-semibold text-[#151d1a] tracking-tight leading-tight"
          >
            Gifts &amp; Registry
          </h1>
          <p class="text-[12px] text-[#414844] font-normal leading-snug mt-0.5">
            Celebration wishlist, registry funds &amp; partner gifts
          </p>
        </section>

        <!-- 2. Budget & Registry Stats Overview -->
        <section class="w-full">
          <app-calendar-stats-card
            [partnerNames]="partnerNamesText()"
            [eventsTrackedText]="'Shared registry active'"
            [totalBudget]="'0'"
            [avatar1]="authService.getCurrentUser()?.avatarUrl || ''"
            [avatar2]="connectionService.activePartner()?.avatarUrl || ''"
          />
        </section>

        <!-- 3. Active Claimed Gifts Widget -->
        <!-- <section class="w-full">
          <app-gift-tracker-widget />
        </section> -->

        <!-- 4. Gift & Money Registry Section (Searchable & Filterable) -->
        <section class="w-full mb-2">
          <app-registry-section #regSection (onAddRegistryItem)="isAddGiftModalOpen.set(true)" />
        </section>
      </div>

      <!-- Floating Action Button ("Add Gift") -->
      <div class="fixed bottom-24 right-4 sm:right-8 z-40">
        <button
          type="button"
          (click)="isAddGiftModalOpen.set(true)"
          class="flex items-center gap-2 bg-[#466557] hover:bg-[#395347] active:scale-95 text-white font-semibold text-xs py-3 px-4 rounded-full shadow-lg transition-all cursor-pointer"
        >
          <!-- Add Circle Icon -->
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
          <span>Add Gift</span>
        </button>
      </div>

      <!-- Persistent Bottom Navigation Bar (Gifts Active Tab) -->
      <app-bottom-nav [activeTab]="'gifts'" (tabSelected)="handleTabSwitch($event)" />

      <!-- Real-Time Sync Modal -->
      <app-sync-modal
        [isOpen]="isSyncModalOpen()"
        [partnerLink]="syncService.partnerLink()"
        [events]="syncService.syncEvents()"
        (close)="isSyncModalOpen.set(false)"
        (triggerPartnerSync)="
          syncService.simulatePartnerPing('Partner added a gift to registry')
        "
        (triggerMySync)="
          syncService.sendSyncItem('note', (authService.getCurrentUserName() || 'You') + ' marked registry gift fulfilled')
        "
      />

      <!-- Quick Add Gift / Registry Item Modal -->
      @if (isAddGiftModalOpen()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs fade-in"
        >
          <div
            class="w-full max-w-sm bg-[#f2fcf5] rounded-3xl border border-[#dbe5df] shadow-2xl p-4 flex flex-col gap-4"
          >
            <div class="flex items-center justify-between pb-2 border-b border-[#dbe5df]">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-[#c8ead9] flex items-center justify-center">
                  <img src="icons/gift.svg" class="w-5 h-5 object-contain" alt="Gift" />
                </div>
                <div>
                  <h3 class="text-[17px] font-semibold text-[#151d1a] leading-tight">Add Registry Gift</h3>
                  <p class="text-xs text-[#414844]">Wishlist item or fund for celebrations</p>
                </div>
              </div>
              <button
                type="button"
                (click)="isAddGiftModalOpen.set(false)"
                class="w-7 h-7 rounded-full bg-[#e6f0ea] flex items-center justify-center text-[#414844] hover:bg-[#dbe5df]"
              >
                ✕
              </button>
            </div>

            <form (ngSubmit)="handleCreateGift()" class="flex flex-col gap-3">
              <div>
                <label class="text-xs font-semibold text-[#414844] block mb-1"
                  >Recipient / Occasion</label
                >
                <input
                  type="text"
                  [(ngModel)]="newGiftRecipient"
                  name="recipient"
                  placeholder="e.g. Mia & Jordan Wedding"
                  class="w-full px-3.5 py-2.5 bg-white border border-[#dbe5df] rounded-xl text-sm focus:outline-none focus:border-[#466557]"
                  required
                />
              </div>

              <div>
                <label class="text-xs font-semibold text-[#414844] block mb-1"
                  >Gift Item or Cash Fund</label
                >
                <input
                  type="text"
                  [(ngModel)]="newGiftTitle"
                  name="title"
                  [placeholder]="'e.g. Espresso Machine / ' + currencyService.currencySymbol() + '100 Fund'"
                  class="w-full px-3.5 py-2.5 bg-white border border-[#dbe5df] rounded-xl text-sm focus:outline-none focus:border-[#466557]"
                  required
                />
              </div>

              <div>
                <label class="text-xs font-semibold text-[#414844] block mb-1"
                  >Target Amount ({{ currencyService.currencySymbol() }})</label
                >
                <input
                  type="number"
                  [(ngModel)]="newGiftAmount"
                  name="amount"
                  placeholder="100.00"
                  class="w-full px-3.5 py-2.5 bg-white border border-[#dbe5df] rounded-xl text-sm focus:outline-none focus:border-[#466557]"
                />
              </div>

              <div class="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  (click)="isAddGiftModalOpen.set(false)"
                  class="flex-1 py-2.5 rounded-xl border border-[#dbe5df] text-[#414844] font-medium text-xs hover:bg-[#e6f0ea]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="flex-1 py-2.5 rounded-xl bg-[#466557] hover:bg-[#3b5549] text-white font-medium text-xs shadow-xs"
                >
                  Save to Registry
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Floating Toast -->
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
export class GiftsRegistryComponent {
  syncService = inject(SyncService);
  authService = inject(AuthService);
  connectionService = inject(ConnectionService);
  currencyService = inject(CurrencyService);
  private http = inject(HttpClient);
  router = inject(Router);

  @ViewChild('regSection') regSection?: RegistrySectionComponent;

  partnerNamesText = computed(() => {
    const me = this.authService.getCurrentUserName() || 'You';
    const partner = this.connectionService.activePartner()?.name || this.syncService.partnerName();
    return partner ? `${me} & ${partner}` : me;
  });

  isSyncModalOpen = signal<boolean>(false);
  isAddGiftModalOpen = signal<boolean>(false);
  activeToast = signal<string | null>(null);

  newGiftRecipient = '';
  newGiftTitle = '';
  newGiftAmount = 100;

  handleCreateGift() {
    if (!this.newGiftRecipient || !this.newGiftTitle) return;
    const authorName = this.authService.getCurrentUserName() || 'You';
    const recipient = this.newGiftRecipient;
    const title = this.newGiftTitle;
    const amount = this.newGiftAmount;
    this.isAddGiftModalOpen.set(false);
    this.showToast(`✓ "${title}" added to shared registry!`);

    this.http.post<{ success: boolean; item?: any }>(`${environment.apiUrl}/api/calendar/registry`, {
      recipient,
      occasion: 'Wishlist Item',
      amount,
      giftType: title,
      creator: authorName,
      creatorRole: 'me',
      status: 'Idea Saved'
    }).subscribe({
      next: (res) => {
        if (res?.item && this.regSection) {
          this.regSection.addEntryLocally(res.item);
        }
      },
      error: () => {}
    });

    this.syncService.sendSyncItem(
      'note',
      `${authorName} added gift idea: ${title} for ${recipient} (${this.currencyService.format(amount)})`,
    );
    this.newGiftRecipient = '';
    this.newGiftTitle = '';
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
      // already on gifts
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

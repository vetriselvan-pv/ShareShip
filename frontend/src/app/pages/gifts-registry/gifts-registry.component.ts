import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
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
import { RelativeService } from '../../services/relative.service';
import { CalendarService } from '../../services/calendar.service';
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
      <!-- Top Bar Component -->
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
            Moi virundhu, celebration gifts &amp; relatives tracker
          </p>
        </section>

        <!-- 2. Budget & Registry Stats Overview -->
        <section class="w-full">
          <app-calendar-stats-card
            [partnerNames]="partnerNamesText()"
            [eventsTrackedText]="'Shared registry active'"
            [totalBudget]="totalTrackedFormatted()"
            [avatar1]="authService.getCurrentUser()?.avatarUrl || ''"
            [avatar2]="connectionService.activePartner()?.avatarUrl || ''"
          />
        </section>

        <!-- 3. Gift & Money Registry Section (Searchable & Filterable) -->
        <section class="w-full mb-2">
          <app-registry-section #regSection (onAddRegistryItem)="openAddGiftModal()" />
        </section>
      </div>

      <!-- Floating Action Button ("Add Gift") -->
      <div class="fixed bottom-24 right-4 sm:right-8 z-40">
        <button
          type="button"
          (click)="openAddGiftModal()"
          class="flex items-center gap-2 bg-[#466557] hover:bg-[#395347] active:scale-95 text-white font-semibold text-xs py-3 px-4 rounded-full shadow-lg transition-all cursor-pointer"
        >
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
          <span>Add Gift</span>
        </button>
      </div>

      <!-- Persistent Bottom Navigation Bar -->
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
          syncService.sendSyncItem('note', (authService.getCurrentUserName() || 'You') + ' updated gift registry')
        "
      />

      <!-- Quick Add Gift / Registry Item Modal -->
      @if (isAddGiftModalOpen()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs fade-in"
        >
          <div
            class="w-full max-w-sm bg-[#f2fcf5] rounded-3xl border border-[#dbe5df] shadow-2xl p-4 flex flex-col gap-3.5 max-h-[90vh] overflow-y-auto"
          >
            <!-- Modal Header -->
            <div class="flex items-center justify-between pb-2 border-b border-[#dbe5df]">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-[#c8ead9] flex items-center justify-center">
                  <img src="icons/gift.svg" class="w-5 h-5 object-contain" alt="Gift" />
                </div>
                <div>
                  <h3 class="text-[17px] font-semibold text-[#151d1a] leading-tight">Record Gift / Moi</h3>
                  <p class="text-xs text-[#414844]">Occasion, relative, amount &amp; type</p>
                </div>
              </div>
              <button
                type="button"
                (click)="isAddGiftModalOpen.set(false)"
                class="w-7 h-7 rounded-full bg-[#e6f0ea] flex items-center justify-center text-[#414844] hover:bg-[#dbe5df] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <!-- Form -->
            <form (ngSubmit)="handleCreateGift()" class="flex flex-col gap-3 text-left">
              <!-- 1. Occasion Dropdown (+ Create Option) -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-xs font-semibold text-[#414844]">Occasion *</label>
                  @if (!isCreatingOccasion()) {
                    <button
                      type="button"
                      (click)="isCreatingOccasion.set(true)"
                      class="text-[11px] font-semibold text-[#466557] hover:underline cursor-pointer"
                    >
                      + New Occasion
                    </button>
                  }
                </div>

                @if (!isCreatingOccasion()) {
                  <select
                    [(ngModel)]="selectedOccasion"
                    name="occasionSelect"
                    (change)="handleOccasionSelectChange($event)"
                    class="w-full px-3 py-2 bg-white border border-[#dbe5df] rounded-xl text-sm text-[#151d1a] focus:outline-none focus:border-[#466557]"
                    required
                  >
                    <option value="" disabled>-- Select Occasion --</option>
                    @for (occ of occasionsList(); track occ) {
                      <option [value]="occ">{{ occ }}</option>
                    }
                    <option value="__ADD_NEW__">+ Create New Occasion...</option>
                  </select>
                } @else {
                  <div class="flex items-center gap-1.5">
                    <input
                      type="text"
                      [(ngModel)]="newOccasionTitle"
                      name="newOccasionInput"
                      placeholder="e.g. Wedding, Housewarming"
                      class="flex-1 px-3 py-2 bg-white border border-[#466557] rounded-xl text-sm text-[#151d1a] focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      (click)="saveNewOccasion()"
                      class="px-2.5 py-2 bg-[#466557] text-white text-xs font-semibold rounded-xl hover:bg-[#395347] transition-colors cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      (click)="isCreatingOccasion.set(false)"
                      class="px-2 py-2 bg-[#e6f0ea] text-[#414844] text-xs font-semibold rounded-xl hover:bg-[#dbe5df] transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                }
              </div>

              <!-- 2. Relatives Dropdown (+ Relative Master Creation) -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-xs font-semibold text-[#414844]">Relative (Master) *</label>
                  @if (!isCreatingRelative()) {
                    <button
                      type="button"
                      (click)="isCreatingRelative.set(true)"
                      class="text-[11px] font-semibold text-[#466557] hover:underline cursor-pointer"
                    >
                      + New Relative
                    </button>
                  }
                </div>

                @if (!isCreatingRelative()) {
                  <select
                    [(ngModel)]="selectedRelativeId"
                    name="relativeSelect"
                    (change)="handleRelativeSelectChange($event)"
                    class="w-full px-3 py-2 bg-white border border-[#dbe5df] rounded-xl text-sm text-[#151d1a] focus:outline-none focus:border-[#466557]"
                    required
                  >
                    <option value="" disabled>-- Select Relative --</option>
                    @for (rel of relativeService.relatives(); track rel.id) {
                      <option [value]="rel.id">
                        {{ rel.firstName }} {{ rel.lastName }} ({{ rel.village }})
                      </option>
                    }
                    <option value="__ADD_NEW__">+ Create New Relative...</option>
                  </select>
                } @else {
                  <!-- Inline Relative Master Creation Card -->
                  <div class="bg-white p-3 rounded-2xl border-2 border-[#adcebe] shadow-xs flex flex-col gap-2">
                    <div class="flex items-center justify-between pb-1 border-b border-[#ecf6f0]">
                      <span class="text-xs font-bold text-[#466557]">Add Relative to Master</span>
                      <button
                        type="button"
                        (click)="isCreatingRelative.set(false)"
                        class="text-xs text-[#727974] hover:text-[#151d1a] cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="text-[10.5px] font-semibold text-[#414844] block mb-0.5">First Name *</label>
                        <input
                          type="text"
                          [(ngModel)]="newRelFirstName"
                          name="relFirstName"
                          placeholder="First Name"
                          class="w-full px-2.5 py-1.5 bg-[#f9fcfa] border border-[#dbe5df] rounded-lg text-xs focus:outline-none focus:border-[#466557]"
                          required
                        />
                      </div>
                      <div>
                        <label class="text-[10.5px] font-semibold text-[#414844] block mb-0.5">Last Name</label>
                        <input
                          type="text"
                          [(ngModel)]="newRelLastName"
                          name="relLastName"
                          placeholder="Last Name"
                          class="w-full px-2.5 py-1.5 bg-[#f9fcfa] border border-[#dbe5df] rounded-lg text-xs focus:outline-none focus:border-[#466557]"
                        />
                      </div>
                    </div>

                    <div>
                      <label class="text-[10.5px] font-semibold text-[#414844] block mb-0.5">Village / Town *</label>
                      <input
                        type="text"
                        [(ngModel)]="newRelVillage"
                        name="relVillage"
                        placeholder="Village / Native Place"
                        class="w-full px-2.5 py-1.5 bg-[#f9fcfa] border border-[#dbe5df] rounded-lg text-xs focus:outline-none focus:border-[#466557]"
                        required
                      />
                    </div>

                    <div class="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        (click)="isCreatingRelative.set(false)"
                        class="flex-1 py-1.5 bg-[#f0f4f2] text-[#414844] text-xs font-medium rounded-lg hover:bg-[#e6f0ea] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        (click)="saveNewRelative()"
                        class="flex-1 py-1.5 bg-[#466557] text-white text-xs font-semibold rounded-lg hover:bg-[#395347] shadow-2xs cursor-pointer"
                      >
                        Save Relative
                      </button>
                    </div>
                  </div>
                }
              </div>

              <!-- 3. Credit / Debit Radio Buttons -->
              <div>
                <label class="text-xs font-semibold text-[#414844] block mb-1">Transaction Type</label>
                <div class="grid grid-cols-2 gap-2">
                  <label
                    class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all"
                    [class]="newGiftType === 'credit'
                      ? 'bg-[#c8ead9] border-[#047857] text-[#012016] shadow-2xs'
                      : 'bg-white border-[#dbe5df] text-[#414844] hover:bg-[#f2fcf5]'"
                  >
                    <input
                      type="radio"
                      name="giftTypeRadio"
                      value="credit"
                      [(ngModel)]="newGiftType"
                      class="accent-[#047857] w-3.5 h-3.5"
                    />
                    <span>Credit (Received)</span>
                  </label>

                  <label
                    class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all"
                    [class]="newGiftType === 'debit'
                      ? 'bg-[#fee2e2] border-[#b91c1c] text-[#7f1d1d] shadow-2xs'
                      : 'bg-white border-[#dbe5df] text-[#414844] hover:bg-[#f2fcf5]'"
                  >
                    <input
                      type="radio"
                      name="giftTypeRadio"
                      value="debit"
                      [(ngModel)]="newGiftType"
                      class="accent-[#b91c1c] w-3.5 h-3.5"
                    />
                    <span>Debit (Given)</span>
                  </label>
                </div>
              </div>

              <!-- 4. Amount -->
              <div>
                <label class="text-xs font-semibold text-[#414844] block mb-1">
                  Amount ({{ currencyService.currencySymbol() }}) *
                </label>
                <div class="relative flex items-center">
                  <span class="absolute left-3.5 text-sm font-semibold text-[#414844]">
                    {{ currencyService.currencySymbol() }}
                  </span>
                  <input
                    type="number"
                    [(ngModel)]="newGiftAmount"
                    name="amount"
                    placeholder="500"
                    min="1"
                    class="w-full pl-8 pr-3.5 py-2.5 bg-white border border-[#dbe5df] rounded-xl text-sm font-semibold text-[#151d1a] focus:outline-none focus:border-[#466557]"
                    required
                  />
                </div>
              </div>

              <!-- 5. Notes Section -->
              <div>
                <label class="text-xs font-semibold text-[#414844] block mb-1">Notes</label>
                <textarea
                  [(ngModel)]="newGiftNotes"
                  name="notes"
                  rows="2"
                  placeholder="e.g. Cash in envelope, 1 sovereign gold coin..."
                  class="w-full px-3.5 py-2 bg-white border border-[#dbe5df] rounded-xl text-sm text-[#151d1a] focus:outline-none focus:border-[#466557] resize-none"
                ></textarea>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  (click)="isAddGiftModalOpen.set(false)"
                  class="flex-1 py-2.5 rounded-xl border border-[#dbe5df] text-[#414844] font-medium text-xs hover:bg-[#e6f0ea] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="flex-1 py-2.5 rounded-xl bg-[#466557] hover:bg-[#3b5549] text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  Save Entry
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
export class GiftsRegistryComponent implements OnInit {
  syncService = inject(SyncService);
  authService = inject(AuthService);
  connectionService = inject(ConnectionService);
  currencyService = inject(CurrencyService);
  relativeService = inject(RelativeService);
  calendarService = inject(CalendarService);
  private http = inject(HttpClient);
  router = inject(Router);

  @ViewChild('regSection') regSection?: RegistrySectionComponent;

  partnerNamesText = computed(() => {
    const me = this.authService.getCurrentUserName() || 'You';
    const partner = this.connectionService.activePartner()?.name || this.syncService.partnerName();
    return partner ? `${me} & ${partner}` : me;
  });

  totalTrackedFormatted = computed(() => {
    if (this.regSection) {
      return '' + this.regSection.totalCredits();
    }
    return '0';
  });

  isSyncModalOpen = signal<boolean>(false);
  isAddGiftModalOpen = signal<boolean>(false);
  activeToast = signal<string | null>(null);

  // Occasions state (strictly real user events & occasions, no default mock data)
  occasionsList = signal<string[]>([]);
  selectedOccasion = '';
  isCreatingOccasion = signal<boolean>(false);
  newOccasionTitle = '';

  // Relatives state
  selectedRelativeId = '';
  isCreatingRelative = signal<boolean>(false);
  newRelFirstName = '';
  newRelLastName = '';
  newRelVillage = '';

  // Gift Entry state
  newGiftType: 'credit' | 'debit' = 'credit';
  newGiftAmount = 0;
  newGiftNotes = '';

  ngOnInit() {
    this.relativeService.loadRelatives();
    this.calendarService.loadEvents().then(events => {
      if (events && events.length > 0) {
        const set = new Set<string>(this.occasionsList());
        events.forEach(e => {
          if (e.title && e.title.trim()) set.add(e.title.trim());
        });
        this.occasionsList.set(Array.from(set));
      }
    });

    // Also fetch occasions from backend if available
    this.http.get<{ success: boolean; occasions: string[] }>(`${environment.apiUrl}/api/calendar/occasions`)
      .subscribe({
        next: (res) => {
          if (res?.occasions && res.occasions.length > 0) {
            const set = new Set<string>([...this.occasionsList(), ...res.occasions]);
            this.occasionsList.set(Array.from(set));
          }
        },
        error: () => {}
      });
  }

  openAddGiftModal() {
    this.isCreatingOccasion.set(false);
    this.isCreatingRelative.set(false);
    this.newOccasionTitle = '';
    this.newRelFirstName = '';
    this.newRelLastName = '';
    this.newRelVillage = '';
    this.newGiftNotes = '';

    // Auto-select first relative if none selected
    const rels = this.relativeService.relatives();
    if (!this.selectedRelativeId && rels.length > 0) {
      this.selectedRelativeId = rels[0].id;
    }

    if (!this.selectedOccasion && this.occasionsList().length > 0) {
      this.selectedOccasion = this.occasionsList()[0];
    }

    this.isAddGiftModalOpen.set(true);
  }

  handleOccasionSelectChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    if (val === '__ADD_NEW__') {
      this.isCreatingOccasion.set(true);
      this.selectedOccasion = '';
    } else {
      this.selectedOccasion = val;
    }
  }

  saveNewOccasion() {
    const clean = this.newOccasionTitle.trim();
    if (!clean) return;

    if (!this.occasionsList().includes(clean)) {
      this.occasionsList.update(list => [clean, ...list]);
    }
    this.selectedOccasion = clean;
    this.newOccasionTitle = '';
    this.isCreatingOccasion.set(false);
    this.showToast(`✓ Occasion "${clean}" added!`);
  }

  handleRelativeSelectChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    if (val === '__ADD_NEW__') {
      this.isCreatingRelative.set(true);
      this.selectedRelativeId = '';
    } else {
      this.selectedRelativeId = val;
    }
  }

  async saveNewRelative() {
    const firstName = this.newRelFirstName.trim();
    const village = this.newRelVillage.trim();
    const lastName = this.newRelLastName.trim();

    if (!firstName) {
      this.showToast('Please enter relative first name');
      return;
    }
    if (!village) {
      this.showToast('Please enter relative village / town');
      return;
    }

    const created = await this.relativeService.createRelative({
      firstName,
      lastName,
      village,
    });

    if (created) {
      this.selectedRelativeId = created.id;
      this.newRelFirstName = '';
      this.newRelLastName = '';
      this.newRelVillage = '';
      this.isCreatingRelative.set(false);
      this.showToast(`✓ Relative "${created.firstName} (${created.village})" saved to Master!`);
    } else {
      this.showToast('Could not save relative. Please try again.');
    }
  }

  handleCreateGift() {
    if (!this.selectedOccasion) {
      this.showToast('Please select or create an occasion');
      return;
    }

    const relative = this.relativeService.relatives().find(r => r.id === this.selectedRelativeId);
    if (!relative) {
      this.showToast('Please select or add a relative');
      return;
    }

    if (!this.newGiftAmount || this.newGiftAmount <= 0) {
      this.showToast('Please enter a valid gift amount');
      return;
    }

    const authorName = this.authService.getCurrentUserName() || 'You';
    const relativeName = `${relative.firstName} ${relative.lastName || ''}`.trim();
    const relativeVillage = relative.village;
    const occasion = this.selectedOccasion;
    const amount = Number(this.newGiftAmount);
    const type = this.newGiftType;
    const notes = this.newGiftNotes.trim();

    this.isAddGiftModalOpen.set(false);
    this.showToast(`✓ Recorded ${type === 'credit' ? 'received' : 'given'} gift from ${relativeName}!`);

    this.http.post<{ success: boolean; item?: RegistryEntry }>(`${environment.apiUrl}/api/calendar/registry`, {
      relativeId: relative.id,
      relativeName,
      relativeVillage,
      recipient: relativeName,
      occasion,
      type,
      amount,
      notes,
      giftType: type === 'debit' ? 'Gift Given' : 'Gift Received',
      creator: authorName,
      creatorRole: 'me',
      status: 'Fulfilled'
    }).subscribe({
      next: (res) => {
        if (res?.item && this.regSection) {
          this.regSection.addEntryLocally(res.item);
        }
      },
      error: () => {
        // Fallback local entry if offline
        const localEntry: RegistryEntry = {
          id: `reg_${Date.now()}`,
          relativeId: relative.id,
          relativeName,
          relativeVillage,
          recipient: relativeName,
          initials: relativeName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
          occasion,
          type,
          amount,
          notes,
          giftType: type === 'debit' ? 'Gift Given' : 'Gift Received',
          date: new Date().toISOString().split('T')[0],
          creator: authorName,
          creatorRole: 'me',
          status: 'Fulfilled'
        };
        if (this.regSection) {
          this.regSection.addEntryLocally(localEntry);
        }
      }
    });

    this.syncService.sendSyncItem(
      'note',
      `${authorName} recorded ${type === 'credit' ? 'received' : 'given'} gift: ${this.currencyService.format(amount)} (${occasion} - ${relativeName})`,
    );

    this.newGiftNotes = '';
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

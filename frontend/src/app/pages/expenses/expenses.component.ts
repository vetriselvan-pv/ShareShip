import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TopBarComponent } from '../../components/top-bar/top-bar.component';
import { SpendSummaryCardComponent } from '../../components/spend-summary-card/spend-summary-card.component';
import { CategoryCardsGridComponent, CategorySummaryItem } from '../../components/category-cards-grid/category-cards-grid.component';
import {
  RecentTransactionsListComponent,
  RecentTransactionItem,
} from '../../components/recent-transactions-list/recent-transactions-list.component';
import {
  EventExpensesListComponent,
  EventExpenseCardItem,
} from '../../components/event-expenses-list/event-expenses-list.component';
import {
  AddExpenseModalComponent,
  NewExpensePayload,
} from '../../components/add-expense-modal/add-expense-modal.component';
import { BottomNavComponent, NavTab } from '../../components/bottom-nav/bottom-nav.component';
import { SyncModalComponent } from '../../components/sync-modal/sync-modal.component';
import { SyncService } from '../../services/sync.service';
import { AuthService } from '../../services/auth.service';
import { CalendarService } from '../../services/calendar.service';
import { ConnectionService } from '../../services/connection.service';
import { CurrencyService } from '../../services/currency.service';

export type ExpenseTabType = 'monthly' | 'events';

@Component({
  selector: 'app-expenses',
  imports: [
    CommonModule,
    TopBarComponent,
    SpendSummaryCardComponent,
    CategoryCardsGridComponent,
    RecentTransactionsListComponent,
    EventExpensesListComponent,
    AddExpenseModalComponent,
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
        (onStatusClick)="isSyncModalOpen.set(true)"
        (onNotificationClick)="router.navigate(['/notifications'])"
      />

      <!-- Main Center Content Container -->
      <div class="w-full max-w-[390px] mx-auto px-4 pt-1 flex flex-col gap-4 flex-1 box-border">
        <!-- 1. Header Section -->
        <section class="flex flex-col text-left mt-1">
          <h1 class="text-[20px] font-semibold text-[#151d1a] tracking-tight leading-tight">
            Our Shared Purse
          </h1>
          <p class="text-[12.5px] text-[#414844] font-normal leading-snug mt-0.5">
            @if (partnerName() !== 'Partner') {
              Balancing life with {{ partnerName() }}, gently &amp; fairly.
            } @else {
              Balancing life together, gently &amp; fairly.
            }
          </p>
        </section>

        <!-- 2. Total Spending & Split Summary Card (Consolidates Monthly + Event Expenses) -->
        <section class="w-full">
          <app-spend-summary-card
            [totalMonth]="totalMonthString()"
            [consolidatedEventAmount]="consolidatedEventAmountString()"
            [youAmount]="youAmountString()"
            [alexAmount]="alexAmountString()"
            [partnerName]="partnerName()"
            [youPercent]="youPercent()"
            [alexPercent]="alexPercent()"
          />
        </section>

        <!-- 3. Tabs Switcher: Monthly Expenses vs Event-Specific -->
        <section class="w-full">
          <div class="flex bg-[#e6f0ea] rounded-xl p-1 shadow-2xs border border-[#dbe5df]/50">
            <button
              type="button"
              (click)="activeSubTab.set('monthly')"
              class="flex-1 py-2 text-center rounded-lg text-[13px] font-semibold transition-all cursor-pointer"
              [class]="
                activeSubTab() === 'monthly'
                  ? 'bg-[#466557] text-[#ffffff] shadow-2xs'
                  : 'text-[#414844] hover:text-[#151d1a] font-medium'
              "
            >
              Monthly Expenses
            </button>
            <button
              type="button"
              (click)="activeSubTab.set('events')"
              class="flex-1 py-2 text-center rounded-lg text-[13px] font-semibold transition-all cursor-pointer"
              [class]="
                activeSubTab() === 'events'
                  ? 'bg-[#466557] text-[#ffffff] shadow-2xs'
                  : 'text-[#414844] hover:text-[#151d1a] font-medium'
              "
            >
              Event-Specific
            </button>
          </div>
        </section>

        <!-- Tab 1: Monthly Expenses View -->
        @if (activeSubTab() === 'monthly') {
          <!-- 4. Category Cards Grid -->
          <section class="w-full">
            <app-category-cards-grid
              [categories]="categories()"
              (onSelectCategory)="handleSelectCategory($event)"
            />
          </section>

          <!-- 5. Recent Transactions List (Includes consolidated events) -->
          <section class="w-full mb-1">
            <app-recent-transactions-list
              [transactions]="transactions()"
              (onViewAll)="handleViewAllTransactions()"
              (onSelectTransaction)="handleSelectTransaction($event)"
            />
          </section>
        }

        <!-- Tab 2: Event-Specific View -->
        @if (activeSubTab() === 'events') {
          <section class="w-full flex flex-col gap-3 mb-1">
            <!-- Informative Consolidation Callout Banner -->
            <div
              class="bg-[#e1eae4] rounded-2xl p-3 border border-[#adcebe]/70 flex items-center justify-between gap-2 shadow-2xs"
            >
              <div class="flex items-center gap-2">
                <span class="text-base">✨</span>
                <div class="flex flex-col text-left">
                  <span class="text-xs font-bold text-[#133126]"
                    >Consolidated with Monthly Purse</span
                  >
                  <span class="text-[11px] text-[#2b4c3e]"
                    >Event expenses automatically roll up into your monthly ledger above.</span
                  >
                </div>
              </div>
              <button
                type="button"
                (click)="openAddExpenseForEvent()"
                class="bg-[#466557] hover:bg-[#395347] active:scale-95 text-white font-medium text-xs px-3 py-1.5 rounded-full shadow-2xs cursor-pointer shrink-0 transition-all"
              >
                + Add
              </button>
            </div>

            <app-event-expenses-list
              [events]="eventExpenses()"
              [currencySymbol]="currencyService.currencySymbol()"
              (onActionClick)="handleEventAction($event)"
            />
          </section>
        }
      </div>

      <!-- Floating Action Button ("Add Expense") -->
      <div class="fixed bottom-24 right-5 sm:right-8 z-40">
        <button
          type="button"
          (click)="openAddExpenseGeneral()"
          class="flex items-center gap-2 bg-[#466557] hover:bg-[#395347] active:scale-95 text-white font-semibold text-xs py-3 px-4.5 rounded-full shadow-lg transition-all cursor-pointer"
        >
          <!-- Add Circle Icon -->
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
          <span>Add Expense</span>
        </button>
      </div>

      <!-- 6. Persistent Bottom Navigation Bar (Expenses Tab Active) -->
      <app-bottom-nav [activeTab]="'expenses'" (tabSelected)="handleTabSwitch($event)" />

      <!-- Add Expense Modal -->
      <app-add-expense-modal
        [isOpen]="isAddExpenseModalOpen()"
        [events]="availableEventOptions()"
        [defaultEventId]="preselectedEventId()"
        [currentUserName]="currentUserName()"
        [currentUserId]="currentUserId()"
        [currentUserAvatar]="currentUserAvatar()"
        [currencySymbol]="currencyService.currencySymbol()"
        (close)="isAddExpenseModalOpen.set(false)"
        (expenseCreated)="handleCreateExpense($event)"
      />

      <!-- Real-Time Sync Modal -->
      <app-sync-modal
        [isOpen]="isSyncModalOpen()"
        [partnerLink]="syncService.partnerLink()"
        [events]="syncService.syncEvents()"
        (close)="isSyncModalOpen.set(false)"
        (triggerPartnerSync)="syncService.simulatePartnerPing('Partner added expense')"
        (triggerMySync)="syncService.sendSyncItem('expense', currentUserName() + ' added expense')"
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
export class ExpensesComponent implements OnInit {
  syncService = inject(SyncService);
  authService = inject(AuthService);
  calendarService = inject(CalendarService);
  connectionService = inject(ConnectionService);
  currencyService = inject(CurrencyService);
  router = inject(Router);
  private http = inject(HttpClient);

  isSyncModalOpen = signal<boolean>(false);
  isAddExpenseModalOpen = signal<boolean>(false);
  activeToast = signal<string | null>(null);

  activeSubTab = signal<ExpenseTabType>('monthly');

  currentUserName = computed(() => this.authService.getCurrentUserName() || 'You');
  currentUserId = computed(() => this.authService.getCurrentUserId());
  currentUserAvatar = computed(() => this.authService.currentUser()?.avatarUrl || '');
  partnerName = computed(
    () =>
      this.connectionService.activePartner()?.name || this.syncService.partnerName() || 'Partner',
  );

  preselectedEventId = signal<string>('');

  // Summary signals (Formatted using dynamic currency from environment)
  totalMonth = signal<number>(0);
  youAmount = signal<number>(0);
  alexAmount = signal<number>(0);
  consolidatedEventAmount = signal<number>(0);
  consolidatedEventAmountString = signal<string>('');

  totalMonthString = signal<string>(this.currencyService.format(0));
  youAmountString = signal<string>(this.currencyService.format(0, { showDecimals: false }));
  alexAmountString = signal<string>(this.currencyService.format(0, { showDecimals: false }));
  youPercent = signal<number>(0);
  alexPercent = signal<number>(0);

  private getDefaultCategories(): CategorySummaryItem[] {
    return [
      { id: 'cat_gift', name: 'Gift', amount: this.currencyService.format(0), subtitle: '0 gifts', icon: 'gift', colorClass: 'bg-[#fed65b] text-[#745c00]' },
      { id: 'cat_utilities', name: 'Utilities', amount: this.currencyService.format(0), subtitle: '0 bills paid', icon: 'bolt', colorClass: 'bg-[#7a9a8b] text-[#133126]' },
      { id: 'cat_food', name: 'Food', amount: this.currencyService.format(0), subtitle: '0 orders', icon: 'coffee', colorClass: 'bg-[#c8ead9] text-[#012016]' },
      { id: 'cat_home', name: 'Home Expenses', amount: this.currencyService.format(0), subtitle: '0 expenses', icon: 'home', colorClass: 'bg-[#e6ddc8] text-[#422e16]' },
      { id: 'cat_travel', name: 'Travel', amount: this.currencyService.format(0), subtitle: '0 bookings', icon: 'flight', colorClass: 'bg-[#ffe088] text-[#241a00]' },
      { id: 'cat_cattle', name: 'Cattle', amount: this.currencyService.format(0), subtitle: '0 records', icon: 'cattle', colorClass: 'bg-[#c5e8d1] text-[#0d3f23]' },
      { id: 'cat_lifestyle', name: 'Lifestyle', amount: this.currencyService.format(0), subtitle: '0 activities', icon: 'lifestyle', colorClass: 'bg-[#e6d7f8] text-[#3e136b]' }
    ];
  }

  // 7 expense categories configured dynamically
  categories = signal<CategorySummaryItem[]>(this.getDefaultCategories());

  // Transactions & events lists (No mock data)
  transactions = signal<RecentTransactionItem[]>([]);
  eventExpenses = signal<EventExpenseCardItem[]>([]);

  availableEventOptions = computed(() => {
    const list: { id: string; title: string }[] = [];
    for (const evt of this.eventExpenses()) {
      if (!list.some((x) => x.id === evt.id)) {
        list.push({ id: evt.id, title: evt.title });
      }
    }
    for (const ce of this.calendarService.events()) {
      if (!list.some((x) => x.id === ce.id || x.title.toLowerCase() === ce.title.toLowerCase())) {
        list.push({ id: ce.id, title: ce.title });
      }
    }
    return list;
  });

  constructor() {
    effect(() => {
      // Whenever currentUser changes or logs in, reload expenses for that user
      const user = this.authService.currentUser();
      this.fetchExpenses();
    });
  }

  ngOnInit() {
    this.fetchExpenses();
  }

  resetSignals() {
    this.totalMonth.set(0);
    this.youAmount.set(0);
    this.alexAmount.set(0);
    this.consolidatedEventAmount.set(0);
    this.consolidatedEventAmountString.set('');
    this.totalMonthString.set(this.currencyService.format(0));
    this.youAmountString.set(this.currencyService.format(0, { showDecimals: false }));
    this.alexAmountString.set(this.currencyService.format(0, { showDecimals: false }));
    this.youPercent.set(0);
    this.alexPercent.set(0);
    this.categories.set(this.getDefaultCategories());
    this.transactions.set([]);
    this.eventExpenses.set([]);
  }

  fetchExpenses() {
    const uid = this.currentUserId();
    if (!uid) {
      this.resetSignals();
      return;
    }

    this.http
      .get<any>(`http://localhost:3001/api/expenses?userId=${encodeURIComponent(uid)}`)
      .subscribe({
        next: (res) => {
          if (res?.currency?.symbol) {
            this.currencyService.setCurrency(res.currency.symbol, res.currency.code);
          }

          if (res?.summary) {
            this.totalMonth.set(res.summary.totalMonth || 0);
            this.youAmount.set(res.summary.you?.amount || 0);
            const partnerAmt = res.summary.partner?.amount ?? 0;
            this.alexAmount.set(partnerAmt);
            this.youPercent.set(res.summary.you?.percentage || 0);
            this.alexPercent.set(res.summary.partner?.percentage || 0);

            this.totalMonthString.set(this.currencyService.format(res.summary.totalMonth || 0));
            this.youAmountString.set(
              this.currencyService.format(res.summary.you?.amount || 0, { showDecimals: false }),
            );
            this.alexAmountString.set(
              this.currencyService.format(partnerAmt, { showDecimals: false }),
            );

            if (res.summary.consolidatedEventAmount > 0) {
              this.consolidatedEventAmount.set(res.summary.consolidatedEventAmount);
              this.consolidatedEventAmountString.set(
                this.currencyService.format(res.summary.consolidatedEventAmount),
              );
            } else {
              this.consolidatedEventAmount.set(0);
              this.consolidatedEventAmountString.set('');
            }
          }
          if (res?.categories?.length) {
            this.categories.set(res.categories.map((cat: any) => ({
              id: cat.id || `cat_${(cat.name || '').toLowerCase().replace(/\s+/g, '_')}`,
              name: cat.name,
              amount: this.currencyService.format(Number(cat.amount || 0)),
              subtitle: cat.countLabel || `${cat.transactionCount || 0} items`,
              icon: cat.icon,
              colorClass: cat.colorClass
            })));
          } else {
            this.categories.set(this.getDefaultCategories());
          }
          if (res?.recentTransactions) {
            this.transactions.set(
              res.recentTransactions.map((tx: any) => ({
                id: tx.id,
                title: tx.title,
                subtitle:
                  tx.expenseType === 'event' && tx.eventTitle
                    ? `Paid by ${tx.paidBy} • ${tx.category} • ${tx.eventTitle}`
                    : `Paid by ${tx.paidBy} • ${tx.category}`,
                amount: this.currencyService.format(Number(tx.amount || 0)),
                splitLabel: tx.splitLabel,
                splitColor: tx.splitType === 'owes_half' ? 'secondary' : 'primary',
                iconType: tx.iconType,
              })),
            );
          } else {
            this.transactions.set([]);
          }
          if (res?.eventExpenses) {
            this.eventExpenses.set(res.eventExpenses);
          } else {
            this.eventExpenses.set([]);
          }
        },
        error: () => {
          this.resetSignals();
        },
      });
  }

  openAddExpenseGeneral() {
    this.preselectedEventId.set('');
    this.isAddExpenseModalOpen.set(true);
  }

  openAddExpenseForEvent() {
    const firstEvt = this.eventExpenses()[0]?.id || '';
    this.preselectedEventId.set(firstEvt);
    this.isAddExpenseModalOpen.set(true);
  }

  handleCreateExpense(payload: NewExpensePayload) {
    this.isAddExpenseModalOpen.set(false);
    this.preselectedEventId.set('');

    const amt = payload.amount;

    // 1. If event specific, update the event's spent amount in the Event-Specific tab
    if (payload.expenseType === 'event') {
      const existingIndex = this.eventExpenses().findIndex(
        (e) =>
          (payload.eventId && e.id === payload.eventId) ||
          (payload.eventTitle && e.title.toLowerCase() === payload.eventTitle.toLowerCase()),
      );

      if (existingIndex !== -1) {
        this.eventExpenses.update((evts) => {
          const updated = [...evts];
          updated[existingIndex] = {
            ...updated[existingIndex],
            spent: updated[existingIndex].spent + amt,
          };
          return updated;
        });
      } else {
        const newEventCard: EventExpenseCardItem = {
          id: payload.eventId || `evt_${Date.now()}`,
          title: payload.eventTitle || payload.title,
          status: 'Active Trip',
          spent: amt,
          budget: Math.max(500, Math.round(amt * 1.5)),
          bgImageUrl:
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
          members: [
            {
              name: this.currentUserName(),
              avatarUrl: '',
            },
          ],
        };
        this.eventExpenses.update((prev) => [newEventCard, ...prev]);
      }

      // Update consolidated event amount signal
      const newConsolidated = this.consolidatedEventAmount() + amt;
      this.consolidatedEventAmount.set(newConsolidated);
      this.consolidatedEventAmountString.set(this.currencyService.format(newConsolidated));
    }

    let txIcon = 'coffee';
    if (payload.category === 'Gift') txIcon = 'gift';
    else if (payload.category === 'Utilities') txIcon = 'bolt';
    else if (payload.category === 'Food') txIcon = 'coffee';
    else if (payload.category === 'Home Expenses') txIcon = 'home';
    else if (payload.category === 'Travel') txIcon = 'flight';
    else if (payload.category === 'Cattle') txIcon = 'cattle';
    else if (payload.category === 'Lifestyle') txIcon = 'lifestyle';

    // 2. Add to Recent Transactions List
    const newTx: RecentTransactionItem = {
      id: `tx_${Date.now()}`,
      title: payload.title,
      subtitle:
        payload.expenseType === 'event' && payload.eventTitle
          ? `Paid by You • ${payload.category} • ${payload.eventTitle}`
          : `Paid by You • ${payload.category}`,
      amount: this.currencyService.format(amt),
      splitLabel: payload.splitLabel,
      splitColor: payload.splitLabel.includes('owes') ? 'secondary' : 'primary',
      iconType: txIcon
    };
    this.transactions.update((prev) => [newTx, ...prev]);

    // 3. Consolidated monthly total: Even though expenses are added to event specific, the consolidated event amount is added to monthly expenses!
    const newTotal = this.totalMonth() + amt;
    const newYou = this.youAmount() + amt;
    const newPartner = this.alexAmount();

    this.totalMonth.set(newTotal);
    this.youAmount.set(newYou);
    this.totalMonthString.set(this.currencyService.format(newTotal));
    this.youAmountString.set(this.currencyService.format(newYou, { showDecimals: false }));
    this.alexAmountString.set(this.currencyService.format(newPartner, { showDecimals: false }));
    const yPct = Math.round((newYou / newTotal) * 100);
    this.youPercent.set(yPct);
    this.alexPercent.set(100 - yPct);

    // Update category totals optimistically
    this.categories.update(items => items.map(cat => {
      if (cat.name.toLowerCase() === (payload.category || '').toLowerCase()) {
        const prevNum = parseFloat(cat.amount.replace(/[^0-9.]/g, '')) || 0;
        const countMatch = cat.subtitle.match(/\d+/);
        const prevCount = countMatch ? parseInt(countMatch[0], 10) : 0;
        const suffix = cat.subtitle.replace(/^\d+\s*/, '') || 'items';
        return {
          ...cat,
          amount: this.currencyService.format(prevNum + amt),
          subtitle: `${prevCount + 1} ${suffix}`
        };
      }
      return cat;
    }));

    // Feedback Toast
    if (payload.expenseType === 'event') {
      this.showToast(
        `✓ Added "${payload.title}" (${this.currencyService.format(amt)}) to ${payload.eventTitle || 'Event'} (consolidated into monthly total)`,
      );
    } else {
      this.showToast(
        `✓ Added monthly expense "${payload.title}" (${this.currencyService.format(amt)})`,
      );
    }

    // Call backend API
    const body = {
      title: payload.title,
      amount: amt,
      category: payload.category,
      paidBy: this.currentUserName() || 'You',
      userId: this.currentUserId(),
      splitType: payload.splitLabel.includes('owes')
        ? 'owes_half'
        : (payload.splitLabel.includes('100%') || payload.splitLabel.includes('Covered'))
          ? 'covered_by_you'
          : 'split_50_50',
      splitLabel: payload.splitLabel,
      expenseType: payload.expenseType,
      eventId: payload.eventId,
      eventTitle: payload.eventTitle,
    };

    this.http.post<any>('http://localhost:3001/api/expenses', body).subscribe({
      next: (res) => {
        if (res?.currency?.symbol) {
          this.currencyService.setCurrency(res.currency.symbol, res.currency.code);
        }
        if (res?.eventExpenses) {
          this.eventExpenses.set(res.eventExpenses);
        }
        this.fetchExpenses();
        this.syncService.sendSyncItem(
          'expense',
          `${this.currentUserName()} added ${payload.title} (${this.currencyService.format(amt)})`,
        );
      },
      error: () => {
        this.showToast('⚠️ Could not save expense to server. Please try again.');
      },
    });
  }

  handleSelectCategory(catName: string) {
    this.showToast(`Filtered transactions by ${catName}`);
  }

  handleViewAllTransactions() {
    this.showToast(`Showing all ${this.transactions().length} ledger items`);
  }

  handleSelectTransaction(tx: RecentTransactionItem) {
    this.showToast(`Details: ${tx.title} • ${tx.amount} (${tx.splitLabel})`);
  }

  handleEventAction(evt: EventExpenseCardItem) {
    this.preselectedEventId.set(evt.id);
    this.isAddExpenseModalOpen.set(true);
    this.showToast(`Adding expense to ${evt.title}`);
  }

  handleTabSwitch(tab: NavTab) {
    if (tab === 'home') {
      this.router.navigate(['/dashboard']);
    } else if (tab === 'calendar') {
      this.router.navigate(['/calendar']);
    } else if (tab === 'expenses') {
      // already on expenses
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

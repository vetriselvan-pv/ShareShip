import { Component, input, output } from '@angular/core';
import { EventExpenseCardItem, RecentTransactionItem } from '../../models/expenses.models';

@Component({
  selector: 'app-event-history-modal',
  template: `
    @if (isOpen() && event()) {
      <div 
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs select-none fade-in"
        (click)="close.emit()"
      >
        <div 
          (click)="$event.stopPropagation()"
          class="w-full max-w-md bg-[#f2fcf5] rounded-t-[28px] sm:rounded-3xl border border-[#dbe5df] shadow-2xl flex flex-col text-left max-h-[90vh] overflow-hidden transition-all"
        >
          <!-- Hero Header Image with Gradient & Event Title -->
          <div 
            class="h-36 sm:h-40 bg-cover bg-center relative p-4 flex flex-col justify-between shrink-0"
            [style.backgroundImage]="'url(' + (event()!.bgImageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80') + ')'"
          >
            <div class="absolute inset-0 bg-gradient-to-t from-[#151d1a]/95 via-[#151d1a]/50 to-[#151d1a]/30"></div>
            
            <!-- Top Bar: Status Badge + Close Button -->
            <div class="relative z-10 flex justify-between items-center">
              <span 
                class="px-3 py-1 rounded-full text-[11px] font-bold shadow-2xs tracking-wide uppercase"
                [class]="event()!.status === 'Active Trip' ? 'bg-[#fed65b] text-[#745c00]' : 'bg-[#7a9a8b] text-[#133126]'"
              >
                {{ event()!.status }}
              </span>

              <button 
                type="button"
                (click)="close.emit()"
                class="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center cursor-pointer transition-colors backdrop-blur-sm"
              >
                ✕
              </button>
            </div>

            <!-- Bottom of Hero: Title & Total Spent Counter -->
            <div class="relative z-10 flex justify-between items-end">
              <div class="min-w-0 pr-2">
                <h3 class="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight drop-shadow-sm truncate">
                  {{ event()!.title }}
                </h3>
                <p class="text-xs text-[#e9f3ed]/80 mt-0.5 font-medium">
                  {{ transactions().length }} {{ transactions().length === 1 ? 'expense' : 'expenses' }} recorded
                </p>
              </div>

              <div class="text-right shrink-0">
                <span class="text-[11px] text-[#e9f3ed]/80 block font-medium">Total Spent</span>
                <span class="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow-sm">
                  {{ currencySymbol() }}{{ event()!.spent.toLocaleString() }}
                </span>
              </div>
            </div>
          </div>

          <!-- Members & Quick Actions Strip -->
          <div class="px-4 py-2.5 bg-[#e6f0ea] border-b border-[#dbe5df] flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-[#414844]">Members:</span>
              <div class="flex -space-x-1.5">
                @for (m of event()!.members; track m.name) {
                  @if (m.avatarUrl) {
                    <img 
                      [src]="m.avatarUrl" 
                      [alt]="m.name" 
                      class="w-6 h-6 rounded-full border-2 border-white object-cover shadow-2xs"
                      [title]="m.name"
                    />
                  } @else {
                    <div 
                      class="w-6 h-6 rounded-full bg-[#466557] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-2xs"
                      [title]="m.name"
                    >
                      {{ (m.name || 'U').charAt(0).toUpperCase() }}
                    </div>
                  }
                }
              </div>
            </div>

            <button
              type="button"
              (click)="addExpense.emit(event()!)"
              class="bg-[#466557] hover:bg-[#395347] active:scale-95 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center gap-1"
            >
              <span>+ Add Expense</span>
            </button>
          </div>

          <!-- Chronological Expense History List -->
          <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 min-h-[180px]">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold uppercase tracking-wider text-[#727974]">
                Event Ledger Breakdown
              </h4>
              <span class="text-xs text-[#414844] font-medium">
                Chronological History
              </span>
            </div>

            @for (tx of transactions(); track tx.id) {
              <div 
                (click)="selectTransaction.emit(tx)"
                class="bg-[#ecf6f0] p-3 rounded-2xl flex items-center justify-between shadow-2xs border border-[#dbe5df]/60 hover:bg-[#e1eae4] transition-all cursor-pointer group"
              >
                <!-- Left: Category Icon + Title/Details -->
                <div class="flex items-center gap-3 min-w-0 pr-2">
                  <!-- Category Icon Badge -->
                  @switch (tx.iconType) {
                    @case ('gift') {
                      <div class="w-9 h-9 rounded-full bg-[#fed65b] text-[#745c00] flex items-center justify-center shrink-0 shadow-2xs">
                        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1h-2V5c0-.55.45-1 1-1zM9 4c.55 0 1 .45 1 1v1H8c-.55 0-1-.45-1-1s.45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76V14h2V8.76L15.38 12 17 10.83 14.92 8H20v6z"/>
                        </svg>
                      </div>
                    }
                    @case ('bolt') {
                      <div class="w-9 h-9 rounded-full bg-[#7a9a8b] text-[#133126] flex items-center justify-center shrink-0 shadow-2xs">
                        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.9 17.55 11 21 11 21z"/>
                        </svg>
                      </div>
                    }
                    @case ('coffee') {
                      <div class="w-9 h-9 rounded-full bg-[#c8ead9] text-[#012016] flex items-center justify-center shrink-0 shadow-2xs">
                        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
                        </svg>
                      </div>
                    }
                    @case ('home') {
                      <div class="w-9 h-9 rounded-full bg-[#e6ddc8] text-[#422e16] flex items-center justify-center shrink-0 shadow-2xs">
                        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                        </svg>
                      </div>
                    }
                    @case ('flight') {
                      <div class="w-9 h-9 rounded-full bg-[#ffe088] text-[#241a00] flex items-center justify-center shrink-0 shadow-2xs">
                        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                        </svg>
                      </div>
                    }
                    @case ('cattle') {
                      <div class="w-9 h-9 rounded-full bg-[#c5e8d1] text-[#0d3f23] flex items-center justify-center shrink-0 shadow-2xs">
                        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M19.5 12c.83 0 1.5-.67 1.5-1.5S20.33 9 19.5 9s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-15 0c.83 0 1.5-.67 1.5-1.5S5.33 9 4.5 9 3 9.67 3 10.5 3.67 12 4.5 12zm14.77-5.59C18.66 5.56 16.9 4 14.5 4h-5c-2.4 0-4.16 1.56-4.77 2.41L3 6v4l1.92.38C5 12.19 6.2 13.9 8 14.67V19h2v-3h4v3h2v-4.33c1.8-.77 3-2.48 3.08-4.29L21 10V6l-1.73.41zM9.5 11c-.83 0-1.5-.67-1.5-1.5S8.67 8 9.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 8 14.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                        </svg>
                      </div>
                    }
                    @case ('lifestyle') {
                      <div class="w-9 h-9 rounded-full bg-[#e6d7f8] text-[#3e136b] flex items-center justify-center shrink-0 shadow-2xs">
                        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </div>
                    }
                    @default {
                      <div class="w-9 h-9 rounded-full bg-[#7a9a8b] text-[#133126] flex items-center justify-center shrink-0 shadow-2xs">
                        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                        </svg>
                      </div>
                    }
                  }

                  <!-- Title & Meta -->
                  <div class="flex flex-col text-left min-w-0">
                    <span class="text-sm font-semibold text-[#151d1a] truncate leading-tight group-hover:text-[#466557] transition-colors">
                      {{ tx.title }}
                    </span>
                    <span class="text-[11.5px] text-[#414844] truncate mt-0.5">
                      {{ tx.paidBy ? 'Paid by ' + tx.paidBy : 'Paid by You' }} • {{ tx.category || 'Event' }}
                      @if (tx.timestamp) {
                        • {{ formatTimestamp(tx.timestamp) }}
                      }
                    </span>
                  </div>
                </div>

                <!-- Right: Amount + Split Badge -->
                <div class="flex flex-col items-end text-right shrink-0">
                  <span class="text-sm font-bold text-[#151d1a] leading-tight">
                    {{ tx.amount }}
                  </span>
                  <span 
                    class="text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 leading-none shadow-2xs"
                    [class]="tx.splitColor === 'secondary' ? 'bg-[#fed65b]/30 text-[#745c00] border border-[#fed65b]/50' : 'bg-[#466557]/15 text-[#133126] border border-[#466557]/30'"
                  >
                    {{ tx.splitLabel }}
                  </span>
                </div>
              </div>
            } @empty {
              <div class="bg-white/60 rounded-2xl p-6 text-center text-xs text-[#414844] border border-dashed border-[#dbe5df] flex flex-col items-center justify-center gap-2 my-auto">
                <span class="text-2xl">🧾</span>
                <span class="font-semibold text-sm text-[#151d1a]">No expenses logged yet</span>
                <span class="text-[#727974] max-w-xs">
                  There are no individual expenses recorded for "{{ event()!.title }}" yet.
                </span>
                <button
                  type="button"
                  (click)="addExpense.emit(event()!)"
                  class="mt-2 bg-[#466557] hover:bg-[#395347] active:scale-95 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  + Add First Expense
                </button>
              </div>
            }
          </div>

          <!-- Bottom Footer Actions -->
          <div class="p-3.5 bg-[#f2fcf5] border-t border-[#dbe5df] flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              (click)="close.emit()"
              class="flex-1 py-2.5 px-4 bg-[#e6f0ea] hover:bg-[#dbe5df] active:scale-95 text-[#414844] rounded-xl text-xs font-semibold transition-all cursor-pointer text-center"
            >
              Close
            </button>
            <button
              type="button"
              (click)="addExpense.emit(event()!)"
              class="flex-1 py-2.5 px-4 bg-[#466557] hover:bg-[#395347] active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer text-center"
            >
              + Add Expense
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class EventHistoryModalComponent {
  isOpen = input<boolean>(false);
  event = input<EventExpenseCardItem | null>(null);
  transactions = input<RecentTransactionItem[]>([]);
  currencySymbol = input<string>('₹');

  close = output<void>();
  addExpense = output<EventExpenseCardItem>();
  selectTransaction = output<RecentTransactionItem>();

  formatTimestamp(isoDate?: string): string {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  }
}

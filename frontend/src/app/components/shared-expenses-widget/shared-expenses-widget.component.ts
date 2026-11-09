import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SharedExpenseTx {
  id: string;
  title: string;
  author: string;
  authorInitial?: string;
  authorRole?: string;
  amount: number;
}

@Component({
  selector: 'app-shared-expenses-widget',
  imports: [CommonModule],
  template: `
    <div class="rounded-2xl bg-[#ecf6f0] border border-[#dbe5df]/80 p-4 shadow-xs">
      <!-- Widget Header -->
      <div class="flex items-center justify-between mb-3.5">
        <div class="flex items-center gap-2.5">
          <!-- Icon Badge -->
          <div class="w-9 h-9 rounded-xl bg-[#fed65b] flex items-center justify-center text-[#745c00] shadow-2xs">
            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-[16px] font-semibold text-[#151d1a] tracking-tight leading-tight">Shared Expenses</h3>
            <span class="text-[12px] text-[#414844] font-normal">This month's ledger</span>
          </div>
        </div>

        <span class="text-[18px] font-bold text-[#735c00] tracking-tight">
          \${{ totalLedger().toFixed(2) }}
        </span>
      </div>

      <!-- Balance Sub-card -->
      <div class="bg-[#e1eae4] rounded-xl p-3 mb-3 flex items-center justify-between border border-[#dbe5df]/60">
        <div class="flex flex-col">
          <span class="text-[11.5px] text-[#414844] font-normal">Your Balance</span>
          <span class="text-[15px] font-bold" [class]="isSettled() || balanceAmount() === 0 ? 'text-[#466557]' : 'text-[#ba1a1a]'">
            {{ isSettled() || balanceAmount() === 0 ? 'All settled up ✓' : 'You owe $' + balanceAmount().toFixed(2) }}
          </span>
        </div>

        @if (!isSettled() && balanceAmount() > 0) {
          <button 
            type="button"
            (click)="handleSettleUp()"
            class="bg-[#466557] hover:bg-[#395347] active:scale-95 text-white font-medium text-[13px] px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Settle Up
          </button>
        }
      </div>

      <!-- Recent Transactions List -->
      <div class="flex flex-col divide-y divide-[#dbe5df]/50">
        @for (tx of transactions(); track tx.id) {
          <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-2.5">
              <div 
                class="w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs shadow-2xs"
                [class]="tx.authorRole === 'partner' ? 'bg-[#fed65b] text-[#745c00]' : 'bg-[#7a9a8b] text-[#133126]'"
              >
                {{ tx.authorInitial || (tx.author || 'U').charAt(0).toUpperCase() }}
              </div>
              <div class="flex flex-col text-left">
                <span class="text-[13.5px] font-medium text-[#151d1a]">{{ tx.title }}</span>
                <span class="text-[11.5px] text-[#414844]">Added by {{ tx.author }}</span>
              </div>
            </div>
            <span class="text-[13.5px] font-semibold text-[#151d1a]">
              \${{ tx.amount.toFixed(2) }}
            </span>
          </div>
        } @empty {
          <div class="py-3 text-center text-xs text-[#727974]">
            No shared transactions recorded this month.
          </div>
        }
      </div>
    </div>
  `
})
export class SharedExpensesWidgetComponent {
  totalLedger = input<number>(0);
  balanceAmount = input<number>(0);
  transactions = input<SharedExpenseTx[]>([]);
  isSettled = signal<boolean>(false);

  onSettleUp = output<void>();

  handleSettleUp() {
    this.isSettled.set(true);
    this.onSettleUp.emit();
  }
}

import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface RecentTransactionItem {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  splitLabel: string;
  splitColor?: 'primary' | 'secondary' | 'neutral';
  iconType: 'coffee' | 'bolt' | 'florist' | 'flight' | 'restaurant' | 'gift' | 'home' | 'cattle' | 'lifestyle' | string;
}

@Component({
  selector: 'app-recent-transactions-list',
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-2.5 select-none">
      <!-- Header: Title + View All -->
      <div class="flex items-center justify-between">
        <h3 class="text-[17px] font-semibold text-[#151d1a] tracking-tight">
          Recent Activity
        </h3>
        @if (transactions().length > 0) {
          <button
            type="button"
            (click)="onViewAll.emit()"
            class="text-[13px] font-medium text-[#466557] hover:text-[#395347] hover:underline cursor-pointer transition-colors"
          >
            View All
          </button>
        }
      </div>

      <!-- Transaction Cards -->
      <div class="flex flex-col gap-2">
        @for (tx of transactions(); track tx.id) {
          <div 
            (click)="onSelectTransaction.emit(tx)"
            class="bg-[#ecf6f0] p-3 sm:p-3.5 rounded-2xl flex items-center justify-between shadow-2xs border border-[#dbe5df]/50 hover:bg-[#e6f0ea] transition-all cursor-pointer group"
          >
            <!-- Left: Icon + Title & Subtitle -->
            <div class="flex items-center gap-3 min-w-0">
              <!-- Icon Badges -->
              @switch (tx.iconType) {
                @case ('gift') {
                  <div class="w-10 h-10 rounded-full bg-[#fed65b] text-[#745c00] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1h-2V5c0-.55.45-1 1-1zM9 4c.55 0 1 .45 1 1v1H8c-.55 0-1-.45-1-1s.45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76V14h2V8.76L15.38 12 17 10.83 14.92 8H20v6z"/>
                    </svg>
                  </div>
                }
                @case ('bolt') {
                  <div class="w-10 h-10 rounded-full bg-[#7a9a8b] text-[#133126] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.9 17.55 11 21 11 21z"/>
                    </svg>
                  </div>
                }
                @case ('coffee') {
                  <div class="w-10 h-10 rounded-full bg-[#c8ead9] text-[#012016] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
                    </svg>
                  </div>
                }
                @case ('home') {
                  <div class="w-10 h-10 rounded-full bg-[#e6ddc8] text-[#422e16] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                    </svg>
                  </div>
                }
                @case ('flight') {
                  <div class="w-10 h-10 rounded-full bg-[#ffe088] text-[#241a00] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                    </svg>
                  </div>
                }
                @case ('cattle') {
                  <div class="w-10 h-10 rounded-full bg-[#c5e8d1] text-[#0d3f23] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M19.5 12c.83 0 1.5-.67 1.5-1.5S20.33 9 19.5 9s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-15 0c.83 0 1.5-.67 1.5-1.5S5.33 9 4.5 9 3 9.67 3 10.5 3.67 12 4.5 12zm14.77-5.59C18.66 5.56 16.9 4 14.5 4h-5c-2.4 0-4.16 1.56-4.77 2.41L3 6v4l1.92.38C5 12.19 6.2 13.9 8 14.67V19h2v-3h4v3h2v-4.33c1.8-.77 3-2.48 3.08-4.29L21 10V6l-1.73.41zM9.5 11c-.83 0-1.5-.67-1.5-1.5S8.67 8 9.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 8 14.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                    </svg>
                  </div>
                }
                @case ('lifestyle') {
                  <div class="w-10 h-10 rounded-full bg-[#e6d7f8] text-[#3e136b] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </div>
                }
                @default {
                  <div class="w-10 h-10 rounded-full bg-[#7a9a8b] text-[#133126] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    </svg>
                  </div>
                }
              }

              <!-- Text Info -->
              <div class="flex flex-col text-left min-w-0">
                <span class="text-[14px] font-semibold text-[#151d1a] truncate leading-snug">
                  {{ tx.title }}
                </span>
                <span class="text-[12.5px] text-[#414844] truncate leading-none mt-0.5">
                  {{ tx.subtitle }}
                </span>
              </div>
            </div>

            <!-- Right: Amount + Split Tag -->
            <div class="flex flex-col text-right shrink-0">
              <span class="text-[14px] font-bold text-[#151d1a] leading-tight">
                {{ tx.amount }}
              </span>
              <span 
                class="text-[12px] font-medium mt-0.5"
                [class]="tx.splitColor === 'secondary' ? 'text-[#735c00]' : 'text-[#466557]'"
              >
                {{ tx.splitLabel }}
              </span>
            </div>
          </div>
        } @empty {
          <div class="bg-[#ecf6f0]/60 rounded-2xl p-6 text-center text-xs text-[#414844] italic border border-dashed border-[#dbe5df] flex flex-col items-center justify-center gap-1.5">
            <span class="text-base">💳</span>
            <span>No expenses recorded yet. Click "+ Add Expense" to begin.</span>
          </div>
        }
      </div>
    </div>
  `
})
export class RecentTransactionsListComponent {
  transactions = input<RecentTransactionItem[]>([]);

  onViewAll = output<void>();
  onSelectTransaction = output<RecentTransactionItem>();
}

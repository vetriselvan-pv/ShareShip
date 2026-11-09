import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TrackerGiftItem {
  id: string;
  title: string;
  status: string;
  context?: string;
  claimedBy: string;
  claimedInitial?: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-gift-tracker-widget',
  imports: [CommonModule],
  template: `
    <div class="rounded-2xl bg-[#ecf6f0] border border-[#dbe5df]/80 p-4 shadow-xs">
      <!-- Widget Header -->
      <div class="flex items-center justify-between mb-3.5">
        <div class="flex items-center gap-2.5">
          <!-- Icon Badge -->
          <div class="w-9 h-9 rounded-xl bg-[#c8ead9] flex items-center justify-center text-[#012016] shadow-2xs">
            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.65-.5-.65C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76V14h2V8.76L15.38 12 17 10.83 14.92 8H20v6z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-[16px] font-semibold text-[#151d1a] tracking-tight leading-tight">Gift Tracker</h3>
            <span class="text-[12px] text-[#414844] font-normal">Wishlist &amp; Celebration Registry</span>
          </div>
        </div>

        @if (gifts().length > 0) {
          <span class="bg-[#fed65b]/40 text-[#745c00] font-semibold text-[11.5px] px-2.5 py-1 rounded-full border border-[#fed65b]/50">
            {{ gifts().length }} Active
          </span>
        }
      </div>

      <!-- Gift Items List -->
      <div class="flex flex-col gap-2.5">
        @for (gift of gifts(); track gift.id) {
          <div class="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-[#dbe5df]/60 shadow-2xs hover:border-[#adcebe] transition-colors">
            @if (gift.imageUrl) {
              <img 
                class="w-13 h-13 rounded-lg object-cover flex-shrink-0 border border-[#dbe5df]" 
                [alt]="gift.title"
                [src]="gift.imageUrl"
              />
            } @else {
              <div class="w-12 h-12 rounded-lg bg-[#c8ead9] flex items-center justify-center text-xl flex-shrink-0">
                🎁
              </div>
            }
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h4 class="text-[13.5px] font-semibold text-[#151d1a] truncate">{{ gift.title }}</h4>
                <span class="text-[11.5px] text-[#735c00] font-semibold">{{ gift.status }}</span>
              </div>
              @if (gift.context) {
                <p class="text-[11.5px] text-[#414844] truncate mt-0.5">{{ gift.context }}</p>
              }
              <div class="flex items-center gap-1.5 mt-1">
                <span class="w-3.5 h-3.5 rounded-full bg-[#7a9a8b] flex items-center justify-center text-[9px] text-[#133126] font-bold">
                  {{ gift.claimedInitial || (gift.claimedBy || 'U').charAt(0).toUpperCase() }}
                </span>
                <span class="text-[11px] text-[#414844]">Claimed by {{ gift.claimedBy }}</span>
              </div>
            </div>
          </div>
        } @empty {
          <div class="p-4 bg-white/70 rounded-xl border border-dashed border-[#dbe5df] text-center text-xs text-[#727974]">
            No claimed gifts yet.
          </div>
        }
      </div>
    </div>
  `
})
export class GiftTrackerWidgetComponent {
  gifts = input<TrackerGiftItem[]>([]);
}

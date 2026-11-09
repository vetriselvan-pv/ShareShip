import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-partner-card',
  imports: [CommonModule],
  template: `
    <div
      class="w-full bg-[#ecf6f0] border border-[#dbe5df]/80 rounded-[22px] px-4 py-3 flex items-center justify-between shadow-[0_2px_8px_rgba(70,101,87,0.04)] hover:border-[#adcebe] transition-all duration-200"
    >
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-[#151d1a] tracking-tight">Connected Friends</span>
        @if (status() === 'connected' && isSyncActive()) {
          <span class="w-2 h-2 rounded-full bg-[#52b788] inline-block shadow-xs live-pulse" title="Live Sync Active"></span>
        }
      </div>

      <!-- Only icons shown -->
      <div class="flex items-center gap-2.5">
        @if (status() === 'connected') {
          <button
            type="button"
            (click)="onBadgeClick.emit()"
            class="relative group cursor-pointer focus:outline-none transition-transform hover:scale-105 active:scale-95"
            [title]="partnerName() + (partnerUserId() ? ' (@' + partnerUserId() + ')' : '')"
          >
            @if (avatarUrl()) {
              <img
                [src]="avatarUrl()"
                [alt]="partnerName() || 'Partner'"
                class="w-10 h-10 rounded-full object-cover border-2 border-[#466557] shadow-xs"
              />
            } @else {
              <div class="w-10 h-10 rounded-full bg-[#adcebe] border-2 border-[#466557] flex items-center justify-center text-[#133126] font-bold text-sm shadow-xs">
                {{ partnerInitial() || 'P' }}
              </div>
            }
            <span class="absolute bottom-0 right-0 w-3 h-3 bg-[#466557] border-2 border-[#ecf6f0] rounded-full"></span>
          </button>
        } @else if (status() === 'pending') {
          <div
            class="relative group cursor-pointer"
            [title]="'Request pending with ' + (partnerName() || partnerUserId())"
          >
            <div class="w-10 h-10 rounded-full bg-[#fdeec3] border-2 border-[#f0deab] flex items-center justify-center text-[#785b00] font-bold text-sm shadow-xs">
              ⏳
            </div>
          </div>
        }

        <!-- Add / Connect Friend button icon -->
        <button
          type="button"
          (click)="onConnectClick.emit()"
          class="w-10 h-10 rounded-full border-2 border-dashed border-[#adcebe] hover:border-[#466557] hover:bg-[#e4f1e9] flex items-center justify-center text-[#466557] transition-all cursor-pointer shadow-2xs group"
          title="Connect Friend"
        >
          <svg class="w-5 h-5 fill-none stroke-current transition-transform group-hover:scale-110" viewBox="0 0 24 24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>
  `
})
export class PartnerCardComponent {
  partnerName = input<string>('');
  partnerUserId = input<string>('');
  partnerInitial = input<string>('');
  avatarUrl = input<string>('');
  status = input<'connected' | 'pending' | 'none'>('none');
  isSyncActive = input<boolean>(false);

  onBadgeClick = output<void>();
  onConnectClick = output<void>();
}


import { Component } from '@angular/core';

@Component({
  selector: 'app-sync-banner',
  template: `
    <div class="bg-[#59786a] text-white p-3.5 rounded-2xl flex items-center justify-between shadow-xs">
      <div class="flex items-center gap-3">
        <!-- Lightbulb circle -->
        <div class="w-9 h-9 rounded-full bg-[#1b3127] text-white flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 0 1 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/>
          </svg>
        </div>
        <div class="flex flex-col text-left">
          <h5 class="text-[14px] font-semibold tracking-tight text-white leading-tight">Gift Sync Active</h5>
          <p class="text-[12px] text-[#adcebe] mt-0.5 leading-snug">Any contribution you log instantly notifies your partner.</p>
        </div>
      </div>
    </div>
  `
})
export class SyncBannerComponent {}

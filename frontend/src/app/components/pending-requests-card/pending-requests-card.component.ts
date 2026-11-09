import { Component, input, output } from '@angular/core';
import { PendingRequestItem } from '../../models/notifications.models';

export type { PendingRequestItem };

@Component({
  selector: 'app-pending-requests-card',
  template: `
    <div class="flex flex-col gap-3 select-none">
      <!-- Section Header: Title + Yellow Count Pill + View All Link -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h2 class="text-[17px] font-semibold text-[#151d1a] tracking-tight">
            Pending Requests
          </h2>
          <span class="bg-[#fed65b] text-[#745c00] text-[11px] font-bold px-2 py-0.5 rounded-full leading-none">
            {{ requests().length }}
          </span>
        </div>

        <button
          type="button"
          (click)="onViewAll.emit()"
          class="text-[13px] font-medium text-[#466557] hover:text-[#395347] hover:underline cursor-pointer transition-colors"
        >
          View All
        </button>
      </div>

      <!-- Requests Cards List -->
      <div class="flex flex-col gap-2.5">
        @for (req of requests(); track req.id) {
          <div class="bg-[#e1eae4] rounded-2xl p-3.5 flex items-center justify-between shadow-2xs border border-[#dbe5df]/50 transition-all duration-300">
            <!-- Left: Avatar & User Info -->
            <div class="flex items-center gap-3 min-w-0">
              @if (req.avatarUrl) {
                <img
                  [src]="req.avatarUrl"
                  [alt]="req.name"
                  class="w-11 h-11 rounded-full object-cover shrink-0 border border-[#f2fcf5]/60 shadow-2xs"
                />
              } @else {
                <div class="w-11 h-11 rounded-full bg-[#7a9a8b] text-[#133126] flex items-center justify-center font-bold text-sm shrink-0 border border-[#f2fcf5]/60 shadow-2xs">
                  {{ req.name.charAt(0).toUpperCase() || 'U' }}
                </div>
              }
              <div class="min-w-0 flex flex-col text-left">
                <span class="text-[14px] font-semibold text-[#151d1a] truncate leading-snug">
                  {{ req.name }}
                </span>
                <span class="text-[12.5px] text-[#414844] truncate leading-none mt-0.5">
                  {{ req.handle }}
                </span>
              </div>
            </div>

            <!-- Right Action Buttons: Accept (Check) & Decline (Cross) -->
            <div class="flex items-center gap-2 shrink-0">
              <!-- Accept Button -->
              <button
                type="button"
                (click)="onAccept.emit(req)"
                class="w-9 h-9 rounded-full bg-[#466557] hover:bg-[#395347] active:scale-90 text-[#ffffff] flex items-center justify-center shadow-2xs transition-all cursor-pointer"
                title="Accept Request"
                aria-label="Accept Request"
              >
                <svg class="w-4 h-4 stroke-current fill-none" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>

              <!-- Decline Button -->
              <button
                type="button"
                (click)="onDecline.emit(req)"
                class="w-9 h-9 rounded-full bg-[#e6f0ea] hover:bg-[#dbe5df] active:scale-90 text-[#414844] hover:text-[#151d1a] flex items-center justify-center transition-all cursor-pointer"
                title="Decline Request"
                aria-label="Decline Request"
              >
                <svg class="w-4 h-4 stroke-current fill-none" viewBox="0 0 24 24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        } @empty {
          <div class="bg-[#e6f0ea]/70 rounded-2xl p-4 text-center text-xs text-[#414844] italic border border-dashed border-[#dbe5df]">
            ✓ All caught up! No pending connection requests.
          </div>
        }
      </div>
    </div>
  `
})
export class PendingRequestsCardComponent {
  requests = input<PendingRequestItem[]>([]);
  onAccept = output<PendingRequestItem>();
  onDecline = output<PendingRequestItem>();
  onViewAll = output<void>();
}

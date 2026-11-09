import { Component, input, output } from '@angular/core';
import { FeedNotificationItem } from '../../models/notifications.models';

export type { FeedNotificationItem };

@Component({
  selector: 'app-notifications-feed',
  template: `
    <div class="flex flex-col gap-3 select-none">
      <!-- Section Header: Title + "Mark all read" Link -->
      <div class="flex items-center justify-between">
        <h2 class="text-[17px] font-semibold text-[#151d1a] tracking-tight">
          Activity &amp; Notifications
        </h2>

        <button
          type="button"
          (click)="onMarkAllRead.emit()"
          class="text-[13px] font-medium text-[#466557] hover:text-[#395347] hover:underline cursor-pointer transition-colors"
        >
          Mark all read
        </button>
      </div>

      <!-- Notifications List -->
      <div class="flex flex-col gap-2.5">
        @for (item of notifications(); track item.id) {
          <div 
            class="bg-[#e6f0ea] rounded-2xl p-3.5 sm:p-4 flex items-start gap-3.5 shadow-2xs border border-[#dbe5df]/50 transition-all hover:bg-[#e1eae4]/90 cursor-pointer"
            [class.opacity-80]="item.isRead"
          >
            <!-- Circular Icon Badge with specific palette token -->
            @switch (item.iconType) {
              <!-- 1. Gift Sync: Yellow heart badge -->
              @case ('heart') {
                <div class="w-10 h-10 rounded-full bg-[#fed65b] text-[#745c00] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
              }
              <!-- 2. Event Reminder: Green calendar badge -->
              @case ('calendar') {
                <div class="w-10 h-10 rounded-full bg-[#7a9a8b] text-[#133126] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/>
                  </svg>
                </div>
              }
              <!-- 3. Expense Settled: Surface container high badge -->
              @case ('payments') {
                <div class="w-10 h-10 rounded-full bg-[#e1eae4] text-[#151d1a] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border border-[#dbe5df]/60">
                  <svg class="w-5 h-5 stroke-current fill-none" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="20" height="14" x="2" y="5" rx="2"/>
                    <circle cx="12" cy="12" r="2.5"/>
                    <path d="M6 12h.01M18 12h.01"/>
                  </svg>
                </div>
              }
              <!-- 4. Subscription Renewed: Tertiary fixed badge -->
              @case ('subscription') {
                <div class="w-10 h-10 rounded-full bg-[#e5e2dd] text-[#1c1c19] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border border-[#dbe5df]/60">
                  <svg class="w-5 h-5 stroke-current fill-none" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2"/>
                    <path d="M3 9h18M9 21V9"/>
                  </svg>
                </div>
              }
            }

            <!-- Notification Content -->
            <div class="flex-1 min-w-0 flex flex-col gap-0.5 text-left">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[14px] font-semibold text-[#151d1a] truncate leading-tight">
                  {{ item.title }}
                </span>
                <span class="text-[12px] text-[#727974] shrink-0 font-normal">
                  {{ item.timeAgo }}
                </span>
              </div>
              <p class="text-[13px] text-[#414844] font-normal leading-relaxed mt-0.5">
                {{ item.description }}
              </p>
            </div>
          </div>
        } @empty {
          <div class="bg-[#e6f0ea]/70 rounded-2xl p-4 text-center text-xs text-[#414844] italic border border-dashed border-[#dbe5df]">
            No recent activity notifications.
          </div>
        }
      </div>
    </div>
  `
})
export class NotificationsFeedComponent {
  notifications = input<FeedNotificationItem[]>([]);
  onMarkAllRead = output<void>();
}

import { Component, input } from '@angular/core';

@Component({
  selector: 'app-calendar-stats-card',
  template: `
    <div
      class="bg-[#ecf6f0] border border-[#dbe5df]/80 p-4 rounded-2xl flex items-center justify-between shadow-2xs"
    >
      <!-- Left side: Avatars & partner status -->
      <div class="flex items-center gap-3">
        @if (avatar1() || avatar2() || partnerNames()) {
          <div class="flex -space-x-2.5 flex-shrink-0">
            @if (avatar1()) {
              <img
                class="w-9 h-9 rounded-full object-cover border-2 border-[#f2fcf5]"
                alt="Partner 1"
                [src]="avatar1()"
              />
            } @else {
              <div
                class="w-9 h-9 rounded-full bg-[#466557] text-white flex items-center justify-center font-bold text-xs border-2 border-[#f2fcf5]"
              >
                {{
                  (partnerNames()
                    ? partnerNames().split('&')[0].trim().charAt(0)
                    : 'Y'
                  ).toUpperCase()
                }}
              </div>
            }
            @if (avatar2()) {
              <img
                class="w-9 h-9 rounded-full object-cover border-2 border-[#f2fcf5]"
                alt="Partner 2"
                [src]="avatar2()"
              />
            } @else if (partnerNames().includes('&')) {
              <div
                class="w-9 h-9 rounded-full bg-[#7a9a8b] text-[#133126] flex items-center justify-center font-bold text-xs border-2 border-[#f2fcf5]"
              >
                {{ partnerNames().split('&')[1].trim().charAt(0).toUpperCase() }}
              </div>
            }
          </div>
        }
        <div class="flex flex-col text-left">
          <div class="flex items-center gap-1.5">
            <span class="text-[14px] font-semibold text-[#151d1a] tracking-tight">{{
              partnerNames()
            }}</span>
            @if (partnerNames()) {
              <span
                class="bg-[#c8ead9] text-[#012016] text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                >Linked</span
              >
            }
          </div>
          @if (eventsTrackedText()) {
            <p class="text-[11.5px] text-[#414844] mt-0.5 font-normal">{{ eventsTrackedText() }}</p>
          }
        </div>
      </div>

      <!-- Right side: Total Gift Budget -->
      @if (totalBudget()) {
        <div class="text-right flex flex-col items-end">
          <span class="text-[17px] font-bold text-[#735c00] tracking-tight"
            >\${{ totalBudget() }}</span
          >
          <p class="text-[11.5px] text-[#414844] font-normal">Total Gift Budget</p>
        </div>
      }
    </div>
  `,
})
export class CalendarStatsCardComponent {
  readonly partnerNames = input<string>('');
  readonly eventsTrackedText = input<string>('');
  readonly totalBudget = input<string>('');
  readonly avatar1 = input<string | undefined>('');
  readonly avatar2 = input<string | undefined>('');
}

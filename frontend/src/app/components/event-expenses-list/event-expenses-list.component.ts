import { Component, input, output } from '@angular/core';
import { EventExpenseCardItem } from '../../models/expenses.models';

export type { EventExpenseCardItem };

@Component({
  selector: 'app-event-expenses-list',
  template: `
    <div class="flex flex-col gap-3.5 select-none">
      @for (evt of events(); track evt.id) {
        <div 
          (click)="onEventSelect.emit(evt)"
          class="bg-[#ecf6f0] rounded-2xl overflow-hidden shadow-2xs border border-[#dbe5df]/60 flex flex-col transition-all hover:shadow-md hover:border-[#466557]/40 cursor-pointer group"
        >
          <!-- Hero Header Image with Gradient & Title -->
          <div 
            class="h-32 bg-cover bg-center relative p-3.5 sm:p-4 flex flex-col justify-end"
            [style.backgroundImage]="'url(' + (evt.bgImageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80') + ')'"
          >
            <div class="absolute inset-0 bg-gradient-to-t from-[#151d1a]/85 via-[#151d1a]/25 to-transparent"></div>
            <div class="relative z-10 flex justify-between items-end">
              <div>
                <span 
                  class="px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-2xs"
                  [class]="evt.status === 'Active Trip' ? 'bg-[#fed65b] text-[#745c00]' : 'bg-[#7a9a8b] text-[#133126]'"
                >
                  {{ evt.status }}
                </span>
                <h4 class="text-[17px] font-bold text-[#ffffff] tracking-tight leading-tight mt-1.5 drop-shadow-xs group-hover:text-[#fed65b] transition-colors">
                  {{ evt.title }}
                </h4>
              </div>
              <div class="text-right">
                <span class="text-[11.5px] text-[#e9f3ed]/80 block font-medium">Spent</span>
                <div class="text-[18px] font-bold text-[#ffffff] tracking-tight leading-none drop-shadow-xs">
                  {{ currencySymbol() }}{{ evt.spent.toLocaleString() }}
                </div>
              </div>
            </div>
          </div>

          <!-- Body Info: Member Avatars, History Hint & Action Button (No Budget) -->
          <div class="p-3.5 sm:p-4 flex justify-between items-center">
            <div class="flex items-center gap-2">
              <div class="flex -space-x-2">
                @for (m of evt.members; track m.name) {
                  @if (m.avatarUrl) {
                    <img 
                      [src]="m.avatarUrl" 
                      [alt]="m.name" 
                      class="w-7 h-7 rounded-full border-2 border-[#ecf6f0] object-cover shadow-2xs"
                    />
                  } @else {
                    <div class="w-7 h-7 rounded-full bg-[#466557] text-white text-[11px] font-bold flex items-center justify-center border-2 border-[#ecf6f0] shadow-2xs">
                      {{ (m.name || 'U').charAt(0).toUpperCase() }}
                    </div>
                  }
                }
              </div>

              <span class="text-[12px] text-[#466557] font-semibold flex items-center gap-1 group-hover:underline">
                <span>View History</span>
                <svg class="w-3.5 h-3.5 text-[#466557] group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>

            <button
              type="button"
              (click)="$event.stopPropagation(); onActionClick.emit(evt)"
              class="bg-[#e6f0ea] hover:bg-[#dbe5df] active:scale-95 text-[#151d1a] px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              + Add Expense
            </button>
          </div>
        </div>
      } @empty {
        <div class="bg-[#ecf6f0]/60 rounded-2xl p-4 text-center text-xs text-[#414844] italic border border-dashed border-[#dbe5df] flex flex-col items-center justify-center gap-1.5">
          <span class="text-base">🎉</span>
          <span>No event-specific expenses yet. Click "+ Add" to create an event expense.</span>
        </div>
      }
    </div>
  `
})
export class EventExpensesListComponent {
  events = input<EventExpenseCardItem[]>([]);
  currencySymbol = input<string>('₹');
  onActionClick = output<EventExpenseCardItem>();
  onEventSelect = output<EventExpenseCardItem>();
}

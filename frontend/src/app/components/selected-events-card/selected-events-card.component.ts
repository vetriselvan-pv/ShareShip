import { Component, inject, input, output } from '@angular/core';
import { CalendarService } from '../../services/calendar.service';
import { CalendarEvent } from '../../models/calendar.models';

@Component({
  selector: 'app-selected-events-card',
  template: `
    <div class="bg-white border border-[#dbe5df]/80 p-4 rounded-2xl shadow-xs">
      <!-- Section Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <!-- Calendar available icon -->
          <svg class="w-4 h-4 text-[#735c00] stroke-current fill-none" viewBox="0 0 24 24" stroke-width="2">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
            <line x1="16" x2="16" y1="2" y2="6"/>
            <line x1="8" x2="8" y1="2" y2="6"/>
            <line x1="3" x2="21" y1="10" y2="10"/>
            <path d="m9 16 2 2 4-4"/>
          </svg>
          <h4 class="text-[16px] font-semibold text-[#151d1a] tracking-tight truncate max-w-[200px] sm:max-w-[250px]">
            {{ sectionTitle() }}
          </h4>
        </div>
        @if (events().length > 0) {
          <span class="bg-[#fed65b] text-[#745c00] text-[11px] px-2.5 py-0.5 rounded-full font-semibold">
            {{ events().length }} Event{{ events().length > 1 ? 's' : '' }}
          </span>
        }
      </div>

      <!-- Events List -->
      <div class="flex flex-col gap-2.5">
        @if (events().length === 0) {
          <div class="py-6 px-4 bg-[#ecf6f0]/50 rounded-xl border border-dashed border-[#adcebe] flex flex-col items-center justify-center text-center gap-2">
            <span class="text-2xl">📅</span>
            <p class="text-[13px] font-medium text-[#151d1a]">No events scheduled for this day</p>
            <p class="text-[11.5px] text-[#55605b]">Tap below to add an event or celebration</p>
            <button
              type="button"
              (click)="onAddEvent.emit()"
              class="mt-1 px-3 py-1.5 bg-[#466557] hover:bg-[#395347] active:scale-95 text-white font-medium text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
            >
              <span class="text-sm font-bold leading-none">+</span>
              <span>Add Event</span>
            </button>
          </div>
        } @else {
          @for (event of events(); track event.id) {
            <div class="bg-[#ecf6f0] p-3 rounded-xl border border-[#dbe5df]/60 flex items-start justify-between shadow-2xs hover:border-[#adcebe] transition-colors">
              <div class="flex gap-3">
                <!-- Icon box -->
                <div 
                  class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs"
                  [class]="event.category?.toLowerCase() === 'incident' 
                    ? 'bg-[#fcdad7] text-[#901309]' 
                    : (event.category?.toLowerCase() === 'task' 
                      ? 'bg-[#d8eaf9] text-[#104374]' 
                      : (event.category?.toLowerCase() === 'celebration' 
                        ? 'bg-[#fed65b] text-[#745c00]' 
                        : 'bg-[#7a9a8b] text-[#133126]'))"
                >
                  <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    @if (event.category?.toLowerCase() === 'incident') {
                      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                    } @else if (event.category?.toLowerCase() === 'task') {
                      <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    } @else if (event.category?.toLowerCase() === 'celebration' || event.category === 'wedding' || event.category === 'birthday') {
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    } @else {
                      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                    }
                  </svg>
                </div>

                <!-- Content -->
                <div class="flex flex-col text-left">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <h5 class="text-[14px] font-semibold text-[#151d1a] leading-tight">{{ event.title }}</h5>
                    @if (event.gift) {
                      <span class="bg-[#fed65b] text-[#745c00] text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1">
                        <svg class="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                          <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.65-.5-.65C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.1 0 2-.89 2-2V8c0-1.1-.89-2-2-2z"/>
                        </svg>
                        <span class="max-w-[120px] truncate">{{ event.gift }}</span>
                      </span>
                    }
                  </div>
                  <p class="text-[12px] text-[#414844] mt-0.5 font-normal">
                    @if (event.location) {
                      {{ event.location }} • 
                    }
                    {{ event.time || '12:00 PM' }}
                  </p>
                  
                  <!-- Creator Info -->
                  <div class="flex items-center gap-1.5 mt-1.5">
                    <div class="w-4 h-4 rounded-full bg-[#adcebe] text-[#133126] font-bold text-[9px] flex items-center justify-center border border-[#dbe5df]">
                      {{ getCreatorInitial(event) }}
                    </div>
                    <span class="text-[11px] text-[#414844]">{{ getCreatorDisplay(event) }}</span>
                  </div>
                </div>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `
})
export class SelectedEventsCardComponent {
  calendarService = inject(CalendarService);

  readonly sectionTitle = input<string>('Selected Events');
  readonly events = input<CalendarEvent[]>([]);
  readonly onAddEvent = output<void>();

  isCreatedByMe(event: CalendarEvent): boolean {
    if (!event) return false;
    const myId = this.calendarService.getCurrentUserId().toLowerCase();
    if (event.userId && event.userId.toLowerCase() === myId) return true;
    if (event.creatorRole === 'me') return true;
    const myName = this.calendarService.getCurrentUserName().toLowerCase();
    if (event.creator && event.creator.toLowerCase() === myName) return true;
    return false;
  }

  getCreatorDisplay(event: CalendarEvent): string {
    if (this.isCreatedByMe(event)) {
      return 'Added by you';
    }
    return `Added by ${event.creator || 'Partner'}`;
  }

  getCreatorInitial(event: CalendarEvent): string {
    if (this.isCreatedByMe(event)) {
      const myName = this.calendarService.getCurrentUserName() || 'Y';
      return myName.charAt(0).toUpperCase();
    }
    return (event.creator || 'P').charAt(0).toUpperCase();
  }
}

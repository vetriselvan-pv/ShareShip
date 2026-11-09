import { Component, ElementRef, ViewChild, computed, inject, input, output, signal } from '@angular/core';
import { CalendarEvent, CalendarService } from '../../services/calendar.service';

@Component({
  selector: 'app-event-hero-card',
  template: `
    @if (events().length === 0) {
      <!-- Empty State Card (Exact Same Aesthetic) -->
      <div class="relative overflow-hidden rounded-2xl bg-[#466557] text-[#ffffff] p-5 shadow-md transition-all">
        <!-- Ambient decorative glow -->
        <div class="absolute -right-10 -bottom-10 w-36 h-36 bg-[#7a9a8b]/30 rounded-full blur-2xl pointer-events-none"></div>

        <!-- Top Row Badge -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-1.5 bg-[#7a9a8b] px-3 py-1 rounded-full text-[#133126] font-medium text-xs">
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
            </svg>
            <span>Upcoming Events</span>
          </div>

          <span class="text-xs text-[#adcebe] font-medium">Next 30 Days</span>
        </div>

        <!-- Empty Title & Message -->
        <h2 class="text-[19px] font-semibold text-white tracking-tight mb-1">
          No Upcoming Events
        </h2>
        <p class="text-[13px] text-[#adcebe] leading-relaxed mb-4">
          No shared celebrations scheduled for the next month. Add an event to countdown together!
        </p>

        <!-- Card Footer with + Add Event Action Button -->
        <div class="flex items-center justify-between pt-3 border-t border-[#7a9a8b]/40">
          <span class="text-[12.5px] text-[#adcebe] font-normal">Shared Space Ready</span>
          <button 
            type="button"
            (click)="onAddEvent.emit()"
            class="bg-[#f2fcf5] text-[#151d1a] font-medium text-[13px] px-3.5 py-1.5 rounded-xl shadow-xs hover:bg-white active:scale-95 transition-all cursor-pointer flex items-center gap-1"
          >
            <span class="font-bold text-base leading-none">+</span>
            <span>Add Event</span>
          </button>
        </div>
      </div>
    } @else {
      <!-- Carousel Container with Native Swipe & Controls -->
      <div class="relative w-full">
        <div
          #carousel
          (scroll)="onScroll($event)"
          class="w-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar touch-pan-x gap-0 rounded-2xl"
        >
          @for (event of events(); track event.id; let idx = $index) {
            <div class="w-full flex-shrink-0 snap-center">
              <div class="relative overflow-hidden rounded-2xl bg-[#466557] text-[#ffffff] p-5 shadow-md transition-all">
                <!-- Ambient decorative glow -->
                <div class="absolute -right-10 -bottom-10 w-36 h-36 bg-[#7a9a8b]/30 rounded-full blur-2xl pointer-events-none"></div>

                <!-- Top Row Badges -->
                <div class="flex items-center justify-between mb-3">
                  <!-- Category Pill -->
                  <div class="flex items-center gap-1.5 bg-[#7a9a8b] px-3 py-1 rounded-full text-[#133126] font-medium text-xs">
                    <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      @if (event.category?.toLowerCase() === 'celebration' || event.category === 'wedding' || event.category === 'birthday') {
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      } @else if (event.category?.toLowerCase() === 'incident') {
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                      } @else if (event.category?.toLowerCase() === 'task') {
                        <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      } @else {
                        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                      }
                    </svg>
                    <span>{{ formatCategory(event.category || 'Event') }}</span>
                  </div>

                  <!-- Right: Days Remaining Pill & Carousel Controls -->
                  <div class="flex items-center gap-1.5">
                    <div class="flex items-center gap-1 bg-[#fed65b]/25 border border-[#fed65b]/40 px-3 py-1 rounded-full text-[#ffe088] font-medium text-xs">
                      <svg class="w-3.5 h-3.5 stroke-current fill-none" viewBox="0 0 24 24" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span>{{ calendarService.getDaysRemainingText(event.date) }}</span>
                    </div>

                    @if (events().length > 1) {
                      <!-- Swipe Chevrons -->
                      <div class="flex items-center gap-0.5 bg-black/20 rounded-full px-1 py-0.5 ml-1">
                        <button
                          type="button"
                          (click)="goToPrev()"
                          [disabled]="currentIndex() === 0"
                          class="w-5 h-5 rounded-full flex items-center justify-center text-white/90 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          aria-label="Previous event"
                        >
                          ‹
                        </button>
                        <span class="text-[10px] text-[#adcebe] font-bold px-0.5">{{ currentIndex() + 1 }}/{{ events().length }}</span>
                        <button
                          type="button"
                          (click)="goToNext()"
                          [disabled]="currentIndex() === events().length - 1"
                          class="w-5 h-5 rounded-full flex items-center justify-center text-white/90 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          aria-label="Next event"
                        >
                          ›
                        </button>
                      </div>
                    }
                  </div>
                </div>

                <!-- Event Title & Details -->
                <h2 class="text-[20px] font-semibold text-white tracking-tight mb-1 truncate">
                  {{ event.title }}
                </h2>
                <p class="text-[13px] text-[#adcebe] leading-relaxed mb-4">
                  {{ calendarService.formatDisplayDate(event.date, event.time) }}
                  @if (event.location) {
                    • {{ event.location }}
                  }
                </p>

                <!-- Card Footer: Contributor / Gift Info & View Itinerary Button -->
                <div class="flex items-center justify-between pt-3 border-t border-[#7a9a8b]/40">
                  <!-- Contributor / Gift Info -->
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-[#adcebe] border-2 border-[#466557] flex items-center justify-center text-[#133126] font-bold text-xs shadow-2xs">
                      {{ getCreatorInitial(event) }}
                    </div>
                    <span class="text-[12.5px] text-[#adcebe] font-normal truncate max-w-[170px] sm:max-w-[220px]" [title]="getCreatorDisplay(event)">
                      {{ getCreatorDisplay(event) }}
                    </span>
                  </div>

                  <!-- Action Button -->
                  <button 
                    type="button"
                    (click)="onViewItinerary.emit(event)"
                    class="bg-[#f2fcf5] text-[#151d1a] font-medium text-[13px] px-3.5 py-1.5 rounded-xl shadow-xs hover:bg-white active:scale-95 transition-all cursor-pointer flex-shrink-0"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          }
        </div>

        @if (events().length > 1) {
          <!-- Carousel Dots Indicator (Swipe left & right to navigate) -->
          <div class="flex items-center justify-center gap-1.5 mt-2">
            @for (event of events(); track event.id; let dotIdx = $index) {
              <button
                type="button"
                (click)="scrollTo(dotIdx)"
                class="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
                [class]="currentIndex() === dotIdx ? 'w-5 bg-[#466557]' : 'w-1.5 bg-[#adcebe] hover:bg-[#7a9a8b]'"
                [attr.aria-label]="'Go to event ' + (dotIdx + 1)"
              ></button>
            }
          </div>
        }
      </div>
    }
  `
})
export class EventHeroCardComponent {
  calendarService = inject(CalendarService);

  readonly events = input<CalendarEvent[]>([]);
  readonly onViewItinerary = output<CalendarEvent>();
  readonly onAddEvent = output<void>();

  @ViewChild('carousel') carouselRef?: ElementRef<HTMLDivElement>;
  readonly currentIndex = signal<number>(0);

  formatCategory(category: string): string {
    if (!category) return 'Event';
    const lower = category.toLowerCase();
    if (lower === 'celebration') return 'Celebration';
    if (lower === 'incident') return 'Incident';
    if (lower === 'task') return 'Task';
    if (lower === 'event') return 'Event';
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  isCreatedByMe(event: CalendarEvent): boolean {
    const myId = this.calendarService.getCurrentUserId().toLowerCase();
    if (event.userId && event.userId.toLowerCase() === myId) return true;
    if (event.creatorRole === 'me') return true;
    const myName = this.calendarService.getCurrentUserName().toLowerCase();
    if (event.creator && event.creator.toLowerCase() === myName) return true;
    return false;
  }

  getCreatorDisplay(event: CalendarEvent): string {
    const isMe = this.isCreatedByMe(event);
    if (isMe) {
      return event.gift ? `Gift: ${event.gift} • Added by you` : 'Added by you';
    }
    const name = event.creator || 'Partner';
    return event.gift ? `Gift: ${event.gift} • Added by ${name}` : `Added by ${name}`;
  }

  getCreatorInitial(event: CalendarEvent): string {
    if (this.isCreatedByMe(event)) {
      const myName = this.calendarService.getCurrentUserName() || 'Y';
      return myName.charAt(0).toUpperCase();
    }
    return (event.creator || 'P').charAt(0).toUpperCase();
  }

  onScroll(e: Event) {
    const el = e.target as HTMLElement;
    if (el && el.offsetWidth > 0) {
      const idx = Math.round(el.scrollLeft / el.offsetWidth);
      if (idx !== this.currentIndex() && idx >= 0 && idx < this.events().length) {
        this.currentIndex.set(idx);
      }
    }
  }

  goToNext() {
    const next = Math.min(this.currentIndex() + 1, this.events().length - 1);
    this.scrollTo(next);
  }

  goToPrev() {
    const prev = Math.max(this.currentIndex() - 1, 0);
    this.scrollTo(prev);
  }

  scrollTo(index: number) {
    this.currentIndex.set(index);
    if (this.carouselRef?.nativeElement) {
      const width = this.carouselRef.nativeElement.offsetWidth;
      this.carouselRef.nativeElement.scrollTo({
        left: index * width,
        behavior: 'smooth'
      });
    }
  }
}

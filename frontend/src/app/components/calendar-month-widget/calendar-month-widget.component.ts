import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calendar-month-widget',
  imports: [CommonModule],
  template: `
    <div class="bg-white border border-[#dbe5df]/80 p-4 rounded-2xl shadow-xs">
      <!-- Month Header -->
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-[16px] font-semibold text-[#151d1a] flex items-center gap-2">
          <!-- Calendar Icon -->
          <svg class="w-4 h-4 text-[#466557] stroke-current fill-none" viewBox="0 0 24 24" stroke-width="2">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
            <line x1="16" x2="16" y1="2" y2="6"/>
            <line x1="8" x2="8" y1="2" y2="6"/>
            <line x1="3" x2="21" y1="10" y2="10"/>
          </svg>
          <span>{{ currentMonth() }} {{ currentYear() }}</span>
        </h3>

        <!-- Navigation Chevrons -->
        <div class="flex items-center gap-1">
          <button 
            id="btn-calendar-prev-month"
            type="button"
            (click)="prevMonth()"
            class="w-7 h-7 rounded-full bg-[#ecf6f0] hover:bg-[#dbe5df] active:scale-90 flex items-center justify-center text-[#151d1a] transition-all cursor-pointer"
            aria-label="Previous month"
          >
            <svg class="w-3.5 h-3.5 stroke-current fill-none pointer-events-none" viewBox="0 0 24 24" stroke-width="2.5">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <button 
            id="btn-calendar-next-month"
            type="button"
            (click)="nextMonth()"
            class="w-7 h-7 rounded-full bg-[#ecf6f0] hover:bg-[#dbe5df] active:scale-90 flex items-center justify-center text-[#151d1a] transition-all cursor-pointer"
            aria-label="Next month"
          >
            <svg class="w-3.5 h-3.5 stroke-current fill-none pointer-events-none" viewBox="0 0 24 24" stroke-width="2.5">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Weekday Labels: M, T, W, T, F, S, S -->
      <div class="grid grid-cols-7 gap-1 text-center mb-1 select-none">
        @for (day of weekdays; track day) {
          <span class="text-[12px] font-medium text-[#727974] py-1">{{ day }}</span>
        }
      </div>

      <!-- Calendar Days Grid -->
      <div class="grid grid-cols-7 gap-1 text-center select-none">
        <!-- Faded days from previous month -->
        @for (day of prevMonthDays(); track $index) {
          <div class="aspect-square flex flex-col items-center justify-center rounded-xl text-[#727974]/35 text-[13px] select-none">
            {{ day }}
          </div>
        }

        <!-- Active Month Days -->
        @for (day of daysInMonth(); track day) {
          <button 
            type="button"
            (click)="selectDay(day)"
            class="aspect-square flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer relative"
            [class]="selectedDay() === day 
              ? 'bg-[#466557] text-white shadow-xs font-bold' 
              : 'bg-[#ecf6f0]/70 hover:bg-[#ecf6f0] text-[#151d1a] font-normal'"
          >
            <span class="text-[13px]">{{ day }}</span>

            <!-- Event Indicator Dots -->
            @if (hasGoldDot(day)) {
              <span 
                class="w-1.5 h-1.5 rounded-full absolute bottom-1"
                [class]="selectedDay() === day ? 'bg-[#fed65b]' : 'bg-[#735c00]'"
              ></span>
            } @else if (hasGreenDot(day)) {
              <span 
                class="w-1.5 h-1.5 rounded-full bg-[#466557] absolute bottom-1"
              ></span>
            }
          </button>
        }

        <!-- Faded days from next month -->
        @for (day of nextMonthDays(); track $index) {
          <div class="aspect-square flex flex-col items-center justify-center rounded-xl text-[#727974]/30 text-[13px] select-none">
            {{ day }}
          </div>
        }
      </div>
    </div>
  `
})
export class CalendarMonthWidgetComponent {
  private readonly monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  readonly activeYear = signal<number>(new Date().getFullYear());
  readonly activeMonth = signal<number>(new Date().getMonth());
  readonly selectedDay = signal<number | null>(null);

  readonly currentMonth = computed(() => this.monthNames[this.activeMonth()]);
  readonly currentYear = computed(() => this.activeYear());

  readonly weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  readonly daysInMonth = computed(() => {
    const totalDays = new Date(this.activeYear(), this.activeMonth() + 1, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => i + 1);
  });

  readonly prevMonthDays = computed(() => {
    // Convert JS getDay() (Sunday=0) to Monday=0: (day + 6) % 7
    const firstDayIndex = (new Date(this.activeYear(), this.activeMonth(), 1).getDay() + 6) % 7;
    if (firstDayIndex === 0) return [];
    const prevMonthTotalDays = new Date(this.activeYear(), this.activeMonth(), 0).getDate();
    const startDay = prevMonthTotalDays - firstDayIndex + 1;
    return Array.from({ length: firstDayIndex }, (_, i) => startDay + i);
  });

  readonly nextMonthDays = computed(() => {
    const totalRendered = this.prevMonthDays().length + this.daysInMonth().length;
    const remainder = totalRendered % 7;
    const trailingCount = remainder === 0 ? 0 : 7 - remainder;
    return Array.from({ length: trailingCount }, (_, i) => i + 1);
  });

  readonly eventDays = input<number[]>([]);
  readonly dateSelected = output<{ day: number; month: string; year: number }>();
  readonly monthChange = output<{ month: string; year: number }>();

  hasGoldDot(day: number): boolean {
    return this.eventDays().includes(day);
  }

  hasGreenDot(day: number): boolean {
    return false;
  }

  selectDay(day: number) {
    this.selectedDay.set(day);
    this.dateSelected.emit({ 
      day, 
      month: this.currentMonth(), 
      year: this.currentYear() 
    });
  }

  prevMonth() {
    const currentMonth = this.activeMonth();
    const currentYear = this.activeYear();
    if (currentMonth === 0) {
      this.activeMonth.set(11);
      this.activeYear.set(currentYear - 1);
    } else {
      this.activeMonth.set(currentMonth - 1);
    }
    this.selectedDay.set(null);
    this.monthChange.emit({ month: this.currentMonth(), year: this.currentYear() });
  }

  nextMonth() {
    const currentMonth = this.activeMonth();
    const currentYear = this.activeYear();
    if (currentMonth === 11) {
      this.activeMonth.set(0);
      this.activeYear.set(currentYear + 1);
    } else {
      this.activeMonth.set(currentMonth + 1);
    }
    this.selectedDay.set(null);
    this.monthChange.emit({ month: this.currentMonth(), year: this.currentYear() });
  }
}


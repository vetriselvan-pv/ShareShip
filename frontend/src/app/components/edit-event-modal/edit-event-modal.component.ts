import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarEvent } from '../../models/calendar.models';
import { CurrencyService } from '../../services/currency.service';

@Component({
  selector: 'app-edit-event-modal',
  imports: [FormsModule],
  template: `
    @if (isOpen() && event()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-event-title"
      >
        <div
          class="w-full max-w-sm bg-[#f2fcf5] rounded-3xl border border-[#dbe5df] shadow-2xl p-4 flex flex-col gap-4 text-left"
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-2 border-b border-[#dbe5df]">
            <div>
              <h3 id="edit-event-title" class="text-[17px] font-semibold text-[#151d1a]">
                Edit Shared Event
              </h3>
              <p class="text-[11.5px] text-[#414844]">Update schedule &amp; details</p>
            </div>
            <button
              type="button"
              (click)="close.emit()"
              aria-label="Close modal"
              class="w-7 h-7 rounded-full bg-[#e6f0ea] flex items-center justify-center text-[#414844] hover:bg-[#dbe5df] transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Form Fields -->
          <form (ngSubmit)="handleSave()" class="flex flex-col gap-3">
            <!-- Event Name -->
            <div class="flex flex-col gap-1 text-left">
              <label for="edit-event-title-input" class="text-[12px] font-medium text-[#151d1a]">
                Event Name
              </label>
              <input
                id="edit-event-title-input"
                type="text"
                [(ngModel)]="title"
                name="title"
                placeholder="e.g. Maya's Baby Shower"
                class="w-full bg-[#ecf6f0] border border-[#dbe5df] rounded-xl px-3 py-2 text-[13px] text-[#151d1a] outline-none focus:border-[#466557]"
                required
              />
            </div>

            <!-- Category Dropdown -->
            <div class="flex flex-col gap-1 text-left">
              <label for="edit-event-category-select" class="text-[12px] font-medium text-[#151d1a]">
                Category
              </label>
              <select
                id="edit-event-category-select"
                [(ngModel)]="category"
                name="category"
                class="w-full bg-[#ecf6f0] border border-[#dbe5df] rounded-xl px-3 py-2 text-[13px] text-[#151d1a] outline-none focus:border-[#466557] cursor-pointer"
              >
                <option value="Event">Event</option>
                <option value="celebration">celebration</option>
                <option value="Incident">Incident</option>
                <option value="Task">Task</option>
              </select>
            </div>

            <!-- Date & Time Row -->
            <div class="grid grid-cols-2 gap-2">
              <div class="flex flex-col gap-1 text-left">
                <label for="edit-event-date-input" class="text-[12px] font-medium text-[#151d1a]">
                  Date
                </label>
                <input
                  id="edit-event-date-input"
                  type="date"
                  [(ngModel)]="date"
                  name="date"
                  class="w-full bg-[#ecf6f0] border border-[#dbe5df] rounded-xl px-3 py-2 text-[13px] text-[#151d1a] outline-none focus:border-[#466557]"
                  required
                />
              </div>

              <div class="flex flex-col gap-1 text-left">
                <label for="edit-event-time-input" class="text-[12px] font-medium text-[#151d1a]">
                  Time
                </label>
                <input
                  id="edit-event-time-input"
                  type="text"
                  [(ngModel)]="time"
                  name="time"
                  placeholder="e.g. 12:00 PM"
                  class="w-full bg-[#ecf6f0] border border-[#dbe5df] rounded-xl px-3 py-2 text-[13px] text-[#151d1a] outline-none focus:border-[#466557]"
                />
              </div>
            </div>

            <!-- Gift / Note -->
            <div class="flex flex-col gap-1 text-left">
              <label for="edit-event-gift-input" class="text-[12px] font-medium text-[#151d1a]">
                Gift / Note
              </label>
              <input
                id="edit-event-gift-input"
                type="text"
                [(ngModel)]="gift"
                name="gift"
                [placeholder]="'Gift or notes (e.g. ' + currencyService.currencySymbol() + '100, flowers)'"
                class="w-full bg-[#ecf6f0] border border-[#dbe5df] rounded-xl px-3 py-2 text-[13px] text-[#151d1a] outline-none focus:border-[#466557]"
              />
            </div>

            <!-- Location -->
            <div class="flex flex-col gap-1 text-left">
              <label for="edit-event-location-input" class="text-[12px] font-medium text-[#151d1a]">
                Location / Venue
              </label>
              <input
                id="edit-event-location-input"
                type="text"
                [(ngModel)]="location"
                name="location"
                placeholder="e.g. Sunken Meadow Park"
                class="w-full bg-[#ecf6f0] border border-[#dbe5df] rounded-xl px-3 py-2 text-[13px] text-[#151d1a] outline-none focus:border-[#466557]"
              />
            </div>

            <!-- Actions Row: Delete, Cancel, Save -->
            <div class="flex items-center justify-between gap-2 pt-3 border-t border-[#dbe5df]">
              <button
                type="button"
                (click)="handleDelete()"
                class="py-2 px-3 rounded-xl bg-[#fcdad7] hover:bg-[#f8b4af] text-[#ba1a1a] font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                title="Delete this event"
              >
                <svg class="w-3.5 h-3.5 stroke-current fill-none" viewBox="0 0 24 24" stroke-width="2">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                <span>Delete</span>
              </button>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="close.emit()"
                  class="py-2 px-3 rounded-xl bg-[#e6f0ea] hover:bg-[#dbe5df] text-[#151d1a] font-medium text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="py-2 px-3.5 rounded-xl bg-[#466557] hover:bg-[#395347] text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class EditEventModalComponent {
  readonly currencyService = inject(CurrencyService);

  readonly isOpen = input<boolean>(false);
  readonly event = input<CalendarEvent | null>(null);

  readonly close = output<void>();
  readonly eventUpdated = output<{
    id: string;
    title: string;
    category: string;
    date: string;
    time: string;
    location: string;
    gift: string;
  }>();
  readonly eventDeleted = output<CalendarEvent>();

  readonly title = signal('');
  readonly category = signal<'Event' | 'celebration' | 'Incident' | 'Task'>('Event');
  readonly date = signal('');
  readonly time = signal('12:00 PM');
  readonly location = signal('');
  readonly gift = signal('');

  constructor() {
    effect(() => {
      const ev = this.event();
      if (ev) {
        this.title.set(ev.title || '');
        this.category.set((ev.category as any) || 'Event');
        this.date.set(ev.date || '');
        this.time.set(ev.time || '12:00 PM');
        this.location.set(ev.location || '');
        this.gift.set(ev.gift || '');
      }
    });
  }

  handleSave() {
    const ev = this.event();
    const titleVal = this.title().trim();
    if (!ev || !titleVal) return;

    this.eventUpdated.emit({
      id: ev.id,
      title: titleVal,
      category: this.category(),
      date: this.date() || ev.date,
      time: this.time() || '12:00 PM',
      location: this.location().trim(),
      gift: this.gift().trim()
    });
  }

  handleDelete() {
    const ev = this.event();
    if (!ev) return;
    this.eventDeleted.emit(ev);
  }
}

import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyService } from '../../services/currency.service';

@Component({
  selector: 'app-add-event-modal',
  imports: [FormsModule],
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-event-title"
      >
        <div
          class="w-full max-w-sm bg-[#f2fcf5] rounded-3xl border border-[#dbe5df] shadow-2xl p-4 flex flex-col gap-4"
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-2 border-b border-[#dbe5df]">
            <div>
              <h3 id="add-event-title" class="text-[17px] font-semibold text-[#151d1a]">
                Add Shared Event &amp; Gift
              </h3>
              <p class="text-[11.5px] text-[#414844]">Syncs instantly with partner</p>
            </div>
            <button
              type="button"
              (click)="close.emit()"
              aria-label="Close modal"
              class="w-7 h-7 rounded-full bg-[#e6f0ea] flex items-center justify-center text-[#414844] hover:bg-[#dbe5df] transition-colors"
            >
              ✕
            </button>
          </div>

          <!-- Form Fields -->
          <form (ngSubmit)="handleSubmit()" class="flex flex-col gap-3">
            <div class="flex flex-col gap-1 text-left">
              <label for="event-title-input" class="text-[12px] font-medium text-[#151d1a]"
                >Event Name</label
              >
              <input
                id="event-title-input"
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
              <label for="event-category-select" class="text-[12px] font-medium text-[#151d1a]"
                >Category</label
              >
              <select
                id="event-category-select"
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

            <div class="flex flex-col gap-1 text-left">
              <label for="event-date-input" class="text-[12px] font-medium text-[#151d1a]"
                >Date</label
              >
              <input
                id="event-date-input"
                type="date"
                [(ngModel)]="date"
                name="date"
                class="w-full bg-[#ecf6f0] border border-[#dbe5df] rounded-xl px-3 py-2 text-[13px] text-[#151d1a] outline-none focus:border-[#466557]"
              />
            </div>

            <div class="flex flex-col gap-1 text-left">
              <label for="event-budget-input" class="text-[12px] font-medium text-[#151d1a]"
                >Gift</label
              >
              <input
                id="event-budget-input"
                type="text"
                [(ngModel)]="gift"
                name="gift"
                [placeholder]="'Enter amount or gift (e.g. ' + currencyService.currencySymbol() + '100, flowers, watch)'"
                class="w-full bg-[#ecf6f0] border border-[#dbe5df] rounded-xl px-3 py-2 text-[13px] text-[#151d1a] outline-none focus:border-[#466557]"
              />
            </div>

            <div class="flex flex-col gap-1 text-left">
              <label for="event-location-input" class="text-[12px] font-medium text-[#151d1a]"
                >Location / Venue</label
              >
              <input
                id="event-location-input"
                type="text"
                [(ngModel)]="location"
                name="location"
                placeholder="e.g. Sunken Meadow Park"
                class="w-full bg-[#ecf6f0] border border-[#dbe5df] rounded-xl px-3 py-2 text-[13px] text-[#151d1a] outline-none focus:border-[#466557]"
              />
            </div>

            <div class="flex items-center gap-2 pt-2 border-t border-[#dbe5df]">
              <button
                type="button"
                (click)="close.emit()"
                class="flex-1 py-2 rounded-xl bg-[#e6f0ea] hover:bg-[#dbe5df] text-[#151d1a] font-medium text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="flex-1 py-2 rounded-xl bg-[#466557] hover:bg-[#395347] text-white font-medium text-xs transition-colors shadow-xs cursor-pointer"
              >
                Save &amp; Notify Partner
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class AddEventModalComponent {
  readonly currencyService = inject(CurrencyService);
  readonly isOpen = input<boolean>(false);
  readonly close = output<void>();
  readonly eventCreated = output<{
    title: string;
    category: string;
    date: string;
    location: string;
    gift: string;
  }>();

  readonly title = signal('');
  readonly category = signal<'Event' | 'celebration' | 'Incident' | 'Task'>('Event');
  readonly date = signal('');
  readonly location = signal('');
  readonly gift = signal('');

  handleSubmit() {
    const titleVal = this.title().trim();
    if (!titleVal) return;
    const giftVal = this.gift().trim();
    const dateVal = this.date() || new Date().toISOString().split('T')[0];
    this.eventCreated.emit({
      title: titleVal,
      category: this.category(),
      date: dateVal,
      location: this.location().trim(),
      gift: giftVal,
    });
    this.title.set('');
    this.category.set('Event');
    this.date.set('');
    this.location.set('');
    this.gift.set('');
  }
}

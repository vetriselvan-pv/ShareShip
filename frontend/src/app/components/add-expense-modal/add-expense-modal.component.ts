import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface EventOption {
  id: string;
  title: string;
}

export type ExpenseCategory = 'Gift' | 'Utilities' | 'Food' | 'Home Expenses' | 'Travel' | 'Cattle' | 'Lifestyle';

export interface NewExpensePayload {
  title: string;
  category: ExpenseCategory | string;
  amount: number;
  paidBy: string;
  splitLabel: string;
  expenseType: 'monthly' | 'event';
  eventId?: string;
  eventTitle?: string;
}

@Component({
  selector: 'app-add-expense-modal',
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none fade-in">
        <div class="bg-[#f2fcf5] w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[#adcebe] flex flex-col gap-4 text-left max-h-[92vh] overflow-y-auto">
          
          <!-- Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-[#fed65b] text-[#745c00] flex items-center justify-center shadow-2xs">
                <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </div>
              <h3 class="text-base font-bold text-[#151d1a]">Add Expense</h3>
            </div>
            <button 
              type="button"
              (click)="close.emit()"
              class="w-8 h-8 rounded-full bg-[#e6f0ea] hover:bg-[#dbe5df] text-[#414844] flex items-center justify-center cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>

          <!-- Expense Scope Selector: Monthly vs Event-Specific -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-[#414844]">Expense Scope</label>
            <div class="grid grid-cols-2 gap-1.5 p-1 bg-[#e6f0ea] rounded-2xl border border-[#dbe5df]">
              <button
                type="button"
                (click)="expenseType.set('monthly')"
                [class]="expenseType() === 'monthly' ? 'bg-[#466557] text-white shadow-xs font-semibold' : 'text-[#414844] hover:text-[#151d1a] font-medium'"
                class="py-2.5 px-3 text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span class="text-sm leading-none shrink-0">📅</span>
                <span class="truncate">Monthly Expense</span>
              </button>
              <button
                type="button"
                (click)="expenseType.set('event')"
                [class]="expenseType() === 'event' ? 'bg-[#466557] text-white shadow-xs font-semibold' : 'text-[#414844] hover:text-[#151d1a] font-medium'"
                class="py-2.5 px-3 text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span class="text-sm leading-none shrink-0">🎉</span>
                <span class="truncate">Event-Specific</span>
              </button>
            </div>
          </div>

          <!-- Event-Specific Options (Conditional) -->
          @if (expenseType() === 'event') {
            <div class="flex flex-col gap-2 p-3 bg-[#e1eae4] rounded-2xl border border-[#adcebe]/60">
              <div class="flex flex-col gap-1">
                <label class="text-xs font-semibold text-[#151d1a]">Select Event</label>
                <select
                  [ngModel]="selectedEventId()"
                  (ngModelChange)="onEventChange($event)"
                  class="bg-white border border-[#c1c8c3] rounded-xl px-2.5 py-2 text-xs text-[#151d1a] focus:outline-none focus:border-[#466557]"
                >
                  @for (evt of events(); track evt.id) {
                    <option [value]="evt.id">{{ evt.title }}</option>
                  }
                  <option value="__new__">+ New Custom Event</option>
                </select>
              </div>

              @if (selectedEventId() === '__new__') {
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-semibold text-[#414844]">New Event Name</label>
                  <input
                    type="text"
                    [(ngModel)]="customEventTitle"
                    placeholder="e.g. Weekend Camping Trip"
                    class="bg-white border border-[#c1c8c3] rounded-xl px-3 py-1.5 text-xs text-[#151d1a] focus:outline-none focus:border-[#466557]"
                  />
                </div>
              }

              <!-- Visual reassurance of consolidation -->
              <div class="text-[11px] text-[#2b4c3e] flex items-center gap-1.5 bg-[#d2e5db] px-2.5 py-1.5 rounded-xl font-medium">
                <span class="text-xs">💡</span>
                <span>The consolidated event amount will be added to your monthly expenses.</span>
              </div>
            </div>
          }

          <!-- Form Fields -->
          <div class="flex flex-col gap-3">
            <!-- Expense Title -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-[#414844]">Expense Description</label>
              <input
                type="text"
                [(ngModel)]="title"
                [placeholder]="expenseType() === 'event' ? 'e.g. Ferry Tickets to Amalfi' : 'e.g. Farmers Market Grocery Prep'"
                class="bg-white border border-[#c1c8c3] rounded-xl px-3 py-2 text-sm text-[#151d1a] placeholder:text-[#727974] focus:outline-none focus:border-[#466557]"
              />
            </div>

            <!-- Amount & Category Row -->
            <div class="grid grid-cols-2 gap-2.5">
              <div class="flex flex-col gap-1">
                <label class="text-xs font-semibold text-[#414844]">Amount ({{ currencySymbol() }})</label>
                <input
                  type="number"
                  step="0.01"
                  [(ngModel)]="amount"
                  placeholder="0.00"
                  class="bg-white border border-[#c1c8c3] rounded-xl px-3 py-2 text-sm text-[#151d1a] focus:outline-none focus:border-[#466557]"
                />
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-xs font-semibold text-[#414844]">Category</label>
                <select
                  [(ngModel)]="category"
                  class="bg-white border border-[#c1c8c3] rounded-xl px-2.5 py-2 text-sm text-[#151d1a] focus:outline-none focus:border-[#466557]"
                >
                  <option value="Gift">Gift</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Food">Food</option>
                  <option value="Home Expenses">Home Expenses</option>
                  <option value="Travel">Travel</option>
                  <option value="Cattle">Cattle</option>
                  <option value="Lifestyle">Lifestyle</option>
                </select>
              </div>
            </div>

            <!-- Paid By: Provision is ONLY to add expense by the logged in user -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-[#414844]">Paid By</label>
              <div class="flex items-center justify-between bg-[#e6f0ea] border border-[#adcebe] rounded-xl px-3 py-2">
                <div class="flex items-center gap-2">
                  @if (currentUserAvatar()) {
                    <img
                      [src]="currentUserAvatar()"
                      alt="User Avatar"
                      class="w-6 h-6 rounded-full object-cover shadow-2xs border border-[#adcebe]"
                    />
                  } @else {
                    <div class="w-6 h-6 rounded-full bg-[#466557] text-white flex items-center justify-center text-[11px] font-bold shadow-2xs">
                      {{ (currentUserName() || 'Y').charAt(0).toUpperCase() }}
                    </div>
                  }
                  <span class="text-xs font-semibold text-[#151d1a]">
                    {{ currentUserName() || 'You' }} (You)
                  </span>
                </div>
                <span class="text-[10px] font-semibold text-[#3b594b] bg-[#c8ead9] px-2 py-0.5 rounded-full">
                  Logged In User
                </span>
              </div>
              <p class="text-[10.5px] text-[#5b635e] italic">
                Expenses can only be recorded by the active logged-in user.
              </p>
            </div>

            <!-- Split Method (Default: Covered 100% by You) -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-[#414844]">Split Agreement</label>
              <select
                [(ngModel)]="splitMethod"
                class="bg-white border border-[#c1c8c3] rounded-xl px-2.5 py-2 text-sm text-[#151d1a] focus:outline-none focus:border-[#466557]"
              >
                <option value="Covered by You">Covered 100% by You</option>
                <option value="Split 50/50">Split 50/50 (Equal)</option>
                <option value="Partner owes half">Partner owes half</option>
                <option value="Covered by Partner">Covered 100% by Partner</option>
              </select>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2 pt-2 border-t border-[#dbe5df]/60">
            <button
              type="button"
              (click)="close.emit()"
              class="px-4 py-2 rounded-xl text-xs font-medium text-[#414844] hover:bg-[#e6f0ea] cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="handleSave()"
              [disabled]="isSaveDisabled()"
              class="bg-[#466557] disabled:opacity-50 hover:bg-[#395347] active:scale-95 text-white font-semibold text-xs px-5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Save &amp; Consolidate
            </button>
          </div>

        </div>
      </div>
    }
  `
})
export class AddExpenseModalComponent {
  isOpen = input<boolean>(false);
  events = input<EventOption[]>([]);
  defaultEventId = input<string>('');
  currentUserName = input<string>('You');
  currentUserId = input<string>('');
  currentUserAvatar = input<string>('');
  currencySymbol = input<string>('₹');

  close = output<void>();
  expenseCreated = output<NewExpensePayload>();

  expenseType = signal<'monthly' | 'event'>('monthly');
  selectedEventId = signal<string>('');
  customEventTitle = signal<string>('');
  title = signal<string>('');
  amount = signal<number | null>(null);
  category = signal<ExpenseCategory>('Food');
  splitMethod = signal<string>('Covered by You');

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const evts = this.events();
        const def = this.defaultEventId();
        if (def) {
          this.expenseType.set('event');
          this.selectedEventId.set(def);
        } else if (evts.length > 0 && !this.selectedEventId()) {
          this.selectedEventId.set(evts[0].id);
        }
      }
    });
  }

  onEventChange(val: string) {
    this.selectedEventId.set(val);
  }

  isSaveDisabled(): boolean {
    if (!this.title().trim() || !this.amount() || Number(this.amount()) <= 0) return true;
    if (this.expenseType() === 'event') {
      if (this.selectedEventId() === '__new__' && !this.customEventTitle().trim()) {
        return true;
      }
      if (!this.selectedEventId() && this.events().length === 0 && !this.customEventTitle().trim()) {
        return true;
      }
    }
    return false;
  }

  handleSave() {
    if (this.isSaveDisabled()) return;

    let eventId: string | undefined = undefined;
    let eventTitle: string | undefined = undefined;

    if (this.expenseType() === 'event') {
      if (this.selectedEventId() === '__new__') {
        eventTitle = this.customEventTitle().trim();
        eventId = `evt_${Date.now()}`;
      } else {
        const matched = this.events().find(e => e.id === this.selectedEventId());
        if (matched) {
          eventId = matched.id;
          eventTitle = matched.title;
        } else if (this.customEventTitle().trim()) {
          eventTitle = this.customEventTitle().trim();
          eventId = `evt_${Date.now()}`;
        }
      }
    }

    this.expenseCreated.emit({
      title: this.title().trim(),
      amount: Number(this.amount()),
      category: this.category(),
      paidBy: this.currentUserName() || 'You',
      splitLabel: this.splitMethod(),
      expenseType: this.expenseType(),
      eventId,
      eventTitle
    });

    // Reset fields
    this.title.set('');
    this.amount.set(null);
    this.customEventTitle.set('');
    this.splitMethod.set('Covered by You');
  }
}

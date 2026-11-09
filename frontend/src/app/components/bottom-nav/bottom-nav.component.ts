import { Component, input, output } from '@angular/core';
import { NavTab } from '../../models/navigation.models';

@Component({
  selector: 'app-bottom-nav',
  styles: [`
    .nav-icon-white {
      filter: brightness(0) invert(1);
    }
  `],
  template: `
    <nav class="fixed bottom-0 left-0 right-0 bg-[#f2fcf5]/95 backdrop-blur-xl border-t border-[#dbe5df]/70 px-2 pt-1 pb-1.5 safe-bottom z-50 select-none shadow-[0_-2px_10px_rgba(70,101,87,0.05)] transition-all" style="view-transition-name: persistent-bottom-nav;">
      <div class="w-full max-w-[390px] mx-auto flex items-center justify-between box-border gap-1">

        <!-- 1. Home Tab -->
        <button
          type="button"
          (click)="onSelectTab('home')"
          class="flex-1 max-w-[66px] h-[46px] rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ease-out cursor-pointer active:scale-90"
          [class]="activeTab() === 'home'
            ? 'bg-[#466557] text-white shadow-[0_2px_8px_rgba(70,101,87,0.2)] font-semibold'
            : 'text-[#414844] hover:text-[#151d1a] hover:bg-[#e6f0ea]/60 font-medium'"
          title="Home Dashboard"
        >
          <div class="transition-transform duration-300 ease-out" [class.scale-110]="activeTab() === 'home'">
            <svg class="w-5 h-5 stroke-current fill-none" viewBox="0 0 24 24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span class="text-[11px] mt-0.5 tracking-tight transition-all duration-200">Home</span>
        </button>

        <!-- 2. Calendar Tab -->
        <button
          type="button"
          (click)="onSelectTab('calendar')"
          class="flex-1 max-w-[66px] h-[46px] rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ease-out cursor-pointer active:scale-90"
          [class]="activeTab() === 'calendar'
            ? 'bg-[#466557] text-white shadow-[0_2px_8px_rgba(70,101,87,0.2)] font-semibold'
            : 'text-[#414844] hover:text-[#151d1a] hover:bg-[#e6f0ea]/60 font-medium'"
          title="Shared Calendar"
        >
          <div class="transition-transform duration-300 ease-out" [class.scale-110]="activeTab() === 'calendar'">
            <svg class="w-5 h-5 stroke-current fill-none" viewBox="0 0 24 24" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" x2="16" y1="2" y2="6"/>
              <line x1="8" x2="8" y1="2" y2="6"/>
              <line x1="3" x2="21" y1="10" y2="10"/>
            </svg>
          </div>
          <span class="text-[11px] mt-0.5 tracking-tight transition-all duration-200">Calendar</span>
        </button>

        <!-- 3. Expenses Tab -->
        <button
          type="button"
          (click)="onSelectTab('expenses')"
          class="flex-1 max-w-[66px] h-[46px] rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ease-out cursor-pointer active:scale-90"
          [class]="activeTab() === 'expenses'
            ? 'bg-[#466557] text-white shadow-[0_2px_8px_rgba(70,101,87,0.2)] font-semibold'
            : 'text-[#414844] hover:text-[#151d1a] hover:bg-[#e6f0ea]/60 font-medium'"
          title="Shared Purse & Expenses"
        >
          <div class="transition-transform duration-300 ease-out" [class.scale-110]="activeTab() === 'expenses'">
            <img
              src="icons/expenses.svg"
              alt="Expenses"
              class="w-5 h-5 object-contain transition-all duration-200"
              [class.brightness-0]="activeTab() === 'expenses'"
              [class.invert]="activeTab() === 'expenses'"
              [class.nav-icon-white]="activeTab() === 'expenses'"
            />
          </div>
          <span class="text-[11px] mt-0.5 tracking-tight transition-all duration-200">Expenses</span>
        </button>

        <!-- 4. Notes Tab -->
        <button
          type="button"
          (click)="onSelectTab('notes')"
          class="flex-1 max-w-[66px] h-[46px] rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ease-out cursor-pointer active:scale-90"
          [class]="activeTab() === 'notes'
            ? 'bg-[#466557] text-white shadow-[0_2px_8px_rgba(70,101,87,0.2)] font-semibold'
            : 'text-[#414844] hover:text-[#151d1a] hover:bg-[#e6f0ea]/60 font-medium'"
          title="Shared Workspace & Notes"
        >
          <div class="transition-transform duration-300 ease-out" [class.scale-110]="activeTab() === 'notes'">
            <img
              src="icons/notes.svg"
              alt="Notes"
              class="w-5 h-5 object-contain transition-all duration-200"
              [class.brightness-0]="activeTab() === 'notes'"
              [class.invert]="activeTab() === 'notes'"
              [class.nav-icon-white]="activeTab() === 'notes'"
            />
          </div>
          <span class="text-[11px] mt-0.5 tracking-tight transition-all duration-200">Notes</span>
        </button>

        <!-- 5. Gifts & Registry Tab (Replaces Alerts in bottom menu) -->
        <button
          type="button"
          (click)="onSelectTab('gifts')"
          class="flex-1 max-w-[66px] h-[46px] rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ease-out cursor-pointer active:scale-90"
          [class]="activeTab() === 'gifts'
            ? 'bg-[#466557] text-white shadow-[0_2px_8px_rgba(70,101,87,0.2)] font-semibold'
            : 'text-[#414844] hover:text-[#151d1a] hover:bg-[#e6f0ea]/60 font-medium'"
          title="Gifts & Registry"
        >
          <div class="transition-transform duration-300 ease-out" [class.scale-110]="activeTab() === 'gifts'">
            <img
              src="icons/gift.svg"
              alt="Gifts"
              class="w-5 h-5 object-contain transition-all duration-200"
              [class.brightness-0]="activeTab() === 'gifts'"
              [class.invert]="activeTab() === 'gifts'"
              [class.nav-icon-white]="activeTab() === 'gifts'"
            />
          </div>
          <span class="text-[11px] mt-0.5 tracking-tight transition-all duration-200">Gifts</span>
        </button>
      </div>
    </nav>
  `
})
export class BottomNavComponent {
  activeTab = input<NavTab>('home');
  tabSelected = output<NavTab>();

  onSelectTab(tab: NavTab) {
    this.tabSelected.emit(tab);
  }
}

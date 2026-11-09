import { Component, input, output } from '@angular/core';
import { NavTab } from '../../models/navigation.models';

@Component({
  selector: 'app-bottom-nav',
  template: `
    <nav class="fixed bottom-0 left-0 right-0 bg-[#f2fcf5]/95 backdrop-blur-xl border-t border-[#dbe5df]/70 px-2 pt-1 pb-1.5 safe-bottom z-50 select-none shadow-[0_-2px_10px_rgba(70,101,87,0.05)] transition-all" style="view-transition-name: persistent-bottom-nav;">
      <div class="w-full max-w-[390px] mx-auto flex items-center justify-between box-border gap-1">

        <!-- 1. Home Tab -->
        <button
          type="button"
          (click)="onSelectTab('home')"
          class="flex-1 max-w-[66px] h-[46px] rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ease-out cursor-pointer active:scale-90"
          [class]="activeTab() === 'home'
            ? 'bg-[#6b8979] text-[#13221b] shadow-[0_2px_8px_rgba(70,101,87,0.2)] font-semibold'
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
            ? 'bg-[#6b8979] text-[#13221b] shadow-[0_2px_8px_rgba(70,101,87,0.2)] font-semibold'
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
            ? 'bg-[#6b8979] text-[#13221b] shadow-[0_2px_8px_rgba(70,101,87,0.2)] font-semibold'
            : 'text-[#414844] hover:text-[#151d1a] hover:bg-[#e6f0ea]/60 font-medium'"
          title="Shared Purse & Expenses"
        >
          <div class="transition-transform duration-300 ease-out" [class.scale-110]="activeTab() === 'expenses'">
            <svg class="w-5 h-5 stroke-current fill-none" viewBox="0 0 24 24" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
              <rect width="20" height="14" x="2" y="5" rx="2"/>
              <circle cx="12" cy="12" r="2.5"/>
              <path d="M6 12h.01M18 12h.01"/>
            </svg>
          </div>
          <span class="text-[11px] mt-0.5 tracking-tight transition-all duration-200">Expenses</span>
        </button>

        <!-- 4. Notes Tab -->
        <button
          type="button"
          (click)="onSelectTab('notes')"
          class="flex-1 max-w-[66px] h-[46px] rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ease-out cursor-pointer active:scale-90"
          [class]="activeTab() === 'notes'
            ? 'bg-[#6b8979] text-[#13221b] shadow-[0_2px_8px_rgba(70,101,87,0.2)] font-semibold'
            : 'text-[#414844] hover:text-[#151d1a] hover:bg-[#e6f0ea]/60 font-medium'"
          title="Shared Workspace & Notes"
        >
          <div class="transition-transform duration-300 ease-out" [class.scale-110]="activeTab() === 'notes'">
            <svg class="w-5 h-5 stroke-current fill-none" viewBox="0 0 24 24" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" x2="8" y1="13" y2="13"/>
              <line x1="16" x2="8" y1="17" y2="17"/>
              <line x1="10" x2="8" y1="9" y2="9"/>
            </svg>
          </div>
          <span class="text-[11px] mt-0.5 tracking-tight transition-all duration-200">Notes</span>
        </button>

        <!-- 5. Gifts & Registry Tab (Replaces Alerts in bottom menu) -->
        <button
          type="button"
          (click)="onSelectTab('gifts')"
          class="flex-1 max-w-[66px] h-[46px] rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ease-out cursor-pointer active:scale-90"
          [class]="activeTab() === 'gifts'
            ? 'bg-[#6b8979] text-[#13221b] shadow-[0_2px_8px_rgba(70,101,87,0.2)] font-semibold'
            : 'text-[#414844] hover:text-[#151d1a] hover:bg-[#e6f0ea]/60 font-medium'"
          title="Gifts & Registry"
        >
          <div class="transition-transform duration-300 ease-out" [class.scale-110]="activeTab() === 'gifts'">
            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.65-.5-.65C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76V14h2V8.76L15.38 12 17 10.83 14.92 8H20v6z"/>
            </svg>
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

import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AuthMode = 'sign-in' | 'create-space';

@Component({
  selector: 'app-auth-switcher',
  imports: [CommonModule],
  template: `
    <div class="w-full bg-[#e6f0ea] p-1.5 rounded-2xl flex items-center select-none border border-[#dbe5df]/50">
      <!-- Sign In Tab -->
      <button
        type="button"
        (click)="modeChange.emit('sign-in')"
        [class]="mode() === 'sign-in' 
          ? 'bg-white text-[#151d1a] shadow-[0_2px_8px_rgba(0,0,0,0.06)] font-semibold' 
          : 'text-[#414844] hover:text-[#151d1a] font-normal'"
        class="flex-1 py-2.5 px-4 rounded-xl text-[15px] transition-all duration-200 text-center"
      >
        Sign In
      </button>

      <!-- Create Space Tab -->
      <button
        type="button"
        (click)="modeChange.emit('create-space')"
        [class]="mode() === 'create-space' 
          ? 'bg-white text-[#151d1a] shadow-[0_2px_8px_rgba(0,0,0,0.06)] font-semibold' 
          : 'text-[#414844] hover:text-[#151d1a] font-normal'"
        class="flex-1 py-2.5 px-4 rounded-xl text-[15px] transition-all duration-200 text-center"
      >
        Create Space
      </button>
    </div>
  `
})
export class AuthSwitcherComponent {
  mode = input<AuthMode>('sign-in');
  modeChange = output<AuthMode>();
}

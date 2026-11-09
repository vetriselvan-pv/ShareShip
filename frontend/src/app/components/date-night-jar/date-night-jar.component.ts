import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-date-night-jar',
  imports: [CommonModule],
  template: `
    <div class="rounded-xl bg-[#e6f0ea] border border-[#dbe5df]/70 px-4 py-3 flex items-center justify-between shadow-2xs">
      <!-- Left: Heart icon + Message -->
      <div class="flex items-center gap-2.5">
        <svg class="w-4 h-4 text-[#466557] fill-[#466557]" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <span class="text-[13.5px] font-medium text-[#151d1a]">
          Date Night jar suggestions ready
        </span>
      </div>

      <!-- Right: Action Button -->
      <button 
        type="button"
        (click)="onDrawIdea.emit()"
        class="text-[#466557] hover:text-[#314a3e] font-semibold text-[13px] flex items-center gap-1 transition-colors cursor-pointer"
      >
        <span>Draw Idea</span>
        <span class="text-base font-bold">→</span>
      </button>
    </div>
  `
})
export class DateNightJarComponent {
  onDrawIdea = output<void>();
}

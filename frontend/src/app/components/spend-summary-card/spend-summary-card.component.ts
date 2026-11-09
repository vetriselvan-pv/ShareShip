import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spend-summary-card',
  imports: [CommonModule],
  template: `
    <div class="bg-[#e1eae4] rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-2xs border border-[#dbe5df]/60 relative overflow-hidden select-none">
      <!-- Translucent accent glow in background -->
      <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-[#466557]/10 rounded-full blur-2xl pointer-events-none"></div>

      <!-- Header: Total This Month -->
      <div class="flex justify-between items-start">
        <div class="flex flex-col text-left">
          <span class="text-[11px] font-bold text-[#414844] uppercase tracking-wider">
            Total This Month
          </span>
          <div class="text-[26px] font-bold text-[#151d1a] tracking-tight leading-tight mt-0.5">
            {{ totalMonth() }}
          </div>
          @if (consolidatedEventAmount()) {
            <div class="flex items-center gap-1 text-[11px] font-medium text-[#355345] bg-[#cce3d6] px-2 py-0.5 rounded-md mt-1 w-fit shadow-2xs">
              <span class="w-1.5 h-1.5 rounded-full bg-[#466557]"></span>
              <span>Includes {{ consolidatedEventAmount() }} event expenses</span>
            </div>
          }
        </div>
      </div>

      <!-- Split Progress Bar: Who Paid What -->
      <div class="flex flex-col gap-1.5 mt-0.5">
        <div class="flex justify-between text-[13px] text-[#414844] font-medium">
          <span>You ({{ youAmount() }})</span>
          <span>{{ partnerName() }} ({{ alexAmount() }})</span>
        </div>

        <!-- Dual-Color Bar -->
        <div class="h-3 w-full bg-[#dbe5df] rounded-full overflow-hidden flex shadow-inner">
          @if (youPercent() > 0 || alexPercent() > 0) {
            <div 
              class="bg-[#466557] h-full transition-all duration-700 rounded-l-full" 
              [style.width.%]="youPercent()"
            ></div>
            <div 
              class="bg-[#e9c349] h-full transition-all duration-700 rounded-r-full" 
              [style.width.%]="alexPercent()"
            ></div>
          } @else {
            <div class="bg-[#cdd8d1] w-full h-full opacity-60"></div>
          }
        </div>

        <!-- Percentage Breakdown Labels -->
        <div class="flex justify-between text-[11.5px] mt-0.5 font-semibold">
          <span class="text-[#466557]">{{ youPercent() }}% paid</span>
          <span class="text-[#735c00]">{{ alexPercent() }}% paid</span>
        </div>
      </div>
    </div>
  `
})
export class SpendSummaryCardComponent {
  totalMonth = input<string>('₹0.00');
  consolidatedEventAmount = input<string>('');
  youAmount = input<string>('₹0');
  alexAmount = input<string>('₹0');
  partnerName = input<string>('Partner');
  youPercent = input<number>(0);
  alexPercent = input<number>(0);
}

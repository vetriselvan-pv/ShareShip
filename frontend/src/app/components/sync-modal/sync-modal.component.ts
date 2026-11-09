import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SyncEvent, PartnerLink } from '../../models/sync.models';

@Component({
  selector: 'app-sync-modal',
  imports: [FormsModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs fade-in">
        <div 
          class="w-full max-w-lg bg-[#f2fcf5] rounded-t-[28px] sm:rounded-3xl border border-[#dbe5df] shadow-2xl p-6 flex flex-col gap-5 max-h-[88vh] overflow-hidden"
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-3 border-b border-[#dbe5df]">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full bg-[#adcebe] flex items-center justify-center text-[#133126] font-bold text-sm">
                {{ partnerLink()?.partner?.initial || 'P' }}
              </div>
              <div>
                <h3 class="text-lg font-semibold text-[#151d1a] leading-tight">Live Space Synchronization</h3>
                <p class="text-xs text-[#414844]">Real-time Partner Engine • {{ partnerLink()?.partner?.name || 'Partner' }} &amp; {{ partnerLink()?.me?.name || 'You' }}</p>
              </div>
            </div>

            <button 
              type="button" 
              (click)="close.emit()" 
              class="w-8 h-8 rounded-full bg-[#e6f0ea] hover:bg-[#dbe5df] flex items-center justify-center text-[#414844] transition-colors"
            >
              ✕
            </button>
          </div>

          <!-- Live Status Bar -->
          <div class="bg-[#ecf6f0] p-3.5 rounded-2xl flex items-center justify-between border border-[#dbe5df]">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-[#52b788] live-pulse"></span>
              <span class="text-sm font-semibold text-[#151d1a]">Status: Connected</span>
            </div>
            <span class="text-xs font-mono text-[#414844] bg-white/70 px-2.5 py-1 rounded-full border border-[#dbe5df]">
              Latency: 18ms
            </span>
          </div>

          <!-- Differentiated Feed (Me vs Partner) -->
          <div class="flex flex-col gap-2.5 overflow-y-auto pr-1 flex-1 min-h-[220px]">
            <span class="text-xs font-semibold uppercase tracking-wider text-[#727974]">Live Feed (Me vs Partner)</span>
            
            @for (event of events(); track event.id) {
              <div 
                class="p-3.5 rounded-2xl border text-sm transition-all"
                [class]="event.authorRole === 'partner' 
                  ? 'bg-white border-[#adcebe] ml-2 text-left shadow-xs' 
                  : 'bg-[#e6f0ea] border-[#dbe5df] mr-2 text-left'"
              >
                <div class="flex items-center justify-between mb-1">
                  <span 
                    class="text-xs font-semibold px-2 py-0.5 rounded-full"
                    [class]="event.authorRole === 'partner' ? 'bg-[#c8ead9] text-[#012016]' : 'bg-[#7a9a8b]/20 text-[#133126]'"
                  >
                    {{ event.authorRole === 'partner' ? 'Partner (' + event.authorName + ')' : 'Me (' + event.authorName + ')' }}
                  </span>
                  <span class="text-[11px] text-[#727974]">{{ formatTime(event.timestamp) }}</span>
                </div>
                <div class="text-[#151d1a] font-medium text-[13.5px]">
                  {{ getEventText(event) }}
                </div>
              </div>
            }
          </div>

          <!-- Quick Test Actions -->
          <div class="flex items-center gap-2 pt-2 border-t border-[#dbe5df]">
            <button
              type="button"
              (click)="triggerPartnerSync.emit()"
              class="flex-1 py-2.5 px-3 bg-[#adcebe] hover:bg-[#9cc4b2] text-[#133126] font-semibold text-xs rounded-xl transition-colors shadow-xs"
            >
              + Simulate Partner Action
            </button>
            <button
              type="button"
              (click)="triggerMySync.emit()"
              class="flex-1 py-2.5 px-3 bg-[#466557] hover:bg-[#395347] text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
            >
              + Send as Me
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class SyncModalComponent {
  isOpen = input<boolean>(false);
  partnerLink = input<PartnerLink | null>(null);
  events = input<SyncEvent[]>([]);

  close = output<void>();
  triggerPartnerSync = output<void>();
  triggerMySync = output<void>();

  formatTime(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  }

  getEventText(event: SyncEvent): string {
    const payload = event.payload as { title?: string; text?: string } | undefined;
    return payload?.title || payload?.text || 'Shared an update';
  }
}

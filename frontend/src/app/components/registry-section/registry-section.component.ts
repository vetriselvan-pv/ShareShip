import { Component, computed, inject, OnInit, output, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RegistryEntry } from '../../models/gifts.models';

export type { RegistryEntry };

@Component({
  selector: 'app-registry-section',
  template: `
    <div class="flex flex-col gap-3">
      <!-- Section Title & Counter -->
      <div class="flex items-center justify-between">
        <h3 class="text-[15px] font-semibold text-[#151d1a] tracking-tight">Gift Wishlist &amp; Registry</h3>
        <span class="text-xs text-[#414844] font-medium bg-[#ecf6f0] px-2.5 py-0.5 rounded-full border border-[#dbe5df]">
          {{ filteredItems().length }} {{ filteredItems().length === 1 ? 'item' : 'items' }}
        </span>
      </div>

      <!-- Search & Filter Controls -->
      <div class="flex items-center gap-2 bg-[#ecf6f0] px-3 py-2 rounded-xl border border-[#dbe5df]/80 shadow-2xs">
        <!-- Search Icon -->
        <svg class="w-4 h-4 text-[#727974] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="11" cy="11" r="8" stroke-width="2"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65" stroke-width="2" stroke-linecap="round"/>
        </svg>

        <input
          type="text"
          [value]="searchQuery()"
          (input)="onSearchInput($event)"
          placeholder="Search friends, relatives, or gifts..."
          class="bg-transparent border-none outline-none w-full text-[13px] text-[#151d1a] placeholder-[#727974]/70 font-sans"
        />

        <!-- Filter Pill Dropdown/Toggle -->
        <button 
          type="button"
          (click)="cycleFilter()"
          class="bg-white hover:bg-[#e6f0ea] border border-[#dbe5df] px-2.5 py-1 rounded-lg text-[#151d1a] text-[12px] font-medium shadow-2xs flex items-center gap-1 flex-shrink-0 transition-colors cursor-pointer"
        >
          <!-- Filter icon -->
          <svg class="w-3.5 h-3.5 stroke-current fill-none" viewBox="0 0 24 24" stroke-width="2">
            <line x1="4" x2="20" y1="7" y2="7"/>
            <line x1="6" x2="18" y1="12" y2="12"/>
            <line x1="9" x2="15" y1="17" y2="17"/>
          </svg>
          <span>{{ currentFilter() }}</span>
        </button>
      </div>

      <!-- Registry Item Cards -->
      <div class="flex flex-col gap-2.5">
        @for (item of filteredItems(); track item.id) {
          <div class="bg-white p-3.5 rounded-2xl border border-[#dbe5df]/80 shadow-2xs flex flex-col gap-2.5 hover:border-[#adcebe] transition-colors">
            <!-- Top line: Recipient & Amount -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <!-- Initials avatar -->
                <div class="w-9 h-9 rounded-full bg-[#e6f0ea] flex items-center justify-center font-bold text-xs text-[#466557]">
                  {{ item.initials }}
                </div>
                <div class="flex flex-col text-left">
                  <h4 class="text-[14px] font-semibold text-[#151d1a] leading-tight">{{ item.recipient }}</h4>
                  <p class="text-[11.5px] text-[#414844] mt-0.5">{{ item.occasion }} @if (item.date) { • {{ item.date }} }</p>
                </div>
              </div>

              <div class="text-right">
                <span class="text-[15px] font-bold text-[#735c00]">\${{ (item.amount || 0).toFixed(2) }}</span>
                <p class="text-[11.5px] text-[#414844]">{{ item.giftType }}</p>
              </div>
            </div>

            <!-- Bottom line: Creator & Status Pill -->
            <div class="flex items-center justify-between pt-2 border-t border-[#ecf6f0]">
              <div class="flex items-center gap-1.5">
                @if (item.avatarUrl) {
                  <img 
                    class="w-4 h-4 rounded-full object-cover border border-[#dbe5df]" 
                    [src]="item.avatarUrl" 
                    [alt]="item.creator"
                  />
                } @else {
                  <div class="w-4 h-4 rounded-full bg-[#adcebe] flex items-center justify-center text-[9px] font-bold text-[#133126]">
                    {{ (item.creator || 'U').charAt(0).toUpperCase() }}
                  </div>
                }
                <span class="text-[11.5px] text-[#414844]">Added by {{ item.creator }}</span>
              </div>

              <!-- Status Tag -->
              <span 
                class="text-[11px] px-2.5 py-0.5 rounded-full font-semibold"
                [class]="item.status === 'Fulfilled' 
                  ? 'bg-[#c8ead9] text-[#012016]' 
                  : item.status === 'Pending Wrap' 
                  ? 'bg-[#fed65b] text-[#745c00]' 
                  : 'bg-[#e6f0ea] text-[#414844]'"
              >
                {{ item.status }}
              </span>
            </div>
          </div>
        } @empty {
          <div class="bg-white/60 p-6 rounded-2xl border border-dashed border-[#dbe5df] text-center flex flex-col items-center justify-center gap-1.5 text-[#727974]">
            <span class="text-2xl">🎁</span>
            <p class="text-[13px] font-medium text-[#151d1a]">No registry items yet</p>
            <p class="text-[11.5px]">Click "+ Add Gift" above to save your first shared wishlist item.</p>
          </div>
        }
      </div>
    </div>
  `
})
export class RegistrySectionComponent implements OnInit {
  private http = inject(HttpClient);
  onAddRegistryItem = output<void>();

  searchQuery = signal<string>('');
  currentFilter = signal<'All' | 'Fulfilled' | 'Pending Wrap' | 'Idea Saved'>('All');
  registryItems = signal<RegistryEntry[]>([]);

  filteredItems = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const filter = this.currentFilter();

    return this.registryItems().filter(item => {
      const matchesFilter = filter === 'All' || item.status === filter;
      const matchesSearch = !q || 
        item.recipient.toLowerCase().includes(q) || 
        item.occasion.toLowerCase().includes(q) || 
        item.giftType.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  });

  ngOnInit() {
    this.fetchRegistry();
  }

  fetchRegistry() {
    this.http.get<{ success: boolean; registry: RegistryEntry[] }>(`${environment.apiUrl}/api/calendar/registry`)
      .subscribe({
        next: (res) => {
          if (res?.registry) {
            this.registryItems.set(res.registry);
          }
        },
        error: () => {}
      });
  }

  addEntryLocally(entry: RegistryEntry) {
    this.registryItems.update(prev => [entry, ...prev]);
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  cycleFilter() {
    const filters: Array<'All' | 'Fulfilled' | 'Pending Wrap' | 'Idea Saved'> = [
      'All',
      'Fulfilled',
      'Pending Wrap',
      'Idea Saved'
    ];
    const currentIndex = filters.indexOf(this.currentFilter());
    const nextIndex = (currentIndex + 1) % filters.length;
    this.currentFilter.set(filters[nextIndex]);
  }
}

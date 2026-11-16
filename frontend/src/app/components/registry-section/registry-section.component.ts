import { Component, computed, inject, OnInit, output, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { RegistryEntry } from '../../models/gifts.models';
import { CurrencyService } from '../../services/currency.service';

export type { RegistryEntry };

export interface OccasionGroup {
  occasion: string;
  items: RegistryEntry[];
  totalCredits: number;
  totalDebits: number;
  net: number;
  count: number;
}

@Component({
  selector: 'app-registry-section',
  imports: [FormsModule],
  template: `
    <div class="flex flex-col gap-3">
      <!-- 1. Summary Metric Cards (Dynamic based on active filter) -->
      <div class="grid grid-cols-3 gap-2">
        <div class="bg-white p-2.5 rounded-2xl border border-[#dbe5df] shadow-2xs flex flex-col text-left">
          <div class="flex items-center justify-between">
            <span class="text-[10px] sm:text-[10.5px] font-medium text-[#414844]">Received</span>
            @if (hasActiveFilter()) {
              <span class="text-[9px] text-[#047857] font-semibold bg-[#c8ead9]/70 px-1 py-0.2 rounded">Filtered</span>
            }
          </div>
          <span class="text-[14px] sm:text-[15px] font-bold text-[#047857] truncate mt-0.5">
            +{{ currencyService.format(filteredCredits()) }}
          </span>
        </div>

        <div class="bg-white p-2.5 rounded-2xl border border-[#dbe5df] shadow-2xs flex flex-col text-left">
          <div class="flex items-center justify-between">
            <span class="text-[10px] sm:text-[10.5px] font-medium text-[#414844]">Given</span>
            @if (hasActiveFilter()) {
              <span class="text-[9px] text-[#b91c1c] font-semibold bg-[#fee2e2]/70 px-1 py-0.2 rounded">Filtered</span>
            }
          </div>
          <span class="text-[14px] sm:text-[15px] font-bold text-[#b91c1c] truncate mt-0.5">
            -{{ currencyService.format(filteredDebits()) }}
          </span>
        </div>

        <div class="bg-white p-2.5 rounded-2xl border border-[#dbe5df] shadow-2xs flex flex-col text-left">
          <span class="text-[10px] sm:text-[10.5px] font-medium text-[#414844]">Net</span>
          <span
            class="text-[14px] sm:text-[15px] font-bold truncate mt-0.5"
            [class]="filteredNet() >= 0 ? 'text-[#047857]' : 'text-[#b91c1c]'"
          >
            {{ filteredNet() >= 0 ? '+' : '' }}{{ currencyService.format(filteredNet()) }}
          </span>
        </div>
      </div>

      <!-- 2. Section Header & Active Count -->
      <div class="flex items-center justify-between mt-1">
        <div class="flex items-center gap-1.5">
          <h3 class="text-[15px] font-semibold text-[#151d1a] tracking-tight">Gift Entries</h3>
          @if (occasionFilter() !== 'all') {
            <span class="bg-[#e6f0ea] text-[#466557] text-[11px] font-medium px-2 py-0.5 rounded-md truncate max-w-[120px]">
              {{ occasionFilter() }}
            </span>
          }
        </div>
        <span class="text-xs text-[#414844] font-medium bg-[#ecf6f0] px-2.5 py-0.5 rounded-full border border-[#dbe5df]">
          {{ filteredItems().length }} {{ filteredItems().length === 1 ? 'record' : 'records' }}
        </span>
      </div>

      <!-- 3. Search & Dual Filter Controls (Name & Occasion) -->
      <div class="flex flex-col gap-2 bg-[#ecf6f0] p-2.5 rounded-2xl border border-[#dbe5df]/80 shadow-2xs text-left">
        <!-- Row A: Filter by Relative Name -->
        <div class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#dbe5df]">
          <svg class="w-4 h-4 text-[#727974] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <input
            type="text"
            [value]="nameFilter()"
            (input)="onNameInput($event)"
            placeholder="Filter by relative name or village..."
            class="bg-transparent border-none outline-none w-full text-[13px] text-[#151d1a] placeholder-[#727974]/70 font-sans"
          />
          @if (nameFilter()) {
            <button
              type="button"
              (click)="nameFilter.set('')"
              class="text-xs text-[#727974] hover:text-[#151d1a] px-1 cursor-pointer"
              title="Clear name filter"
            >
              ✕
            </button>
          }
        </div>

        <!-- Row B: Filter by Occasion Dropdown -->
        <div class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#dbe5df]">
          <svg class="w-4 h-4 text-[#727974] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <select
            [value]="occasionFilter()"
            (change)="onOccasionChange($event)"
            class="bg-transparent border-none outline-none w-full text-[13px] text-[#151d1a] font-sans cursor-pointer focus:ring-0"
          >
            <option value="all">Filter by Occasion: All Occasions ({{ registryItems().length }})</option>
            @for (occ of occasionsWithCounts(); track occ.name) {
              <option [value]="occ.name">{{ occ.name }} ({{ occ.count }})</option>
            }
          </select>
          @if (occasionFilter() !== 'all') {
            <button
              type="button"
              (click)="occasionFilter.set('all')"
              class="text-xs text-[#727974] hover:text-[#151d1a] px-1 cursor-pointer"
              title="Reset occasion filter"
            >
              ✕
            </button>
          }
        </div>

        <!-- Row C: Transaction Type Pills & View Mode Toggle -->
        <div class="flex items-center justify-between gap-1.5 pt-0.5">
          <!-- Type Chips: All | Credit | Debit -->
          <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              (click)="setTypeFilter('all')"
              class="px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer flex-shrink-0"
              [class]="typeFilter() === 'all'
                ? 'bg-[#466557] text-white shadow-xs'
                : 'bg-white text-[#414844] border border-[#dbe5df] hover:bg-[#e6f0ea]'"
            >
              All
            </button>

            <button
              type="button"
              (click)="setTypeFilter('credit')"
              class="px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer flex-shrink-0 flex items-center gap-0.5"
              [class]="typeFilter() === 'credit'
                ? 'bg-[#047857] text-white shadow-xs'
                : 'bg-white text-[#047857] border border-[#dbe5df] hover:bg-[#e6f0ea]'"
            >
              <span>+ Credit</span>
            </button>

            <button
              type="button"
              (click)="setTypeFilter('debit')"
              class="px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer flex-shrink-0 flex items-center gap-0.5"
              [class]="typeFilter() === 'debit'
                ? 'bg-[#b91c1c] text-white shadow-xs'
                : 'bg-white text-[#b91c1c] border border-[#dbe5df] hover:bg-[#fee2e2]'"
            >
              <span>- Debit</span>
            </button>
          </div>

          <!-- View Mode Toggle: Flat List vs Grouped By Occasion -->
          <div class="flex items-center bg-white p-0.5 rounded-lg border border-[#dbe5df] flex-shrink-0 shadow-2xs">
            <button
              type="button"
              (click)="viewMode.set('list')"
              class="px-2 py-0.5 rounded-md text-[10.5px] font-medium transition-all cursor-pointer"
              [class]="viewMode() === 'list' ? 'bg-[#466557] text-white font-semibold' : 'text-[#727974] hover:text-[#151d1a]'"
              title="Flat List View"
            >
              List
            </button>
            <button
              type="button"
              (click)="viewMode.set('by-occasion')"
              class="px-2 py-0.5 rounded-md text-[10.5px] font-medium transition-all cursor-pointer"
              [class]="viewMode() === 'by-occasion' ? 'bg-[#466557] text-white font-semibold' : 'text-[#727974] hover:text-[#151d1a]'"
              title="Grouped by Occasion"
            >
              By Occasion
            </button>
          </div>
        </div>

        <!-- Active Filter Tags (if any filter is active) -->
        @if (hasActiveFilter()) {
          <div class="flex items-center gap-1.5 flex-wrap pt-1 border-t border-[#dbe5df]/70 text-[11px]">
            <span class="text-[#727974]">Active Filters:</span>
            @if (nameFilter()) {
              <span class="inline-flex items-center gap-1 bg-white text-[#151d1a] px-2 py-0.5 rounded-full border border-[#dbe5df]">
                Name: "{{ nameFilter() }}"
                <button type="button" (click)="nameFilter.set('')" class="text-[#727974] hover:text-[#b91c1c] cursor-pointer">✕</button>
              </span>
            }
            @if (occasionFilter() !== 'all') {
              <span class="inline-flex items-center gap-1 bg-white text-[#151d1a] px-2 py-0.5 rounded-full border border-[#dbe5df]">
                Occasion: {{ occasionFilter() }}
                <button type="button" (click)="occasionFilter.set('all')" class="text-[#727974] hover:text-[#b91c1c] cursor-pointer">✕</button>
              </span>
            }
            @if (typeFilter() !== 'all') {
              <span class="inline-flex items-center gap-1 bg-white text-[#151d1a] px-2 py-0.5 rounded-full border border-[#dbe5df]">
                Type: {{ typeFilter() === 'credit' ? 'Credit' : 'Debit' }}
                <button type="button" (click)="typeFilter.set('all')" class="text-[#727974] hover:text-[#b91c1c] cursor-pointer">✕</button>
              </span>
            }
            <button
              type="button"
              (click)="resetAllFilters()"
              class="text-[#466557] font-semibold hover:underline ml-auto cursor-pointer"
            >
              Clear all
            </button>
          </div>
        }
      </div>

      <!-- 4A. VIEW MODE: GROUPED BY OCCASION -->
      @if (viewMode() === 'by-occasion') {
        <div class="flex flex-col gap-3.5">
          @for (grp of occasionGroups(); track grp.occasion) {
            <div class="bg-white rounded-2xl border border-[#dbe5df] shadow-2xs overflow-hidden text-left">
              <!-- Occasion Header Box -->
              <div class="bg-[#f0f7f3] px-3.5 py-2.5 border-b border-[#dbe5df] flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg bg-[#c8ead9] flex items-center justify-center text-xs font-bold text-[#133126]">
                    🎁
                  </div>
                  <div class="flex flex-col">
                    <h4 class="text-[14px] font-semibold text-[#151d1a] leading-tight">{{ grp.occasion }}</h4>
                    <span class="text-[11px] text-[#414844] mt-0.5">
                      {{ grp.count }} {{ grp.count === 1 ? 'gift' : 'gifts' }}
                    </span>
                  </div>
                </div>

                <!-- Group Subtotal Metrics -->
                <div class="text-right flex flex-col items-end">
                  <div class="flex items-center gap-2 text-xs font-bold">
                    @if (grp.totalCredits > 0) {
                      <span class="text-[#047857]">+{{ currencyService.format(grp.totalCredits) }}</span>
                    }
                    @if (grp.totalDebits > 0) {
                      <span class="text-[#b91c1c]">-{{ currencyService.format(grp.totalDebits) }}</span>
                    }
                  </div>
                  <span
                    class="text-[10px] font-semibold mt-0.5"
                    [class]="grp.net >= 0 ? 'text-[#047857]' : 'text-[#b91c1c]'"
                  >
                    Net: {{ grp.net >= 0 ? '+' : '' }}{{ currencyService.format(grp.net) }}
                  </span>
                </div>
              </div>

              <!-- Gift Items in this Occasion -->
              <div class="p-2.5 flex flex-col gap-2">
                @for (item of grp.items; track item.id) {
                  <div class="p-2.5 rounded-xl border border-[#e6f0ea] bg-[#fafdfb] flex flex-col gap-1.5 hover:border-[#adcebe] transition-colors">
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex items-start gap-2">
                        <div
                          class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5"
                          [class]="item.type === 'debit' ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-[#c8ead9] text-[#047857]'"
                        >
                          {{ item.initials || 'GL' }}
                        </div>
                        <div class="flex flex-col">
                          <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="text-[13.5px] font-semibold text-[#151d1a]">
                              {{ item.relativeName || item.recipient }}
                            </span>
                            @if (item.relativeVillage) {
                              <span class="text-[10px] font-medium bg-[#f0f4f2] text-[#414844] px-1.5 py-0.2 rounded-full border border-[#dbe5df]">
                                📍 {{ item.relativeVillage }}
                              </span>
                            }
                          </div>
                          @if (item.date) {
                            <span class="text-[10.5px] text-[#727974]">{{ item.date }}</span>
                          }
                        </div>
                      </div>

                      <div class="text-right flex flex-col items-end flex-shrink-0">
                        <span
                          class="text-[14px] font-bold tracking-tight"
                          [class]="item.type === 'debit' ? 'text-[#b91c1c]' : 'text-[#047857]'"
                        >
                          {{ item.type === 'debit' ? '-' : '+' }}{{ currencyService.format(item.amount || 0) }}
                        </span>
                        <span
                          class="text-[9.5px] font-semibold px-1.5 py-0.2 rounded-full mt-0.5"
                          [class]="item.type === 'debit' ? 'bg-[#fee2e2] text-[#7f1d1d]' : 'bg-[#c8ead9] text-[#012016]'"
                        >
                          {{ item.type === 'debit' ? 'Debit' : 'Credit' }}
                        </span>
                      </div>
                    </div>

                    @if (item.notes) {
                      <div class="bg-white px-2 py-1 rounded-lg border border-[#e6f0ea] text-[11px] text-[#414844] italic">
                        Note: {{ item.notes }}
                      </div>
                    }

                    <div class="flex items-center justify-between pt-1 border-t border-[#f0f4f2] text-[10.5px] text-[#727974]">
                      <span>By {{ item.creator || 'You' }}</span>
                      <button
                        type="button"
                        (click)="deleteItem(item.id)"
                        class="text-[#9aa29e] hover:text-[#b91c1c] transition-colors px-1 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          } @empty {
            <div class="bg-white/60 p-6 rounded-2xl border border-dashed border-[#dbe5df] text-center flex flex-col items-center justify-center gap-2 text-[#727974]">
              <div class="w-12 h-12 rounded-2xl bg-[#c8ead9] flex items-center justify-center shadow-2xs">
                <img src="icons/gift.svg" class="w-7 h-7 object-contain" alt="Gift" />
              </div>
              <p class="text-[13px] font-semibold text-[#151d1a]">No gifts match your filter</p>
              <p class="text-[11.5px] max-w-[240px]">
                Try adjusting the Name or Occasion filters above.
              </p>
            </div>
          }
        </div>
      }

      <!-- 4B. VIEW MODE: FLAT LIST -->
      @if (viewMode() === 'list') {
        <div class="flex flex-col gap-2.5">
          @for (item of filteredItems(); track item.id) {
            <div class="bg-white p-3.5 rounded-2xl border border-[#dbe5df]/80 shadow-2xs flex flex-col gap-2 hover:border-[#adcebe] transition-colors text-left">
              <!-- Row 1: Relative & Amount -->
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-start gap-2.5">
                  <!-- Initials avatar -->
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5"
                    [class]="item.type === 'debit' ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-[#c8ead9] text-[#047857]'"
                  >
                    {{ item.initials || 'GL' }}
                  </div>

                  <div class="flex flex-col">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <h4 class="text-[14px] font-semibold text-[#151d1a] leading-snug">
                        {{ item.relativeName || item.recipient }}
                      </h4>
                      @if (item.relativeVillage) {
                        <span class="inline-flex items-center gap-0.5 bg-[#f0f4f2] text-[#414844] text-[10.5px] font-medium px-2 py-0.5 rounded-full border border-[#dbe5df]">
                          <span>📍</span>
                          <span>{{ item.relativeVillage }}</span>
                        </span>
                      }
                    </div>

                    <!-- Occasion Tag (Clickable to filter by this occasion) -->
                    <div class="flex items-center gap-1.5 text-[11.5px] text-[#414844] mt-0.5 flex-wrap">
                      <button
                        type="button"
                        (click)="filterByOccasion(item.occasion)"
                        class="font-medium text-[#466557] hover:underline cursor-pointer bg-[#f0f7f3] px-1.5 py-0.2 rounded"
                        title="Filter gifts for this occasion"
                      >
                        {{ item.occasion }}
                      </button>
                      @if (item.date) {
                        <span>•</span>
                        <span>{{ item.date }}</span>
                      }
                    </div>
                  </div>
                </div>

                <!-- Amount & Type Badge -->
                <div class="text-right flex flex-col items-end flex-shrink-0">
                  <span
                    class="text-[15px] sm:text-[16px] font-bold tracking-tight"
                    [class]="item.type === 'debit' ? 'text-[#b91c1c]' : 'text-[#047857]'"
                  >
                    {{ item.type === 'debit' ? '-' : '+' }}{{ currencyService.format(item.amount || 0) }}
                  </span>
                  <span
                    class="text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5"
                    [class]="item.type === 'debit' ? 'bg-[#fee2e2] text-[#7f1d1d]' : 'bg-[#c8ead9] text-[#012016]'"
                  >
                    {{ item.type === 'debit' ? 'Debit (Given)' : 'Credit (Received)' }}
                  </span>
                </div>
              </div>

              <!-- Row 2: Notes (if present) -->
              @if (item.notes) {
                <div class="bg-[#f7faf8] px-3 py-1.5 rounded-xl border border-[#e6f0ea] flex items-start gap-1.5 text-xs text-[#414844]">
                  <span class="text-[#727974] flex-shrink-0 font-medium">Note:</span>
                  <span class="italic text-[#151d1a]">{{ item.notes }}</span>
                </div>
              }

              <!-- Row 3: Added by footer -->
              <div class="flex items-center justify-between pt-2 border-t border-[#f0f4f2] text-[11px] text-[#727974]">
                <span>Recorded by {{ item.creator || 'You' }}</span>
                <button
                  type="button"
                  (click)="deleteItem(item.id)"
                  class="text-[#9aa29e] hover:text-[#b91c1c] transition-colors px-1 cursor-pointer"
                  title="Delete entry"
                >
                  Delete
                </button>
              </div>
            </div>
          } @empty {
            <div class="bg-white/60 p-6 rounded-2xl border border-dashed border-[#dbe5df] text-center flex flex-col items-center justify-center gap-2 text-[#727974]">
              <div class="w-12 h-12 rounded-2xl bg-[#c8ead9] flex items-center justify-center shadow-2xs">
                <img src="icons/gift.svg" class="w-7 h-7 object-contain" alt="Gift" />
              </div>
              <p class="text-[13px] font-semibold text-[#151d1a]">No gifts match your filter</p>
              <p class="text-[11.5px] max-w-[240px]">
                Try adjusting the Name or Occasion filters above.
              </p>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class RegistrySectionComponent implements OnInit {
  private http = inject(HttpClient);
  readonly currencyService = inject(CurrencyService);
  onAddRegistryItem = output<void>();

  // Filter signals
  nameFilter = signal<string>('');
  occasionFilter = signal<string>('all');
  typeFilter = signal<'all' | 'credit' | 'debit'>('all');
  viewMode = signal<'list' | 'by-occasion'>('list');

  registryItems = signal<RegistryEntry[]>([]);

  // Distinct Occasions with counts from current records
  readonly occasionsWithCounts = computed<{ name: string; count: number }[]>(() => {
    const map = new Map<string, number>();
    this.registryItems().forEach(item => {
      const occ = (item.occasion && item.occasion.trim()) || 'General Celebration';
      map.set(occ, (map.get(occ) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  // True if any filter is active
  readonly hasActiveFilter = computed(() => {
    return this.nameFilter().trim().length > 0 ||
      this.occasionFilter() !== 'all' ||
      this.typeFilter() !== 'all';
  });

  // Filtered gift list matching name, occasion, and type filters
  readonly filteredItems = computed(() => {
    const nameQ = this.nameFilter().toLowerCase().trim();
    const occasionQ = this.occasionFilter();
    const type = this.typeFilter();

    return this.registryItems().filter(item => {
      // 1. Type filter
      const itemType = item.type || 'credit';
      if (type !== 'all' && itemType !== type) return false;

      // 2. Occasion filter
      if (occasionQ !== 'all') {
        const itemOcc = (item.occasion && item.occasion.trim()) || 'General Celebration';
        if (itemOcc.toLowerCase() !== occasionQ.toLowerCase()) return false;
      }

      // 3. Name filter (matches relativeName, recipient, or relativeVillage)
      if (nameQ) {
        const matchName = (item.relativeName && item.relativeName.toLowerCase().includes(nameQ)) ||
          (item.recipient && item.recipient.toLowerCase().includes(nameQ));
        const matchVillage = item.relativeVillage && item.relativeVillage.toLowerCase().includes(nameQ);
        if (!matchName && !matchVillage) return false;
      }

      return true;
    });
  });

  // Dynamic totals based on current filtered view
  readonly filteredCredits = computed(() => {
    return this.filteredItems()
      .filter(i => (i.type || 'credit') === 'credit')
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  });

  readonly filteredDebits = computed(() => {
    return this.filteredItems()
      .filter(i => i.type === 'debit')
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  });

  readonly filteredNet = computed(() => {
    return this.filteredCredits() - this.filteredDebits();
  });

  readonly totalCredits = computed(() => {
    return this.registryItems()
      .filter(i => (i.type || 'credit') === 'credit')
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  });

  readonly totalDebits = computed(() => {
    return this.registryItems()
      .filter(i => i.type === 'debit')
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  });

  // Grouped items by occasion (for By Occasion view mode)
  readonly occasionGroups = computed<OccasionGroup[]>(() => {
    const items = this.filteredItems();
    const map = new Map<string, RegistryEntry[]>();

    items.forEach(item => {
      const occ = (item.occasion && item.occasion.trim()) || 'General Celebration';
      if (!map.has(occ)) {
        map.set(occ, []);
      }
      map.get(occ)!.push(item);
    });

    const groups: OccasionGroup[] = [];
    map.forEach((groupItems, occasion) => {
      const totalCredits = groupItems
        .filter(i => (i.type || 'credit') === 'credit')
        .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      const totalDebits = groupItems
        .filter(i => i.type === 'debit')
        .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

      groups.push({
        occasion,
        items: groupItems,
        totalCredits,
        totalDebits,
        net: totalCredits - totalDebits,
        count: groupItems.length
      });
    });

    // Sort by largest group first
    return groups.sort((a, b) => b.count - a.count);
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

  deleteItem(id: string) {
    if (!id) return;
    this.http.delete(`${environment.apiUrl}/api/calendar/registry/${encodeURIComponent(id)}`)
      .subscribe({
        next: () => {
          this.registryItems.update(prev => prev.filter(i => i.id !== id));
        },
        error: () => {
          // If offline, still delete locally
          this.registryItems.update(prev => prev.filter(i => i.id !== id));
        }
      });
  }

  onNameInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.nameFilter.set(target.value);
  }

  onOccasionChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.occasionFilter.set(target.value);
  }

  filterByOccasion(occasion: string) {
    if (occasion) {
      this.occasionFilter.set(occasion);
    }
  }

  setTypeFilter(type: 'all' | 'credit' | 'debit') {
    this.typeFilter.set(type);
  }

  resetAllFilters() {
    this.nameFilter.set('');
    this.occasionFilter.set('all');
    this.typeFilter.set('all');
  }
}

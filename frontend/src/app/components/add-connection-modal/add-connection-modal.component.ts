import { Component, input, output, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConnectionService } from '../../services/connection.service';
import { SearchedUser } from '../../models/connection.models';

@Component({
  selector: 'app-add-connection-modal',
  imports: [FormsModule],
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-connection-title"
      >
        <div
          class="w-full max-w-sm bg-[#f2fcf5] rounded-3xl border border-[#dbe5df] shadow-2xl p-4 flex flex-col gap-4 text-left max-h-[90vh] overflow-hidden"
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-2 border-b border-[#dbe5df]">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-2xl bg-[#adcebe] text-[#133126] flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </div>
              <div>
                <h3 id="add-connection-title" class="text-[17px] font-semibold text-[#151d1a]">
                  Add Partner
                </h3>
                <p class="text-[11.5px] text-[#414844]">Search user by Name or User ID</p>
              </div>
            </div>
            <button
              type="button"
              (click)="handleClose()"
              aria-label="Close modal"
              class="w-7 h-7 rounded-full bg-[#e6f0ea] flex items-center justify-center text-[#414844] hover:bg-[#dbe5df] transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Current Partner Badge if already connected -->
          @if (connectionService.activePartner(); as partner) {
            <div class="p-3 rounded-2xl bg-[#ecf6f0] border border-[#adcebe] flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-[#466557] text-white flex items-center justify-center font-bold text-sm">
                {{ partner.name.charAt(0).toUpperCase() }}
              </div>
              <div class="flex flex-col flex-1">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-semibold text-[#151d1a]">{{ partner.name }}</span>
                  <span class="bg-[#c8ead9] text-[#012016] text-[10px] px-1.5 py-0.2 rounded-full font-bold">Connected</span>
                </div>
                <span class="text-[11px] text-[#727974]">&#64;{{ partner.userId }}</span>
              </div>
            </div>
          }

          <!-- Search Input Field -->
          <div class="flex flex-col gap-1.5">
            <label for="partner-search-input" class="text-[12px] font-medium text-[#151d1a]">
              Search Partner
            </label>
            <div
              class="relative flex items-center bg-[#ecf6f0] border border-[#dbe5df] focus-within:border-[#466557] focus-within:ring-2 focus-within:ring-[#466557]/15 rounded-xl overflow-hidden px-3 py-2 transition-all"
            >
              <svg class="w-4 h-4 text-[#727974] mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                id="partner-search-input"
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange($event)"
                name="searchQuery"
                placeholder="Type name or User ID..."
                autocomplete="off"
                class="w-full bg-transparent text-[13px] text-[#151d1a] placeholder-[#94938f] focus:outline-none"
              />
              @if (connectionService.isSearching()) {
                <svg class="animate-spin h-3.5 w-3.5 text-[#466557] ml-1 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
              } @else if (searchQuery.trim()) {
                <button
                  type="button"
                  (click)="clearSearch()"
                  class="text-[#727974] hover:text-[#151d1a] text-xs cursor-pointer ml-1"
                >
                  ✕
                </button>
              }
            </div>
          </div>

          <!-- Feedback Toast Message -->
          @if (feedbackMessage()) {
            <div
              class="p-2.5 rounded-xl text-xs font-semibold text-center border transition-all"
              [class]="
                isSuccess()
                  ? 'bg-[#c8ead9] border-[#adcebe] text-[#012016]'
                  : 'bg-[#ffdad6] border-[#ffb4ab] text-[#93000a]'
              "
            >
              {{ feedbackMessage() }}
            </div>
          }

          <!-- Search Results Container -->
          <div class="flex flex-col gap-2 overflow-y-auto max-h-[220px] pr-1">
            @if (searchResults().length > 0) {
              <div class="text-[11px] font-semibold text-[#727974] px-1 uppercase tracking-wider">
                Matching Users ({{ searchResults().length }})
              </div>

              @for (user of searchResults(); track user.userId) {
                <div
                  class="p-2.5 rounded-2xl bg-white/80 hover:bg-white border border-[#dbe5df] hover:border-[#adcebe] flex items-center justify-between gap-2.5 transition-all shadow-2xs"
                >
                  <!-- Avatar + Info -->
                  <div class="flex items-center gap-2.5 min-w-0 flex-1">
                    @if (user.avatarUrl) {
                      <img
                        [src]="user.avatarUrl"
                        alt="Avatar"
                        class="w-9 h-9 rounded-full object-cover border border-[#dbe5df] flex-shrink-0"
                      />
                    } @else {
                      <div
                        class="w-9 h-9 rounded-full bg-[#adcebe] text-[#133126] flex items-center justify-center font-bold text-xs flex-shrink-0"
                      >
                        {{ (user.name || user.userId).charAt(0).toUpperCase() }}
                      </div>
                    }

                    <div class="flex flex-col min-w-0">
                      <span class="text-[13px] font-semibold text-[#151d1a] truncate leading-tight">
                        {{ user.name }}
                      </span>
                      <span class="text-[11px] text-[#727974] truncate">
                        &#64;{{ user.userId }}
                      </span>
                    </div>
                  </div>

                  <!-- Action / Status Button -->
                  @if (user.status === 'connected') {
                    <span
                      class="px-2.5 py-1 rounded-xl bg-[#c8ead9] text-[#012016] text-[11px] font-bold flex-shrink-0"
                    >
                      Connected ✓
                    </span>
                  } @else if (user.status === 'pending') {
                    <span
                      class="px-2.5 py-1 rounded-xl bg-[#fef0cb] text-[#6d4f00] text-[11px] font-semibold flex-shrink-0"
                    >
                      Pending ⏳
                    </span>
                  } @else {
                    <button
                      type="button"
                      [disabled]="connectionService.isSending()"
                      (click)="handleSendRequestTo(user)"
                      class="px-3 py-1.5 rounded-xl bg-[#466557] hover:bg-[#395347] active:scale-95 text-white text-xs font-semibold transition-all shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50 flex-shrink-0"
                    >
                      <span>Connect</span>
                      <span>+</span>
                    </button>
                  }
                </div>
              }
            } @else if (hasSearched() && searchQuery.trim()) {
              <div class="text-center py-4 px-2 flex flex-col items-center gap-2 bg-[#ecf6f0]/50 rounded-2xl border border-dashed border-[#dbe5df]">
                <span class="text-xl">🔍</span>
                <p class="text-xs text-[#414844]">
                  No registered users found matching "<span class="font-semibold text-[#151d1a]">&#64;{{ searchQuery.trim() }}</span>"
                </p>
                <!-- Direct Request Fallback -->
                <button
                  type="button"
                  [disabled]="connectionService.isSending()"
                  (click)="handleSendDirectRequest()"
                  class="mt-1 px-3 py-1.5 rounded-xl bg-[#466557] hover:bg-[#395347] text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Send invite directly to &#64;{{ searchQuery.trim() }}
                </button>
              </div>
            } @else {
              <!-- Empty state helper -->
              <div class="text-center py-5 px-3 flex flex-col items-center gap-1.5 text-[#727974]">
                <div class="w-10 h-10 rounded-full bg-[#e6f0ea] flex items-center justify-center text-[#466557] mb-1">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <p class="text-[12px] font-medium text-[#151d1a]">Find your partner</p>
                <p class="text-[11px] leading-relaxed">
                  Start typing to search existing users in Shareship or enter their exact handle.
                </p>
              </div>
            }
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-end pt-2 border-t border-[#dbe5df]">
            <button
              type="button"
              (click)="handleClose()"
              class="px-4 py-2 rounded-xl bg-[#e6f0ea] hover:bg-[#dbe5df] text-[#151d1a] font-medium text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class AddConnectionModalComponent {
  connectionService = inject(ConnectionService);

  readonly isOpen = input<boolean>(false);
  readonly close = output<void>();
  readonly requestSent = output<string>();

  searchQuery = '';
  searchResults = signal<SearchedUser[]>([]);
  hasSearched = signal<boolean>(false);
  feedbackMessage = signal<string | null>(null);
  isSuccess = signal<boolean>(false);

  private debounceTimer: ReturnType<typeof setTimeout> | undefined = undefined;

  onSearchChange(query: string) {
    clearTimeout(this.debounceTimer);
    const clean = (query || '').trim();

    if (!clean) {
      this.searchResults.set([]);
      this.hasSearched.set(false);
      return;
    }

    this.debounceTimer = setTimeout(async () => {
      const results = await this.connectionService.searchUsers(clean);
      this.searchResults.set(results);
      this.hasSearched.set(true);
    }, 250);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults.set([]);
    this.hasSearched.set(false);
  }

  handleClose() {
    this.clearSearch();
    this.feedbackMessage.set(null);
    this.close.emit();
  }

  async handleSendRequestTo(user: SearchedUser) {
    this.feedbackMessage.set(null);
    const result = await this.connectionService.sendConnectionRequest(user.userId);

    if (result.success) {
      this.isSuccess.set(true);
      this.feedbackMessage.set(result.message || `✓ Connection request sent to ${user.name} (@${user.userId})!`);
      this.requestSent.emit(user.userId);

      // Optimistically update status in results
      this.searchResults.update(list =>
        list.map(u => (u.userId === user.userId ? { ...u, status: 'pending' as const } : u))
      );

      setTimeout(() => {
        this.handleClose();
      }, 1500);
    } else {
      this.isSuccess.set(false);
      this.feedbackMessage.set(result.error || 'Failed to send request.');
    }
  }

  async handleSendDirectRequest() {
    const clean = this.searchQuery.trim().replace(/^@+/, '');
    if (!clean) return;

    this.feedbackMessage.set(null);
    const result = await this.connectionService.sendConnectionRequest(clean);

    if (result.success) {
      this.isSuccess.set(true);
      this.feedbackMessage.set(result.message || `✓ Connection request sent to @${clean}!`);
      this.requestSent.emit(clean);
      setTimeout(() => {
        this.handleClose();
      }, 1500);
    } else {
      this.isSuccess.set(false);
      this.feedbackMessage.set(result.error || 'Failed to send request.');
    }
  }
}


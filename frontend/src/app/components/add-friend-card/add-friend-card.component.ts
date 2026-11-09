import { Component, output, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface UserSearchResult {
  userId: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
}

@Component({
  selector: 'app-add-friend-card',
  imports: [FormsModule],
  template: `
    <div class="relative overflow-hidden bg-[#e6f0ea] rounded-2xl p-4 sm:p-5 shadow-xs border border-[#dbe5df]/60 flex flex-col gap-3.5 select-none">
      <!-- Decorative background accent circle -->
      <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-[#466557]/10 rounded-full pointer-events-none"></div>

      <!-- Header: Person Add Badge + Title & Subtitle -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-[#7a9a8b] text-[#133126] flex items-center justify-center flex-shrink-0 shadow-2xs">
          <!-- Person Add Icon -->
          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        <div class="flex flex-col text-left">
          <h2 class="text-[16px] font-semibold text-[#151d1a] tracking-tight leading-tight">
            Find &amp; Add Friend
          </h2>
          <p class="text-[12.5px] text-[#414844] font-normal leading-snug mt-0.5">
            Search by User ID to send a friend request
          </p>
        </div>
      </div>

      <!-- Search Input Bar & Action Button -->
      <div class="flex items-center gap-2 relative z-10">
        <div class="flex-1 bg-[#ffffff] rounded-xl px-3.5 py-2.5 flex items-center gap-2 shadow-2xs border border-[#dbe5df]/60 focus-within:border-[#466557] focus-within:ring-2 focus-within:ring-[#466557]/15 transition-all">
          <span class="text-[#727974] text-base font-semibold select-none">@</span>
          <input
            type="text"
            id="input-friend-search-userid"
            [(ngModel)]="searchQuery"
            (input)="onSearchInput()"
            (keydown.enter)="executeSearch()"
            placeholder="Search User ID (e.g. marcus_v)..."
            class="w-full bg-transparent text-[13.5px] text-[#151d1a] placeholder:text-[#727974] focus:outline-none"
          />
          @if (searchQuery()) {
            <button
              type="button"
              (click)="clearSearch()"
              class="text-[#94938f] hover:text-[#151d1a] text-xs font-semibold px-1 cursor-pointer"
            >
              ✕
            </button>
          }
        </div>

        <button
          type="button"
          id="btn-search-user"
          (click)="executeSearch()"
          [disabled]="isSearching()"
          class="bg-[#466557] hover:bg-[#395347] active:scale-[0.98] disabled:opacity-70 text-[#ffffff] font-medium text-[13px] py-2.5 px-3.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
        >
          @if (isSearching()) {
            <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
          } @else {
            <svg class="w-4 h-4 fill-none stroke-current" stroke-width="2.2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
            <span>Search</span>
          }
        </button>
      </div>

      <!-- Search Results Preview Section -->
      @if (hasSearched()) {
        <div class="relative z-10 flex flex-col gap-2 pt-1 border-t border-[#dbe5df]/70">
          @if (searchResults().length > 0) {
            <div class="text-[11.5px] font-semibold text-[#4e5b54] uppercase tracking-wider px-1 text-left">
              Matching Users ({{ searchResults().length }})
            </div>

            <div class="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-0.5">
              @for (user of searchResults(); track user.userId) {
                <div class="bg-[#ffffff] rounded-xl p-2.5 flex items-center justify-between gap-2.5 shadow-2xs border border-[#e2ece5] hover:border-[#b4cfc1] transition-all">
                  <!-- User Info -->
                  <div class="flex items-center gap-2.5 min-w-0">
                    @if (user.avatarUrl) {
                      <img
                        [src]="user.avatarUrl"
                        [alt]="user.name"
                        (error)="handleAvatarError(user)"
                        class="w-9 h-9 rounded-full object-cover bg-[#dbe5df] flex-shrink-0"
                      />
                    } @else {
                      <div class="w-9 h-9 rounded-full bg-[#7a9a8b] text-[#133126] flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                        {{ user.name.charAt(0).toUpperCase() || 'U' }}
                      </div>
                    }
                    <div class="flex flex-col min-w-0 text-left">
                      <span class="text-[13px] font-semibold text-[#151d1a] truncate leading-tight">
                        {{ user.name }}
                      </span>
                      <span class="text-[11.5px] text-[#466557] font-medium truncate leading-tight">
                        &#64;{{ user.userId }}
                      </span>
                    </div>
                  </div>

                  <!-- Send Friend Request Button -->
                  <button
                    type="button"
                    [id]="'btn-send-req-' + user.userId"
                    (click)="sendFriendRequestTo(user)"
                    [disabled]="isSent(user.userId) || isSubmitting()"
                    class="flex-shrink-0 text-[12px] font-medium py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-default"
                    [class]="isSent(user.userId) 
                      ? 'bg-[#c8ead9] text-[#012016] border border-[#adcebe]' 
                      : 'bg-[#466557] hover:bg-[#395347] active:scale-95 text-white shadow-2xs'"
                  >
                    @if (isSent(user.userId)) {
                      <span>✓ Sent</span>
                    } @else {
                      <svg class="w-3.5 h-3.5 fill-current rotate-45 -mt-0.5" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                      </svg>
                      <span>Add</span>
                    }
                  </button>
                </div>
              }
            </div>
          } @else {
            <!-- No Match Found -->
            <div class="bg-[#ffffff]/80 rounded-xl p-3 flex flex-col items-center text-center gap-2 border border-dashed border-[#c1d1c8]">
              <span class="text-[12.5px] text-[#5b6560]">
                No registered user found for <span class="font-semibold text-[#151d1a]">&#64;{{ lastSearchTerm() }}</span>
              </span>
              <button
                type="button"
                id="btn-direct-invite"
                (click)="sendDirectRequest(lastSearchTerm())"
                [disabled]="isSent(lastSearchTerm()) || isSubmitting()"
                class="text-[12px] font-medium py-1.5 px-3.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                [class]="isSent(lastSearchTerm()) 
                  ? 'bg-[#c8ead9] text-[#012016] border border-[#adcebe]' 
                  : 'bg-[#59786a] hover:bg-[#466557] text-white shadow-2xs'"
              >
                @if (isSent(lastSearchTerm())) {
                  <span>✓ Invite Sent</span>
                } @else {
                  <span>Send Direct Invite to &#64;{{ lastSearchTerm() }}</span>
                }
              </button>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class AddFriendCardComponent {
  private http = inject(HttpClient);

  sendRequest = output<string>();

  searchQuery = signal<string>('');
  isSearching = signal<boolean>(false);
  hasSearched = signal<boolean>(false);
  lastSearchTerm = signal<string>('');
  searchResults = signal<UserSearchResult[]>([]);
  sentUserIds = signal<Set<string>>(new Set());
  isSubmitting = signal<boolean>(false);

  private debounceTimer: ReturnType<typeof setTimeout> | undefined = undefined;

  onSearchInput() {
    clearTimeout(this.debounceTimer);
    const q = this.searchQuery().trim();
    if (q.length >= 2) {
      this.debounceTimer = setTimeout(() => {
        this.executeSearch();
      }, 350);
    } else if (q.length === 0) {
      this.hasSearched.set(false);
      this.searchResults.set([]);
    }
  }

  executeSearch() {
    const rawTerm = this.searchQuery().trim().replace(/^@+/, '');
    if (!rawTerm) return;

    this.isSearching.set(true);
    this.lastSearchTerm.set(rawTerm);

    this.http.get<{ success: boolean; users: UserSearchResult[] }>(`${environment.apiUrl}/api/users/search?userId=${encodeURIComponent(rawTerm)}`)
      .subscribe({
        next: (res) => {
          this.searchResults.set(res?.users || []);
          this.hasSearched.set(true);
          this.isSearching.set(false);
        },
        error: () => {
          this.searchResults.set([]);
          this.hasSearched.set(true);
          this.isSearching.set(false);
        }
      });
  }

  sendFriendRequestTo(user: UserSearchResult) {
    this.sentUserIds.update(set => new Set(set).add(user.userId));
    this.sendRequest.emit(user.userId);
  }

  sendDirectRequest(userId: string) {
    if (!userId) return;
    this.sentUserIds.update(set => new Set(set).add(userId));
    this.sendRequest.emit(userId);
  }

  isSent(userId: string): boolean {
    return this.sentUserIds().has(userId);
  }

  clearSearch() {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.hasSearched.set(false);
  }

  handleAvatarError(user: UserSearchResult) {
    user.avatarUrl = '';
  }
}

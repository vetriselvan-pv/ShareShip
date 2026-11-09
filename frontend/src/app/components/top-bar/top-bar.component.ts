import { Component, input, output, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AddConnectionModalComponent } from '../add-connection-modal/add-connection-modal.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-top-bar',
  imports: [CommonModule, AddConnectionModalComponent],
  template: `
    <header
      class="w-full max-w-[390px] mx-auto flex items-center justify-between px-4 pt-2.5 pb-1 select-none safe-top box-border transition-all"
      style="view-transition-name: persistent-top-bar;"
    >
      <!-- Left: Logo & Synced Status Badge -->
      <div class="flex items-center gap-3">
        <!-- Brand Mark & Logo -->
        <div class="flex items-center gap-2 cursor-pointer group" (click)="onLogoClick.emit()">
          <img
            src="Shareship_logo.svg"
            alt="Shareship Logo"
            class="w-7 h-7 object-contain group-hover:scale-105 transition-transform duration-200 "
          />
        </div>
      </div>

      <!-- Right: Add Person, Notification Bell & User Avatar -->
      <div class="flex items-center gap-2 sm:gap-2.5">
        <!-- Add Partner Connection Icon (before alert icon) -->
        <button
          type="button"
          id="top-bar-add-connection-btn"
          (click)="isAddConnectionOpen.set(true); onAddPersonClick.emit()"
          class="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#e6f0ea] transition-colors text-[#151d1a] cursor-pointer"
          title="Connect with Partner"
          aria-label="Add Partner Connection"
        >
          <svg
            class="w-5 h-5 fill-none stroke-current"
            viewBox="0 0 24 24"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </button>

        <!-- Notification Bell (Alert Icon) -->
        <button
          (click)="onNotificationClick.emit()"
          class="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#e6f0ea] transition-colors text-[#151d1a]"
          aria-label="Notifications"
        >
          <svg
            class="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          @if (unreadCount() > 0) {
            <span
              class="absolute top-1.5 right-1.5 w-2 h-2 bg-[#fed65b] rounded-full ring-2 ring-[#f2fcf5]"
            ></span>
          }
        </button>

        <!-- User Profile Avatar with Golden/Sage Ring -->
        <div
          (click)="handleProfileClick()"
          class="cursor-pointer relative p-[2px] rounded-full bg-gradient-to-tr from-[#7a9a8b] via-[#fed65b] to-[#466557] hover:scale-105 transition-transform"
          title="Account & Profile Settings"
        >
          @if (currentUserAvatar()) {
            <img
              [src]="currentUserAvatar()"
              alt="Profile"
              class="w-8 h-8 rounded-full object-cover border border-[#f2fcf5]"
            />
          } @else {
            <div
              class="w-8 h-8 rounded-full bg-[#466557] text-white flex items-center justify-center font-bold text-xs border border-[#f2fcf5]"
            >
              {{ (currentUserName() || 'U').charAt(0).toUpperCase() }}
            </div>
          }
        </div>
      </div>
    </header>

    <!-- Partner Connection Modal -->
    <app-add-connection-modal
      [isOpen]="isAddConnectionOpen()"
      (close)="isAddConnectionOpen.set(false)"
    />

    <!-- User Profile & Logout Popup Modal -->
    @if (isProfileMenuOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        <div
          class="w-full max-w-xs bg-[#f2fcf5] rounded-3xl border border-[#dbe5df] shadow-2xl p-5 flex flex-col gap-4 text-left"
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-2 border-b border-[#dbe5df]">
            <h3 id="profile-modal-title" class="text-[16px] font-semibold text-[#151d1a]">
              My Account
            </h3>
            <button
              type="button"
              (click)="isProfileMenuOpen.set(false)"
              aria-label="Close profile menu"
              class="w-7 h-7 rounded-full bg-[#e6f0ea] flex items-center justify-center text-[#414844] hover:bg-[#dbe5df] transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- User Details Card -->
          <div class="flex items-center gap-3.5 p-3 rounded-2xl bg-[#e6f0ea]/70 border border-[#dbe5df]/60">
            <div class="relative p-[2px] rounded-full bg-gradient-to-tr from-[#7a9a8b] via-[#fed65b] to-[#466557] shrink-0">
              @if (currentUserAvatar()) {
                <img
                  [src]="currentUserAvatar()"
                  alt="Avatar"
                  class="w-11 h-11 rounded-full object-cover border border-[#f2fcf5]"
                />
              } @else {
                <div class="w-11 h-11 rounded-full bg-[#466557] text-white flex items-center justify-center font-bold text-sm border border-[#f2fcf5]">
                  {{ (currentUserName() || 'U').charAt(0).toUpperCase() }}
                </div>
              }
            </div>

            <div class="flex flex-col min-w-0">
              <span class="text-[14.5px] font-semibold text-[#151d1a] truncate leading-tight">
                {{ currentUserName() }}
              </span>
              <span class="text-[12px] text-[#55605b] font-medium truncate mt-0.5">
                &#64;{{ currentUserId() }}
              </span>
              <div class="flex items-center gap-1.5 mt-1">
                <span class="w-2 h-2 rounded-full bg-[#52b788] live-pulse"></span>
                <span class="text-[11px] text-[#466557] font-medium">Active Session</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col gap-2 pt-1">
            <!-- Logout Option Button -->
            <button
              type="button"
              (click)="handleLogout()"
              id="profile-logout-btn"
              class="w-full py-2.5 px-3 rounded-2xl bg-[#ffdad6] hover:bg-[#ffb4ab] active:scale-[0.99] text-[#ba1a1a] font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <svg
                class="w-4 h-4 fill-none stroke-current"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Log Out</span>
            </button>

            <!-- Cancel Button -->
            <button
              type="button"
              (click)="isProfileMenuOpen.set(false)"
              class="w-full py-2 px-3 rounded-2xl bg-[#e6f0ea] hover:bg-[#dbe5df] text-[#151d1a] font-medium text-xs transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class TopBarComponent {
  authService = inject(AuthService);
  router = inject(Router);

  avatarUrl = input<string>('');
  isLiveSync = input<boolean>(true);
  unreadCount = input<number>(0);

  onLogoClick = output<void>();
  onStatusClick = output<void>();
  onNotificationClick = output<void>();
  onProfileClick = output<void>();
  onAddPersonClick = output<void>();

  isAddConnectionOpen = signal<boolean>(false);
  isProfileMenuOpen = signal<boolean>(false);

  currentUserName = computed(() => this.authService.currentUser()?.name || 'User');
  currentUserId = computed(() => this.authService.getCurrentUserId());
  currentUserAvatar = computed(() => this.authService.currentUser()?.avatarUrl || this.avatarUrl() || '');

  handleProfileClick() {
    this.isProfileMenuOpen.set(true);
    this.onProfileClick.emit();
  }

  handleLogout() {
    this.isProfileMenuOpen.set(false);
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}


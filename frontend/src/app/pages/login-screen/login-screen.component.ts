import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormInputComponent } from '../../components/form-input/form-input.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-screen',
  imports: [FormsModule, FormInputComponent],
  template: `
    <main
      class="min-h-screen bg-[#f2fcf5] text-[#151d1a] flex flex-col items-center justify-center px-4 py-6 selection:bg-[#adcebe] selection:text-[#133126] font-sans"
    >
      <!-- Main Center Content Container -->
      <div class="w-full max-w-[390px] mx-auto flex flex-col items-center">
        <!-- Hero & Welcome Section -->
        <section class="flex flex-col items-center text-center mb-5">
          <!-- Shareship App Icon -->
          <div
            class="w-20 h-20 rounded-3xl bg-white flex items-center justify-center p-3 shadow-[0_4px_20px_rgba(70,101,87,0.18)] border border-[#dbe5df] mb-3.5 hover:scale-105 transition-transform duration-200"
          >
            <img
              src="Shareship_logo.svg"
              alt="Shareship App Icon"
              class="w-full h-full object-contain rounded-2xl"
            />
          </div>

          <!-- Headline -->
          <h1 class="text-[24px] font-semibold text-[#151d1a] tracking-tight leading-tight">
            {{
              mode() === 'login'
                ? 'Welcome to Shareship'
                : mode() === 'register'
                  ? 'Create User Profile'
                  : 'Reset Password'
            }}
          </h1>

          <!-- Subtitle -->
          <p class="text-[13px] text-[#414844] mt-1.5 max-w-[290px] leading-relaxed font-normal">
            {{
              mode() === 'login'
                ? 'Your shared calendar, expenses, and memories, beautifully synchronized.'
                : mode() === 'register'
                  ? 'Create your unique User ID to connect with partners and share moments.'
                  : 'Enter your User ID or Email to set a new password for your account.'
            }}
          </p>
        </section>

        <!-- Segmented Tab: Sign In vs Create User -->
        <div
          class="w-full bg-[#e3efe8] p-1 rounded-2xl flex items-center mb-4 border border-[#d2e3d9]"
        >
          <button
            type="button"
            id="tab-btn-signin"
            (click)="setMode('login')"
            class="flex-1 py-2 text-[13px] font-medium rounded-xl transition-all duration-200 cursor-pointer"
            [class]="
              mode() === 'login'
                ? 'bg-[#ffffff] text-[#133126] shadow-xs font-semibold'
                : 'text-[#4e5b54] hover:text-[#133126]'
            "
          >
            Sign In
          </button>
          <button
            type="button"
            id="tab-btn-create-user"
            (click)="setMode('register')"
            class="flex-1 py-2 text-[13px] font-medium rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
            [class]="
              mode() === 'register'
                ? 'bg-[#ffffff] text-[#133126] shadow-xs font-semibold'
                : 'text-[#4e5b54] hover:text-[#133126]'
            "
          >
            <span>Create User</span>
            <span
              class="text-[10px] px-1.5 py-0.2 rounded-full bg-[#adcebe] text-[#0f281e] font-bold"
              >New</span
            >
          </button>
        </div>

        <!-- 1. SIGN IN FORM -->
        @if (mode() === 'login') {
          <form (ngSubmit)="handleLoginSubmit()" class="w-full flex flex-col gap-3">
            <!-- Username Input -->
            <app-form-input
              id="username-input"
              label="User ID"
              type="text"
              placeholder="Enter your User ID"
              [(ngModel)]="username"
              name="username"
            />

            <!-- Password Input -->
            <app-form-input
              id="password-input"
              label="Password"
              type="password"
              placeholder="••••••••••••"
              [(ngModel)]="password"
              name="password"
            />

            <!-- Forgot Password Action Link -->
            <div class="flex justify-end -mt-1">
              <button
                type="button"
                id="btn-forgot-password-link"
                (click)="setMode('forgot')"
                class="text-[12px] text-[#466557] hover:text-[#3b5549] hover:underline font-medium cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <!-- Feedback Toast Alert -->
            @if (statusMessage()) {
              <div
                class="p-3 rounded-xl text-xs font-semibold text-center border transition-all"
                [class]="
                  isSuccess()
                    ? 'bg-[#c8ead9] border-[#adcebe] text-[#012016]'
                    : 'bg-[#ffdad6] border-[#ffb4ab] text-[#93000a]'
                "
              >
                {{ statusMessage() }}
              </div>
            }

            <!-- Primary Action Button: Sign In -->
            <button
              type="submit"
              id="btn-login-submit"
              [disabled]="authService.isAuthenticating()"
              class="w-full mt-2 py-3 px-5 rounded-xl bg-[#466557] hover:bg-[#3b5549] active:scale-[0.99] text-white font-medium text-[14px] flex items-center justify-center gap-2 shadow-[0_3px_10px_rgba(70,101,87,0.2)] transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              @if (authService.isAuthenticating()) {
                <svg
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Signing in...</span>
              } @else {
                <span>Sign In</span>
                <span class="text-base font-semibold">→</span>
              }
            </button>

            <!-- Switch to Register Link -->
            <!-- <div class="text-center mt-2">
              <button
                type="button"
                (click)="setMode('register')"
                class="text-[12.5px] text-[#466557] hover:underline font-medium cursor-pointer"
              >
                Don't have an account? <span class="font-semibold underline">Create a user</span>
              </button>
            </div> -->
          </form>
        }

        <!-- 2. CREATE USER FORM -->
        @if (mode() === 'register') {
          <form (ngSubmit)="handleRegisterSubmit()" class="w-full flex flex-col gap-3">
            <!-- Profile Photo Upload / Capture Provision (Optional) -->
            <div class="flex flex-col items-center gap-2 py-1">
              <div
                class="relative group cursor-pointer"
                (click)="fileInput.click()"
                title="Click to capture or upload a profile image"
              >
                @if (avatarPreview()) {
                  <!-- Image Preview Circle -->
                  <div
                    class="w-18 h-18 rounded-full overflow-hidden border-2 border-[#466557] shadow-sm relative"
                  >
                    <img
                      [src]="avatarPreview()"
                      alt="Avatar Preview"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    (click)="removeAvatar($event)"
                    class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#ffdad6] text-[#93000a] flex items-center justify-center text-xs font-bold border border-[#ffb4ab] hover:scale-110 shadow-xs transition-transform cursor-pointer"
                    title="Remove image"
                  >
                    ✕
                  </button>
                } @else {
                  <!-- Fallback: First Character of Name if provided, else Photo Capture Placeholder -->
                  <div
                    class="w-18 h-18 rounded-full bg-[#ecf6f0] border-2 border-dashed border-[#adcebe] group-hover:border-[#466557] flex flex-col items-center justify-center text-[#466557] transition-all"
                  >
                    @if (newName.trim() || newUserId.trim()) {
                      <span class="text-xl font-bold text-[#133126]">
                        {{ (newName.trim() || newUserId.trim()).charAt(0).toUpperCase() }}
                      </span>
                      <span class="text-[9px] font-medium text-[#466557] mt-0.5">+ Photo</span>
                    } @else {
                      <img src="icons/camera.svg" class="w-6 h-6 object-contain" alt="Photo" />
                      <span class="text-[9.5px] font-semibold mt-0.5">+ Photo</span>
                    }
                  </div>
                }
              </div>

              <!-- Action buttons to capture or upload -->
              <div class="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  (click)="cameraInput.click()"
                  class="px-2.5 py-1 font-medium text-[#133126] bg-[#e3efe8] hover:bg-[#d5e7dd] rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <img src="icons/camera.svg" class="w-3.5 h-3.5 object-contain" alt="Take Photo" />
                  <span>Take Photo</span>
                </button>
                <button
                  type="button"
                  (click)="fileInput.click()"
                  class="px-2.5 py-1 font-medium text-[#133126] bg-[#e3efe8] hover:bg-[#d5e7dd] rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <img src="icons/gallery.svg" class="w-3.5 h-3.5 object-contain" alt="Upload" />
                  <span>Upload</span>
                </button>
                @if (avatarPreview()) {
                  <button
                    type="button"
                    (click)="removeAvatar($event)"
                    class="px-2 py-1 font-medium text-[#93000a] hover:bg-[#ffdad6] rounded-lg transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                }
              </div>

              <!-- Hidden File and Camera Inputs -->
              <input
                #fileInput
                type="file"
                accept="image/*"
                class="hidden"
                (change)="handleAvatarSelected($event)"
              />
              <input
                #cameraInput
                type="file"
                accept="image/*"
                capture="user"
                class="hidden"
                (change)="handleAvatarSelected($event)"
              />
            </div>

            <!-- User ID Input -->
            <div class="flex flex-col gap-1 text-left">
              <label for="new-userid-input" class="text-[13.5px] font-medium text-[#151d1a]">
                User ID
                <span class="text-[#466557] font-semibold text-xs"
                  >(Unique handle for friend search)</span
                >
              </label>
              <div
                class="relative flex items-center bg-[#ecf6f0]/90 border border-[#dbe5df] focus-within:border-[#466557] focus-within:ring-2 focus-within:ring-[#466557]/15 rounded-2xl overflow-hidden px-3.5 py-2.5"
              >
                <span class="text-[#727974] font-semibold mr-1.5 select-none text-sm">@</span>
                <input
                  id="new-userid-input"
                  name="newUserId"
                  type="text"
                  [(ngModel)]="newUserId"
                  placeholder="e.g. unique_username"
                  required
                  class="w-full bg-transparent text-[13.5px] text-[#151d1a] placeholder-[#94938f] focus:outline-none"
                />
              </div>
            </div>

            <!-- Full Name Input -->
            <app-form-input
              id="new-name-input"
              label="Full Name"
              type="text"
              placeholder="e.g. Your Full Name"
              [(ngModel)]="newName"
              name="newName"
            />

            <!-- Email Input (Optional) -->
            <app-form-input
              id="new-email-input"
              label="Email Address (Optional)"
              type="email"
              placeholder="e.g. user@example.com"
              [(ngModel)]="newEmail"
              name="newEmail"
            />

            <!-- Password Input -->
            <app-form-input
              id="new-password-input"
              label="Password"
              type="password"
              placeholder="At least 4 characters"
              [(ngModel)]="newPassword"
              name="newPassword"
            />

            <!-- Feedback Toast Alert -->
            @if (statusMessage()) {
              <div
                class="p-3 rounded-xl text-xs font-semibold text-center border transition-all"
                [class]="
                  isSuccess()
                    ? 'bg-[#c8ead9] border-[#adcebe] text-[#012016]'
                    : 'bg-[#ffdad6] border-[#ffb4ab] text-[#93000a]'
                "
              >
                {{ statusMessage() }}
              </div>
            }

            <!-- Primary Action Button: Create User -->
            <button
              type="submit"
              id="btn-create-user-submit"
              [disabled]="authService.isAuthenticating()"
              class="w-full mt-2 py-3 px-5 rounded-xl bg-[#466557] hover:bg-[#3b5549] active:scale-[0.99] text-white font-medium text-[14px] flex items-center justify-center gap-2 shadow-[0_3px_10px_rgba(70,101,87,0.2)] transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              @if (authService.isAuthenticating()) {
                <svg
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Creating User...</span>
              } @else {
                <span>Create User</span>
                <span class="text-base font-semibold">✓</span>
              }
            </button>

            <!-- Switch to Sign In Link -->
            <!-- <div class="text-center mt-2">
              <button
                type="button"
                (click)="setMode('login')"
                class="text-[12.5px] text-[#466557] hover:underline font-medium cursor-pointer"
              >
                Already have an account? <span class="font-semibold underline">Sign in</span>
              </button>
            </div> -->
          </form>
        }

        <!-- 3. FORGOT / RESET PASSWORD FORM -->
        @if (mode() === 'forgot') {
          <form (ngSubmit)="handleResetPasswordSubmit()" class="w-full flex flex-col gap-3">
            <!-- User ID or Email Input -->
            <app-form-input
              id="reset-identifier-input"
              label="User ID or Email"
              type="text"
              placeholder="e.g. unique_username or you@example.com"
              [(ngModel)]="resetIdentifier"
              name="resetIdentifier"
            />

            <!-- New Password Input -->
            <app-form-input
              id="reset-new-password-input"
              label="New Password"
              type="password"
              placeholder="At least 4 characters"
              [(ngModel)]="resetNewPassword"
              name="resetNewPassword"
            />

            <!-- Confirm New Password Input -->
            <app-form-input
              id="reset-confirm-password-input"
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter your new password"
              [(ngModel)]="resetConfirmPassword"
              name="resetConfirmPassword"
            />

            <!-- Feedback Toast Alert -->
            @if (statusMessage()) {
              <div
                class="p-3 rounded-xl text-xs font-semibold text-center border transition-all"
                [class]="
                  isSuccess()
                    ? 'bg-[#c8ead9] border-[#adcebe] text-[#012016]'
                    : 'bg-[#ffdad6] border-[#ffb4ab] text-[#93000a]'
                "
              >
                {{ statusMessage() }}
              </div>
            }

            <!-- Primary Action Button: Reset Password -->
            <button
              type="submit"
              id="btn-reset-password-submit"
              [disabled]="authService.isAuthenticating()"
              class="w-full mt-2 py-3 px-5 rounded-xl bg-[#466557] hover:bg-[#3b5549] active:scale-[0.99] text-white font-medium text-[14px] flex items-center justify-center gap-2 shadow-[0_3px_10px_rgba(70,101,87,0.2)] transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              @if (authService.isAuthenticating()) {
                <svg
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Resetting Password...</span>
              } @else {
                <span>Reset Password</span>
                <span class="text-base font-semibold">✓</span>
              }
            </button>

            <!-- Back to Sign In Link -->
            <div class="text-center mt-2">
              <button
                type="button"
                id="btn-back-to-signin"
                (click)="setMode('login')"
                class="text-[12.5px] text-[#466557] hover:underline font-medium cursor-pointer inline-flex items-center gap-1"
              >
                <span>←</span>
                <span>Back to Sign In</span>
              </button>
            </div>
          </form>
        }

        <!-- Footer Micro-copy -->
        <footer
          class="mt-8 flex items-center justify-center gap-1.5 text-[11.5px] text-[#727974] select-none"
        >
          <span>Developed By Vetriselvan Panneerselvam</span>
          <svg
            class="w-3.5 h-3.5 text-[#727974] fill-none stroke-current"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path
              d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
            />
          </svg>
        </footer>
      </div>
    </main>
  `,
})
export class LoginScreenComponent {
  authService = inject(AuthService);
  router = inject(Router);

  mode = signal<'login' | 'register' | 'forgot'>('login');

  // Login form model (empty, user creates/inputs real credentials)
  username = '';
  password = '';

  // Create user form model
  newUserId = '';
  newName = '';
  newEmail = '';
  newPassword = '';
  avatarPreview = signal<string>('');

  // Forgot / Reset password form model
  resetIdentifier = '';
  resetNewPassword = '';
  resetConfirmPassword = '';

  statusMessage = signal<string | null>(null);
  isSuccess = signal<boolean>(true);

  setMode(mode: 'login' | 'register' | 'forgot') {
    this.mode.set(mode);
    this.statusMessage.set(null);
    if (mode === 'forgot' && this.username.trim() && !this.resetIdentifier.trim()) {
      this.resetIdentifier = this.username.trim();
    }
  }

  handleAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 256;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          this.avatarPreview.set(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = rawUrl;
      };
      reader.readAsDataURL(file);
    }
  }

  removeAvatar(event: Event) {
    event.stopPropagation();
    this.avatarPreview.set('');
  }

  async handleLoginSubmit() {
    this.statusMessage.set(null);

    const cleanUser = this.username.trim();
    if (!cleanUser || !this.password) {
      this.isSuccess.set(false);
      this.statusMessage.set('Please enter both your User ID and password.');
      return;
    }

    const res = await this.authService.login(cleanUser, this.password);
    if (res.success) {
      this.isSuccess.set(true);
      this.statusMessage.set('✓ Successfully authenticated! Welcome back.');
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 500);
    } else {
      this.isSuccess.set(false);
      this.statusMessage.set(res.error || 'Authentication failed. Please verify credentials.');
    }
  }

  async handleRegisterSubmit() {
    this.statusMessage.set(null);

    const cleanUserId = this.newUserId.trim().replace(/^@+/, '');
    if (!cleanUserId || cleanUserId.length < 2) {
      this.isSuccess.set(false);
      this.statusMessage.set('User ID must be at least 2 characters.');
      return;
    }

    if (!this.newName.trim()) {
      this.isSuccess.set(false);
      this.statusMessage.set('Please provide your name.');
      return;
    }

    if (!this.newPassword || this.newPassword.length < 4) {
      this.isSuccess.set(false);
      this.statusMessage.set('Password must be at least 4 characters.');
      return;
    }

    // Provision image: pass avatar preview if selected, otherwise pass empty string ''
    const avatarUrl = this.avatarPreview().trim() || '';

    const res = await this.authService.register({
      userId: cleanUserId,
      name: this.newName.trim(),
      email: this.newEmail.trim() || undefined,
      password: this.newPassword,
      avatarUrl,
    });

    if (res.success) {
      this.isSuccess.set(true);
      this.statusMessage.set(`✓ User '@${cleanUserId}' created! Signing you in...`);
      // Update login field with newly registered userId
      this.username = cleanUserId;
      this.password = this.newPassword;

      setTimeout(async () => {
        await this.authService.login(cleanUserId, this.newPassword);
        this.router.navigate(['/dashboard']);
      }, 900);
    } else {
      this.isSuccess.set(false);
      this.statusMessage.set(res.error || 'User creation failed.');
    }
  }

  async handleResetPasswordSubmit() {
    this.statusMessage.set(null);

    const cleanIdentifier = this.resetIdentifier.trim().replace(/^@+/, '');
    if (!cleanIdentifier) {
      this.isSuccess.set(false);
      this.statusMessage.set('Please enter your User ID or Email.');
      return;
    }

    if (!this.resetNewPassword || this.resetNewPassword.length < 4) {
      this.isSuccess.set(false);
      this.statusMessage.set('Password must be at least 4 characters.');
      return;
    }

    if (this.resetNewPassword !== this.resetConfirmPassword) {
      this.isSuccess.set(false);
      this.statusMessage.set('Passwords do not match. Please verify.');
      return;
    }

    const res = await this.authService.resetPassword(cleanIdentifier, this.resetNewPassword);
    if (res.success) {
      this.isSuccess.set(true);
      this.statusMessage.set('✓ Password reset successfully! Redirecting to sign in...');
      this.username = cleanIdentifier;
      this.password = '';
      this.resetNewPassword = '';
      this.resetConfirmPassword = '';

      setTimeout(() => {
        this.setMode('login');
        this.statusMessage.set('✓ Password updated! Please sign in with your new password.');
      }, 1200);
    } else {
      this.isSuccess.set(false);
      this.statusMessage.set(res.error || 'Password reset failed.');
    }
  }
}

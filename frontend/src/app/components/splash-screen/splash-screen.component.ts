import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-splash-screen',
  imports: [NgOptimizedImage],
  template: `
    @if (loaderService.isSplashVisible()) {
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading Shareship"
        class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#f2fcf5] px-4 select-none transition-all duration-300 ease-out"
        [class.opacity-0]="loaderService.isSplashFading()"
        [class.scale-[1.02]]="loaderService.isSplashFading()"
        [class.pointer-events-none]="loaderService.isSplashFading()"
      >
        <!-- Subtle ambient glow behind the brand mark -->
        <div
          aria-hidden="true"
          class="absolute w-72 h-72 rounded-full bg-radial from-[#adcebe]/35 via-[#fed65b]/10 to-transparent blur-2xl pointer-events-none"
        ></div>

        <div class="relative flex flex-col items-center text-center max-w-[300px]">
          <!-- Brand Logo Container -->
          <div
            class="splash-logo-float w-28 h-28 rounded-[2rem] bg-white p-2.5 shadow-[0_14px_38px_rgba(70,101,87,0.16)] border border-[#dbe5df] flex items-center justify-center"
          >
            <img
              ngSrc="logo.png"
              width="96"
              height="96"
              priority
              alt="Shareship Logo"
              class="w-full h-full object-contain rounded-[1.45rem]"
            />
          </div>

          <!-- Brand Wordmark & Tagline -->
          <h1 class="mt-5 text-[26px] font-bold tracking-tight text-[#151d1a] leading-tight">
            Shareship
          </h1>
          <p class="mt-1.5 text-[13px] text-[#414844] font-medium leading-snug">
            Shared space for partners
          </p>

          <!-- Indeterminate Brand Loader Bar -->
          <div
            aria-hidden="true"
            class="mt-7 w-36 h-1.5 rounded-full bg-[#dce8e1] overflow-hidden"
          >
            <div
              class="app-loader-bar h-full w-1/2 rounded-full bg-gradient-to-r from-[#466557] via-[#7a9a8b] to-[#fed65b]"
            ></div>
          </div>
        </div>
      </div>
    }
  `,
})
export class SplashScreenComponent {
  readonly loaderService = inject(LoaderService);
}

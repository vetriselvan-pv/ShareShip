import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-global-loader',
  imports: [NgOptimizedImage],
  template: `
    @if (!loaderService.isSplashVisible() && loaderService.isLoading()) {
      <!-- Non-blocking application-level top progress bar -->
      <div
        role="progressbar"
        aria-label="Loading application data"
        aria-busy="true"
        class="fixed top-0 left-0 right-0 z-[90] h-[3px] bg-[#dce8e1]/70 overflow-hidden pointer-events-none"
      >
        <div
          class="app-loader-bar h-full w-2/5 bg-gradient-to-r from-[#466557] via-[#7a9a8b] to-[#fed65b] rounded-full"
        ></div>
      </div>
    }

    @if (!loaderService.isSplashVisible() && loaderService.isBlocking()) {
      <!-- Blocking application-level branded overlay for explicit critical tasks -->
      <div
        role="status"
        aria-live="assertive"
        aria-label="Processing request"
        class="fixed inset-0 z-[95] flex items-center justify-center bg-[#f2fcf5]/75 backdrop-blur-xs px-4 fade-in"
      >
        <div
          class="bg-white/95 border border-[#dbe5df] rounded-3xl px-6 py-5 shadow-[0_12px_36px_rgba(70,101,87,0.18)] flex flex-col items-center gap-3 min-w-[200px] max-w-[280px] text-center"
        >
          <div class="relative w-14 h-14 flex items-center justify-center">
            <div
              aria-hidden="true"
              class="absolute inset-0 rounded-full border-2 border-[#dce8e1] border-t-[#466557] animate-spin"
            ></div>
            <img
              ngSrc="logo.png"
              width="38"
              height="38"
              alt="Shareship"
              class="w-9.5 h-9.5 object-contain rounded-xl"
            />
          </div>
          <p class="text-[13px] font-medium text-[#151d1a]">
            {{ loaderService.loadingMessage() }}
          </p>
        </div>
      </div>
    }
  `,
})
export class GlobalLoaderComponent {
  readonly loaderService = inject(LoaderService);
}

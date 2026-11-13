import { Service, computed, signal } from '@angular/core';
import { LoaderTrackOptions } from '../models/loader.models';

@Service()
export class LoaderService {
  private readonly activeTaskCount = signal(0);
  private readonly blockingTaskCount = signal(0);
  private readonly isRouteNavigating = signal(false);

  private splashInitDone = false;
  private splashMinTimer: ReturnType<typeof setTimeout> | null = null;
  private splashFadeTimer: ReturnType<typeof setTimeout> | null = null;

  readonly isSplashVisible = signal(true);
  readonly isSplashFading = signal(false);
  readonly loadingMessage = signal('Syncing your shared space...');

  readonly isLoading = computed(
    () => this.activeTaskCount() > 0 || this.isRouteNavigating(),
  );
  readonly isBlocking = computed(() => this.blockingTaskCount() > 0);

  /**
   * Starts the initial splash lifecycle once on app boot and fades out smoothly
   * once initial rendering settles.
   */
  initSplash(minDurationMs = 950): void {
    if (this.splashInitDone) {
      return;
    }
    this.splashInitDone = true;

    this.splashMinTimer = setTimeout(() => {
      this.dismissSplash();
    }, minDurationMs);
  }

  dismissSplash(): void {
    if (!this.isSplashVisible() || this.isSplashFading()) {
      return;
    }

    if (this.splashMinTimer !== null) {
      clearTimeout(this.splashMinTimer);
      this.splashMinTimer = null;
    }

    this.isSplashFading.set(true);
    this.splashFadeTimer = setTimeout(() => {
      this.isSplashVisible.set(false);
      this.splashFadeTimer = null;
    }, 320);
  }

  setNavigating(active: boolean): void {
    this.isRouteNavigating.set(active);
  }

  show(options: LoaderTrackOptions = {}): void {
    const { blocking = false, message } = options;
    if (message) {
      this.loadingMessage.set(message);
    }
    this.activeTaskCount.update((count) => count + 1);
    if (blocking) {
      this.blockingTaskCount.update((count) => count + 1);
    }
  }

  hide(blocking = false): void {
    this.activeTaskCount.update((count) => Math.max(0, count - 1));
    if (blocking) {
      this.blockingTaskCount.update((count) => Math.max(0, count - 1));
    }
    if (this.blockingTaskCount() === 0 && this.activeTaskCount() === 0) {
      this.loadingMessage.set('Syncing your shared space...');
    }
  }

  async track<T>(work: Promise<T>, options: LoaderTrackOptions = {}): Promise<T> {
    const blocking = options.blocking ?? false;
    this.show(options);
    try {
      return await work;
    } finally {
      this.hide(blocking);
    }
  }
}

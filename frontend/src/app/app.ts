import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { GlobalLoaderComponent } from './components/global-loader/global-loader.component';
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';
import { LoaderService } from './services/loader.service';

@Component({
  imports: [RouterOutlet, SplashScreenComponent, GlobalLoaderComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly loaderService = inject(LoaderService);

  protected readonly title = signal('frontend');

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.loaderService.setNavigating(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loaderService.setNavigating(false);
      }
    });
  }

  ngOnInit(): void {
    this.loaderService.initSplash();
  }
}

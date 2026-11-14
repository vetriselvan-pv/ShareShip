import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route guard that ensures the user is logged in before accessing private screens.
 * If unauthenticated, redirects to `/login` and remembers the requested URL in `returnUrl`.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  const returnUrl = state.url && state.url !== '/' && state.url !== '/login' ? state.url : undefined;
  return router.createUrlTree(['/login'], {
    queryParams: returnUrl ? { returnUrl } : undefined,
  });
};

/**
 * Route guard for guest/public auth screens (e.g., login/register).
 * If the user is already authenticated, redirects them straight to `/dashboard`.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const PUBLIC_URL_PATTERNS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/create-user',
  '/api/auth/reset-password',
  '/api/config',
  '/api/health',
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const isApi = req.url.includes('/api/');
  const isPublic = PUBLIC_URL_PATTERNS.some((pattern) => req.url.includes(pattern));

  if (!isApi || isPublic) {
    return next(req);
  }

  // Ensure native secure storage session is restored before checking token
  return from(authService.ensureSessionLoaded()).pipe(
    switchMap(() => {
      const authHeaders = authService.getAuthHeaders();
      const authenticatedReq = Object.keys(authHeaders).length > 0
        ? req.clone({
            setHeaders: authHeaders,
          })
        : req;

      return next(authenticatedReq);
    }),
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        console.warn(`[AuthInterceptor] 401 Unauthorized encountered on ${req.url}. Purging expired session.`);
        authService.logout(true);
      }
      return throwError(() => err);
    })
  );
};

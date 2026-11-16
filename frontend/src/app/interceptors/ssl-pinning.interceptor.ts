import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SslPinningService } from '../services/ssl-pinning.service';

/**
 * SSL Pinning HTTP Interceptor
 * Ensures all requests to pinned domains enforce secure HTTPS protocol
 * and marks requests for native OS SSL pinning verification.
 */
export const sslPinningInterceptor: HttpInterceptorFn = (req, next) => {
  const sslPinningService = inject(SslPinningService);
  const check = sslPinningService.validateAndSecureUrl(req.url);

  let modifiedReq = req;

  if (check.upgraded) {
    modifiedReq = modifiedReq.clone({ url: check.url });
  }

  if (check.isPinned) {
    modifiedReq = modifiedReq.clone({
      setHeaders: {
        'X-SSL-Pinning': 'enforced',
      },
    });
  }

  return next(modifiedReq);
};

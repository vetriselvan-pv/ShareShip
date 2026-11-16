import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { SslPinningService } from '../services/ssl-pinning.service';

/**
 * SSL Pinning HTTP Interceptor
 * In web browsers (Chrome/Dev), SSL pinning is not supported and not applicable.
 * On native platforms (Capacitor), requests are validated and secured.
 */
export const sslPinningInterceptor: HttpInterceptorFn = (req, next) => {
  if (!Capacitor.isNativePlatform()) {
    return next(req);
  }

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

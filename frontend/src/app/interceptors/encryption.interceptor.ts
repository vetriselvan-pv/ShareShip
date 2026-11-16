import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, map, catchError, throwError } from 'rxjs';
import { CryptoService } from '../services/crypto.service';

export const encryptionInterceptor: HttpInterceptorFn = (req, next) => {
  const cryptoService = inject(CryptoService);

  // Only encrypt / decrypt API traffic, ignore public health probes
  const isApi = req.url.includes('/api/') && !req.url.includes('/api/health');

  if (!isApi) {
    return next(req);
  }

  const isFormData = typeof FormData !== 'undefined' && req.body instanceof FormData;
  const isAlreadyEncrypted = cryptoService.isEncryptedEnvelope(req.body);
  const hasBody =
    req.body !== null &&
    req.body !== undefined &&
    ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase()) &&
    !isFormData;

  // Prepare outgoing encrypted request
  const prepareRequest$ = hasBody && !isAlreadyEncrypted
    ? from(cryptoService.wrapEncryptedEnvelope(req.body)).pipe(
        map((envelope) =>
          req.clone({
            body: envelope,
            setHeaders: {
              'X-Payload-Encryption': 'aes-256-gcm',
            },
          })
        )
      )
    : from(
        Promise.resolve(
          req.clone({
            setHeaders: {
              'X-Payload-Encryption': 'aes-256-gcm',
            },
          })
        )
      );

  return prepareRequest$.pipe(
    switchMap((encryptedReq) => next(encryptedReq)),
    switchMap((event) => {
      // Check if response has encrypted envelope
      if (event instanceof HttpResponse && cryptoService.isEncryptedEnvelope(event.body)) {
        return from(cryptoService.decrypt(event.body.payload)).pipe(
          map((decryptedData) => event.clone({ body: decryptedData }))
        );
      }
      return from(Promise.resolve(event));
    }),
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && cryptoService.isEncryptedEnvelope(err.error)) {
        return from(cryptoService.decrypt(err.error.payload)).pipe(
          switchMap((decrypted) =>
            throwError(
              () =>
                new HttpErrorResponse({
                  error: decrypted,
                  headers: err.headers,
                  status: err.status,
                  statusText: err.statusText,
                  url: err.url ?? undefined,
                })
            )
          ),
          catchError(() => throwError(() => err))
        );
      }
      return throwError(() => err);
    })
  );
};


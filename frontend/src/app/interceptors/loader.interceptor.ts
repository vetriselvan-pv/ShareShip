import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoaderService } from '../services/loader.service';

export const SKIP_GLOBAL_LOADER = new HttpContextToken<boolean>(() => false);
export const BLOCKING_LOADER_MESSAGE = new HttpContextToken<string | null>(() => null);

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_GLOBAL_LOADER)) {
    return next(req);
  }

  const loaderService = inject(LoaderService);
  const blockingMessage = req.context.get(BLOCKING_LOADER_MESSAGE);
  const isBlocking = blockingMessage !== null;

  loaderService.show({
    blocking: isBlocking,
    message: blockingMessage ?? undefined,
  });

  return next(req).pipe(finalize(() => loaderService.hide(isBlocking)));
};

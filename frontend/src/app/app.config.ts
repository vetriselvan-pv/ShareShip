import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { loaderInterceptor } from './interceptors/loader.interceptor';
import { authInterceptor } from './interceptors/auth.interceptor';
import { encryptionInterceptor } from './interceptors/encryption.interceptor';
import { sslPinningInterceptor } from './interceptors/ssl-pinning.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(
      withInterceptors([
        sslPinningInterceptor,
        authInterceptor,
        encryptionInterceptor,
        loaderInterceptor,
      ]),
    ),
  ],
};

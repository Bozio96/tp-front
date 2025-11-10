// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { routes } from './app.routes';
import { httpErrorInterceptor } from './services/http-error.interceptor';
import { authTokenInterceptor } from './services/auth-token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([authTokenInterceptor, httpErrorInterceptor])),
    importProvidersFrom(MatSnackBarModule),
    provideCharts(withDefaultRegisterables()),
  ],
};

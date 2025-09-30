import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { NotificationService } from './notification.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse) {
        const backendMessage = typeof error.error?.message === 'string' ? error.error.message : null;
        const message = backendMessage && backendMessage.trim().length > 0
          ? backendMessage
          : 'Ocurrió un error al procesar la solicitud.';
        notifications.showError(message);
      }

      return throwError(() => error);
    })
  );
};

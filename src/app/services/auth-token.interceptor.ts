import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

// Adjunta Authorization: Bearer <token> a llamadas hacia el backend
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const isBackendRequest = req.url.startsWith('http://localhost:3000');

  if (token && isBackendRequest) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};


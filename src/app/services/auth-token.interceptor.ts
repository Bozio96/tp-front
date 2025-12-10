import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { API_BASE_URL } from '../config/api.config';

// Adjunta Authorization: Bearer <token> a llamadas hacia el backend
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const backendBaseUrl = API_BASE_URL.replace(/\/$/, '');
  const isBackendRequest = req.url.startsWith(backendBaseUrl);

  if (token && isBackendRequest) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};

import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export enum Role {
  Admin = 'admin',
  User = 'user',
}
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRole = route.data['role'] as Role;
  const currentUser = authService.getCurrentUser();

  // Verificamos si el usuario existe y si su rol es el requerido
  if (currentUser && currentUser.role === requiredRole) {
    return true;
  }

  // Si no cumple con el rol, lo redirigimos a la página principal.
  // Podrías también redirigir a una página de "Acceso Denegado".
  console.warn(`Acceso denegado. Se requiere rol: ${requiredRole}, pero el usuario tiene rol: ${currentUser?.role}`);
  router.navigate(['/']);
  return false;
}; 
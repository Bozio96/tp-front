// src/app/guards/role.guard.ts
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRole = route.data['role'] as 'admin' | 'user';
  const userRole = authService.getUserRole();

  if (authService.isLoggedIn() && userRole === requiredRole) {
    return true; // Si el usuario está logueado y tiene el rol requerido, permite el acceso.
  }

  // Si no cumple el rol, redirige a una página de acceso denegado o a la página de inicio.
  router.navigate(['/']); // Redirige a la página de inicio.
  return false;
}; 
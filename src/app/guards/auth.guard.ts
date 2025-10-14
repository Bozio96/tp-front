import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService); //¿Por qué usa "inject" y no "new"?
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true; // Si el usuario está logueado, permite el acceso.
  }

  // Si no está logueado, redirige a una página de login.
  router.navigate(['/login']); // Redirigiremos a la ruta de login que crearemos más tarde.
  return false;
};
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { PendingChangesGuard } from './guards/pending-changes.guard';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { ProductContainerComponent } from './pages/products/product-container/product-container.component';
import { ProductsListComponent } from './pages/products/products-list/products-list.component';
import { ProductFormComponent } from './pages/products/product-form/product-form.component';
import { PriceChangeComponent } from './pages/products/price-change/price-change.component';

// Importa los nuevos guards y el componente de login
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { LoginComponent } from './components/login/login.component';
import { DataListComponent } from './pages/products/data-list/data-list.component';

// Importamos el nuevo componente genérico que vamos a crear

export const routes: Routes = [
  // Ruta de login sin protección
  { path: 'login', component: LoginComponent },

  // Rutas que requieren autenticación. Todas las rutas hijas serán protegidas.
  {
    path: '',
    canActivate: [authGuard], // Aplica el authGuard a todas las rutas hijas
    children: [
      { path: '', component: HomePageComponent },
      { path: 'not-found', component: NotFoundComponent },

      {
        path: 'products',
        component: ProductContainerComponent,
        children: [
          { path: '', component: ProductsListComponent },

          // RUTAS ESPECÍFICAS (AHORA ANTES DE LA PARAMÉTRICA)
          {
            path: 'add',
            component: ProductFormComponent,
            canDeactivate: [PendingChangesGuard],
            canActivate: [roleGuard],
            data: { role: 'admin' }
          },
          {
            path: 'edit/:id',
            component: ProductFormComponent,
            canDeactivate: [PendingChangesGuard],
            canActivate: [roleGuard],
            data: { role: 'admin' }
          },
          {
            path: 'price-change',
            component: PriceChangeComponent,
            canActivate: [roleGuard],
            data: { role: 'admin' }
          },

          // RUTA PARAMÉTRICA PARA LA REFACTORIZACIÓN (MOVIDA AL FINAL)
          {
            path: ':entityType',
            children: [
              { path: '', component: DataListComponent },
              {
                path: 'add',
                loadComponent: () =>
                  import('./pages/products/data-form/data-form.component')
                    .then(c => c.DataFormComponent),
                canDeactivate: [PendingChangesGuard],
                canActivate: [roleGuard],
                data: { role: 'admin' }
              },
              {
                path: 'edit/:id',
                loadComponent: () =>
                  import('./pages/products/data-form/data-form.component')
                    .then(c => c.DataFormComponent),
                canDeactivate: [PendingChangesGuard],
                canActivate: [roleGuard],
                data: { role: 'admin' }
              }
            ]
          }
        ]
      }
    ]
  },

  { path: '**', component: NotFoundComponent }
];

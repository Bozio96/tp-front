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
          {
            path: '',
            component: ProductsListComponent,
          },
          // Rutas de 'data-form' protegidas por el roleGuard (solo para 'admin')
          {
            path: 'brands',
            children: [
              {
                path: '',
                loadComponent: () => import('./pages/products/brands-list/brands-list.component').then(c => c.BrandsListComponent)
              },
              {
                path: 'add',
                loadComponent: () => import('./pages/products/data-form/data-form.component').then(c => c.DataFormComponent),
                canDeactivate: [PendingChangesGuard],
                canActivate: [roleGuard],
                data: { role: 'admin' }
              },
              {
                path: 'edit/:id',
                loadComponent: () => import('./pages/products/data-form/data-form.component').then(c => c.DataFormComponent),
                canDeactivate: [PendingChangesGuard],
                canActivate: [roleGuard],
                data: { role: 'admin' }
              },
            ],
          },
          // ... Las otras rutas de data-form (departamentos, categorias, proveedores) se protegerían de forma similar
          {
            path: 'departments',
            children: [
              {
                path: '',
                loadComponent: () => import('./pages/products/departments-list/departments-list.component').then(c => c.DepartmentsListComponent)
              },
              {
                path: 'add',
                loadComponent: () => import('./pages/products/data-form/data-form.component').then(c => c.DataFormComponent),
                canDeactivate: [PendingChangesGuard],
                canActivate: [roleGuard],
                data: { role: 'admin' }
              },
              {
                path: 'edit/:id',
                loadComponent: () => import('./pages/products/data-form/data-form.component').then(c => c.DataFormComponent),
                canDeactivate: [PendingChangesGuard],
                canActivate: [roleGuard],
                data: { role: 'admin' }
              },
            ],
          },
          {
            path: 'categories',
            children: [
              {
                path: '',
                loadComponent: () => import('./pages/products/categories-list/categories-list.component').then(c => c.CategoriesListComponent)
              },
              {
                path: 'add',
                loadComponent: () => import('./pages/products/data-form/data-form.component').then(c => c.DataFormComponent),
                canDeactivate: [PendingChangesGuard],
                canActivate: [roleGuard],
                data: { role: 'admin' }
              },
              {
                path: 'edit/:id',
                loadComponent: () => import('./pages/products/data-form/data-form.component').then(c => c.DataFormComponent),
                canDeactivate: [PendingChangesGuard],
                canActivate: [roleGuard],
                data: { role: 'admin' }
              },
            ],
          },
          {
            path: 'suppliers',
            children: [
              {
                path: '',
                loadComponent: () => import('./pages/products/suppliers-list/suppliers-list.component').then(c => c.SuppliersListComponent)
              },
              {
                path: 'add',
                loadComponent: () => import('./pages/products/data-form/data-form.component').then(c => c.DataFormComponent),
                canDeactivate: [PendingChangesGuard],
                canActivate: [roleGuard],
                data: { role: 'admin' }
              },
              {
                path: 'edit/:id',
                loadComponent: () => import('./pages/products/data-form/data-form.component').then(c => c.DataFormComponent),
                canDeactivate: [PendingChangesGuard],
                canActivate: [roleGuard],
                data: { role: 'admin' }
              },
            ],
          },
          // Rutas para 'product-form' y 'price-change' protegidas por el roleGuard (solo 'admin')
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
        ],
      },
    ],
  },
  { path: '**', component: NotFoundComponent },
];
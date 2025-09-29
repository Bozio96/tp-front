import { Routes } from '@angular/router';
import { PendingChangesGuard } from './guards/pending-changes.guard';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { ProductContainerComponent } from './pages/products/product-container/product-container.component';
import { ProductsListComponent } from './pages/products/products-list/products-list.component';
import { ProductFormComponent } from './pages/products/product-form/product-form.component';
import { PriceChangeComponent } from './pages/products/price-change/price-change.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { LoginComponent } from './components/login/login.component';
import { DataListComponent } from './pages/products/data-list/data-list.component';
import { ClientsListComponent } from './pages/clients/clients-list/clients-list.component';
import { ClientFormComponent } from './pages/clients/client-form/client-form.component';
import { ClientDetailComponent } from './pages/clients/client-detail/client-detail.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', component: HomePageComponent },
      { path: 'not-found', component: NotFoundComponent },
      {
        path: 'products',
        component: ProductContainerComponent,
        children: [
          { path: '', component: ProductsListComponent },
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
      },
      {
        path: 'clients',
        children: [
          { path: '', component: ClientsListComponent },
          {
            path: 'new',
            component: ClientFormComponent,
            canDeactivate: [PendingChangesGuard],
          },
          {
            path: 'edit/:id',
            component: ClientFormComponent,
            canDeactivate: [PendingChangesGuard],
          },
          { path: ':id', component: ClientDetailComponent },
        ]
      }
    ]
  },
  { path: '**', component: NotFoundComponent }
];

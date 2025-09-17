import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component'; 
import { NotFoundComponent } from './pages/not-found/not-found.component'
import { ProductFormComponent } from './pages/products/product-form/product-form.component';
import { ProductsListComponent } from './pages/products/products-list/products-list.component';
import { ProductContainerComponent } from './pages/products/product-container/product-container.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'not-found', component: NotFoundComponent },

  {
  path: 'products',
  component: ProductContainerComponent,
  children: [
    {
        path: '', // ¡CAMBIO IMPORTANTE AQUÍ! Ahora la ruta vacía (o sea, /products) carga la lista
        component: ProductsListComponent
      },
      // Puedes eliminar la ruta 'articulos' si ya no la necesitas, o dejarla como un alias
      // Si la eliminas, asegúrate de que no haya enlaces internos que apunten a ella.
      // Si la dejas, considera redirigirla.
     
    {
      path: 'marca',
      component: NotFoundComponent
    },
    {
      path: 'departamento',
      component: NotFoundComponent
    },
    {
      path: 'rubro',
      component: NotFoundComponent
    },
    {
      path: 'add',
      component: ProductFormComponent
    },
    {
      path: 'edit/:id',
      component: ProductFormComponent
    },
  
  ]
},
  
  { path: '**', component: NotFoundComponent }
];

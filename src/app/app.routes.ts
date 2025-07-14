import { Routes } from '@angular/router';
import { ArticleComponent } from './pages/products/article/article.component';
import { HomeComponent } from './pages/home/home.component'; 
import { NotFoundComponent } from './pages/not-found/not-found.component'

export const routes: Routes = [
  {
    path: '', // Cuando la URL es http://localhost:4200/
    component: HomeComponent // Carga el HomeComponent en el router-outlet
  },
  {
    path: 'product',
    component: ArticleComponent
  },
  // Aquí puedes añadir tus otras rutas como 'pedidos', 'clientes', 'ventas', etc.
  // { path: 'pedidos', component: PedidosComponent },
  // { path: 'clientes', component: ClientesComponent },
  // { path: 'ventas', component: VentasComponent },
  {
    path: '**', 
    component: NotFoundComponent 
  }
];
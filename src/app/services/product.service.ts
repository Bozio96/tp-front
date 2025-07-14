import { Injectable } from '@angular/core';
import { of, delay, Observable } from 'rxjs'; // Añade Observable

interface Product { // Define la interfaz del producto si no la tienes
  id: number;
  name: string;
  price: number;
  stock: number;
  description?: string; // Añade descripción si la usas en la búsqueda
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products: Product[] = [ // Añade 'description' para la búsqueda
    { id: 1, name: 'Hulk', price: 100, stock: 23, description: 'Personaje de cómic de Marvel' },
    { id: 2, name: 'Marvel', price: 200, stock: 1, description: 'Universo de superhéroes' },
    { id: 3, name: 'Capitan America', price: 300, stock: 2, description: 'Líder de los Vengadores' },
    { id: 4, name: 'Thor', price: 300, stock: 3, description: 'Dios del trueno' },
    { id: 5, name: 'Thanos', price: 300, stock: 17, description: 'El titán loco de Marvel' },
    { id: 6, name: 'Thanos triple', price: 300, stock: 17, description: 'Una versión mejorada de Thanos' },
  ];

  // Nuevo método para buscar productos, simulando una llamada a API con un filtro
  searchProducts(term: string): Observable<Product[]> {
    if (!term) {
      return of(this.products).pipe(delay(500)); // Si no hay término, devuelve todos (con delay)
    }
    const lowerCaseTerm = term.toLowerCase().trim();
    const results = this.products.filter(product =>
      product.name.toLowerCase().includes(lowerCaseTerm) ||
      (product.description && product.description.toLowerCase().includes(lowerCaseTerm))
    );
    return of(results).pipe(delay(500)); // Devuelve los resultados filtrados (con delay)
  }

  // Si aún necesitas cargar todos sin filtro, puedes mantener getProducts() o usar searchProducts('')
  getProducts(): Observable<Product[]> {
    return of(this.products).pipe(delay(800)); // Mantener para la carga inicial si es necesario
  }

  getProductCount() {
    return this.products.length;
  }
}
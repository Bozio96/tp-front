import { Injectable, Injector } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ProductApiService } from './product-api.service';
import { Product } from '../pages/products/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  // Elimina todo el código de inyección diferida
  constructor(private api: ProductApiService) {}

  getAllProducts(): Observable<Product[]> {
    return this.api.getAllProducts().pipe(
      catchError(error => {
        console.error('Error al cargar productos', error);
        return of([]);
      })
    );
  }

  searchProducts(term: string): Observable<Product[]> {
    if (!term.trim()) {
      return this.getAllProducts();
    }
    return this.getAllProducts().pipe(
      map(products => products.filter(p => 
        p.name.toLowerCase().includes(term.toLowerCase())
      )),
      catchError(error => {
        console.error('Error al buscar productos', error);
        return of([]);
      })
    );
  }

  getProductById(id: number): Observable<Product | undefined> {
    return this.api.getProductById(id).pipe(
      map(product => product),
      catchError(error => {
        console.error(`Error al obtener producto con ID ${id}`, error);
        return of(undefined);
      })
    );
  }

  getProductCount(): Observable<number> {
    return this.getAllProducts().pipe(
      map(products => products.length)
    );
  }

  addProduct(newProduct: Product): Observable<Product> {
    return this.api.createProduct(newProduct).pipe(
      catchError(error => {
        console.error('Error al agregar producto', error);
        return of(newProduct);
      })
    );
  }

  updateProduct(updatedProduct: Product): Observable<Product> {
    return this.api.updateProduct(updatedProduct).pipe(
      map(product => product),
      catchError(error => {
        console.error('Error al actualizar producto', error);
        return of(updatedProduct);
      })
    );
  }

  deleteProduct(id: number): Observable<boolean> {
    return this.api.deleteProduct(id).pipe(
      map(() => true),
      catchError(error => {
        console.error(`Error al eliminar producto con ID ${id}`, error);
        return of(false);
      })
    );
  }

  // CORREGIDO: Usa this.api en lugar de this.http
  bulkUpdateProducts(updatedProducts: Product[]): Observable<boolean> {
    const payload = updatedProducts
      .map(p => ({
        id: p.id,
        costBase: p.costoNuevo ?? undefined,
        salePrice: p.salePriceNuevo ?? undefined,
        utilityPercentage: p.utilityNuevo ?? undefined,
      }))
      .filter(p => p.costBase !== undefined || p.salePrice !== undefined || p.utilityPercentage !== undefined);

    if (payload.length === 0) {
      return of(true); // No hay cambios, pero no es error
    }

    // Usa el servicio API, NO http directamente
    return this.api.bulkUpdateProducts(payload).pipe(
      map(response => (response as { success: boolean }).success),
      catchError(error => {
        console.error('Error en actualización masiva de precios', error);
        return of(false);
      })
    );
  }
}
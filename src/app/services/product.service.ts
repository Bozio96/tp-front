import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ProductApiService } from './product-api.service';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
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
      map(products =>
        products.filter(p => p.name.toLowerCase().includes(term.toLowerCase()))
      ),
      catchError(error => {
        console.error('Error al buscar productos', error);
        return of([]);
      })
    );
  }

  getProductById(id: number): Observable<Product> {
    return this.api.getProductById(id).pipe(
      catchError(error => {
        console.error('Error al obtener producto con ID ' + id, error);
        return throwError(() => error);
      })
    );
  }

  getProductCount(): Observable<number> {
    return this.getAllProducts().pipe(map(products => products.length));
  }

  addProduct(newProduct: Product): Observable<Product> {
    return this.api.createProduct(newProduct).pipe(
      catchError(error => {
        console.error('Error al agregar producto', error);
        return throwError(() => error);
      })
    );
  }

  updateProduct(id: number, updates: Partial<Product>): Observable<Product> {
    return this.api.updateProduct(id, updates).pipe(
      map(product => product),
      catchError(error => {
        console.error('Error al actualizar producto', error);
        return throwError(() => error);
      })
    );
  }

  deleteProduct(id: number): Observable<boolean> {
    return this.api.deleteProduct(id).pipe(
      map(() => true),
      catchError(error => {
        console.error(`Error al eliminar producto con ID ${id}`, error);
        return throwError(() => error);
      })
    );
  }

  bulkUpdateProducts(updatedProducts: Product[]): Observable<boolean> {
    const payload = updatedProducts
      .map(p => ({
        id: p.id,
        costBase: p.costoNuevo ?? undefined,
        salePrice: p.salePriceNuevo ?? undefined,
        utilityPercentage: p.utilityNuevo ?? undefined,
      }))
      .filter(p =>
        p.costBase !== undefined ||
        p.salePrice !== undefined ||
        p.utilityPercentage !== undefined
      );

    if (payload.length === 0) {
      return of(true);
    }

    return this.api.bulkUpdateProducts(payload).pipe(
      map(response => (response as { success: boolean }).success),
      catchError(error => {
        console.error('Error en actualizacion masiva de precios', error);
        return throwError(() => error);
      })
    );
  }
}

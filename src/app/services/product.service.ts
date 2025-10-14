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
      catchError(() => of([]))
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
      catchError(() => of([]))
    );
  }

  getProductById(id: number): Observable<Product> {
    return this.api.getProductById(id).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  getProductCount(): Observable<number> {
    return this.getAllProducts().pipe(map(products => products.length));
  }

  addProduct(newProduct: Product): Observable<Product> {
    return this.api.createProduct(newProduct).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  updateProduct(id: number, updates: Partial<Product>): Observable<Product> {
    return this.api.updateProduct(id, updates).pipe(
      map(product => product),
      catchError((error) => throwError(() => error))
    );
  }

  deleteProduct(id: number): Observable<boolean> {
    return this.api.deleteProduct(id).pipe(
      map(() => true),
      catchError((error) => throwError(() => error))
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
      catchError((error) => throwError(() => error))
    );
  }
}

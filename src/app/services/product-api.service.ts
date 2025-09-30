// product-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/product.model';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BulkUpdateResponse, DataItem, EntityType } from './product-types';

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private readonly baseUrl = 'http://localhost:3000/api';
  private readonly productsUrl = `${this.baseUrl}/products`;

  constructor(private http: HttpClient) {}

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.productsUrl).pipe(
      catchError(error => {
        console.error('API - Error al obtener productos:', error);
        return of([]);
      })
    );
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.productsUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`API - Error al obtener producto ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(this.productsUrl, product).pipe(
      catchError(error => {
        console.error('API - Error al crear producto:', error);
        return throwError(() => error);
      })
    );
  }

  updateProduct(id: number, payload: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.productsUrl}/${id}`, payload).pipe(
      catchError(error => {
        console.error(`API - Error al actualizar producto ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.productsUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`API - Error al eliminar producto ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  bulkUpdateProducts(products: any[]): Observable<BulkUpdateResponse> {
    return this.http.patch<BulkUpdateResponse>(`${this.productsUrl}/bulk-update`, products).pipe(
      catchError(error => {
        console.error('API - Error en actualizacion masiva:', error);
        return of({ success: false });
      })
    );
  }

  getBrands(): Observable<DataItem[]> {
    return this.http.get<DataItem[]>(`${this.baseUrl}/brands`).pipe(
      catchError(error => {
        console.error('API - Error al obtener marcas:', error);
        return of([]);
      })
    );
  }

  getDepartments(): Observable<DataItem[]> {
    return this.http.get<DataItem[]>(`${this.baseUrl}/departments`).pipe(
      catchError(error => {
        console.error('API - Error al obtener departamentos:', error);
        return of([]);
      })
    );
  }

  getCategories(): Observable<DataItem[]> {
    return this.http.get<DataItem[]>(`${this.baseUrl}/categories`).pipe(
      catchError(error => {
        console.error('API - Error al obtener categorias:', error);
        return of([]);
      })
    );
  }

  getSuppliers(): Observable<DataItem[]> {
    return this.http.get<DataItem[]>(`${this.baseUrl}/suppliers`).pipe(
      catchError(error => {
        console.error('API - Error al obtener proveedores:', error);
        return of([]);
      })
    );
  }

  getItemById(type: EntityType, id: number): Observable<DataItem> {
    return this.http.get<DataItem>(`${this.baseUrl}/${type}/${id}`).pipe(
      catchError(error => {
        console.error(`API - Error al obtener ${type} ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  saveItem(type: EntityType, item: DataItem): Observable<DataItem> {
    const url = `${this.baseUrl}/${type}`;
    const { id, ...rest } = item;

    if (!id || id <= 0) {
      return this.http.post<DataItem>(url, rest as DataItem);
    }

    return this.http.put<DataItem>(`${url}/${id}`, rest as DataItem);
  }

  deleteItem(type: EntityType, id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${type}/${id}`);
  }
}


// product-api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/product.model';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BulkUpdateResponse, DataItem, EntityType } from './product-types';

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private readonly baseUrl = 'http://localhost:3000/api';
  private readonly productsUrl = `${this.baseUrl}/products`;
  

  constructor(private http: HttpClient) {}


  // --- OPERACIONES DE PRODUCTOS ---
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
        return of({} as Product);
      })
    );
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(this.productsUrl, product).pipe(
      catchError(error => {
        console.error('API - Error al crear producto:', error);
        return of(product);
      })
    );
  }

  updateProduct(product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.productsUrl}/${product.id}`, product).pipe(
      catchError(error => {
        console.error(`API - Error al actualizar producto ${product.id}:`, error);
        return of(product);
      })
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.productsUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`API - Error al eliminar producto ${id}:`, error);
        return of(undefined);
      })
    );
  }

  bulkUpdateProducts(products: any[]): Observable<BulkUpdateResponse> {
    return this.http.patch<BulkUpdateResponse>(`${this.productsUrl}/bulk-update`, products).pipe(
      catchError(error => {
        console.error('API - Error en actualización masiva:', error);
        return of({ success: false });
      })
    );
  }

  // --- OPERACIONES DE DATOS MAESTROS ---
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
        console.error('API - Error al obtener categorías:', error);
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
        return of({ id: 0, name: '' } as DataItem);
      })
    );
  }

  saveItem(type: EntityType, item: DataItem): Observable<DataItem> {
    const url = `${this.baseUrl}/${type}`;
    return (item.id && item.id > 0) 
      ? this.http.put<DataItem>(url, item)
      : this.http.post<DataItem>(url, item);
  }

  deleteItem(type: EntityType, id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${type}/${id}`);
  }
}
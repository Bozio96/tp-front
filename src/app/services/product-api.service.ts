import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/product.model';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BulkUpdateResponse, DataItem, EntityType } from './product-types';
import { API_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private readonly baseUrl = API_URL;
  private readonly productsUrl = `${this.baseUrl}/products`;

  constructor(private http: HttpClient) {}

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.productsUrl).pipe(
      catchError(() => of([]))
    );
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.productsUrl}/${id}`).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(this.productsUrl, product).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  updateProduct(id: number, payload: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.productsUrl}/${id}`, payload).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.productsUrl}/${id}`).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  bulkUpdateProducts(products: any[]): Observable<BulkUpdateResponse> {
    return this.http.patch<BulkUpdateResponse>(`${this.productsUrl}/bulk-update`, products).pipe(
      catchError(() => of({ success: false }))
    );
  }

  getBrands(): Observable<DataItem[]> {
    return this.http.get<DataItem[]>(`${this.baseUrl}/brands`).pipe(
      catchError(() => of([]))
    );
  }

  getDepartments(): Observable<DataItem[]> {
    return this.http.get<DataItem[]>(`${this.baseUrl}/departments`).pipe(
      catchError(() => of([]))
    );
  }

  getCategories(): Observable<DataItem[]> {
    return this.http.get<DataItem[]>(`${this.baseUrl}/categories`).pipe(
      catchError(() => of([]))
    );
  }

  getSuppliers(): Observable<DataItem[]> {
    return this.http.get<DataItem[]>(`${this.baseUrl}/suppliers`).pipe(
      catchError(() => of([]))
    );
  }

  getItemById(type: EntityType, id: number): Observable<DataItem> {
    return this.http.get<DataItem>(`${this.baseUrl}/${type}/${id}`).pipe(
      catchError((error) => throwError(() => error))
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


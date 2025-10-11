// src/app/services/product-data.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { DataItem, EntityType } from './product-types';
import { ProductApiService } from './product-api.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class ProductDataService {
  constructor(
    private api: ProductApiService,
    private notifications: NotificationService
  ) {}

  getItems(type: EntityType): Observable<DataItem[]> {
    switch (type) {
      case 'brands':
        return this.getBrands();
      case 'departments':
        return this.getDepartments();
      case 'categories':
        return this.getCategories();
      case 'suppliers':
        return this.getSuppliers();
      default:
        this.notifications.showError(`Tipo de entidad no válido: ${type}`);
        return of([]);
    }
  }

  getBrands(): Observable<DataItem[]> {
    return this.api.getBrands().pipe(
      catchError(() => of([]))
    );
  }

  getDepartments(): Observable<DataItem[]> {
    return this.api.getDepartments().pipe(
      catchError(() => of([]))
    );
  }

  getCategories(): Observable<DataItem[]> {
    return this.api.getCategories().pipe(
      catchError(() => of([]))
    );
  }

  getSuppliers(): Observable<DataItem[]> {
    return this.api.getSuppliers().pipe(
      catchError(() => of([]))
    );
  }

  getItemById(type: EntityType, id: number): Observable<DataItem | null> {
    return this.api.getItemById(type, id).pipe(
      map((item) => item),
      catchError((error) => throwError(() => error))
    );
  }

  saveItem(type: EntityType, item: DataItem): Observable<DataItem> {
    return this.api.saveItem(type, item).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  deleteItem(type: EntityType, id: number): Observable<boolean> {
    return this.api.deleteItem(type, id).pipe(
      map(() => true),
      catchError((error) => throwError(() => error))
    );
  }
}
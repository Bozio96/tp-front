import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
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
      map((items) => items.filter((item) => !item.isDeleted)),
      catchError(() => of([]))
    );
  }

  getDepartments(): Observable<DataItem[]> {
    return this.api.getDepartments().pipe(
      map((items) => items.filter((item) => !item.isDeleted)),
      catchError(() => of([]))
    );
  }

  getCategories(): Observable<DataItem[]> {
    return this.api.getCategories().pipe(
      map((items) => items.filter((item) => !item.isDeleted)),
      catchError((error) => {
        console.error('Error al cargar categorias', error);
        return of([]);
      })
    );
  }

  getSuppliers(): Observable<DataItem[]> {
    return this.api.getSuppliers().pipe(
      map((items) => items.filter((item) => !item.isDeleted)),
      catchError(() => of([]))
    );
  }

  getItemById(type: EntityType, id: number): Observable<DataItem | null> {
    return this.api.getItemById(type, id).pipe(
      map((item) => item)
    );
  }

  saveItem(type: EntityType, item: DataItem): Observable<DataItem> {
    return this.api.saveItem(type, item);
  }

  deleteItem(type: EntityType, id: number): Observable<boolean> {
    return this.api.deleteItem(type, id).pipe(
      map(() => true)
    );
  }
}

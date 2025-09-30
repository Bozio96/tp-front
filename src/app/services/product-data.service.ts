// src/app/services/product-data.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { DataItem, EntityType } from './product-types';
import { ProductApiService } from './product-api.service';

@Injectable({ providedIn: 'root' })
export class ProductDataService {
  constructor(private api: ProductApiService) {}

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
        console.error('Tipo de entidad no válido:', type);
        return of([]);
    }
  }

  getBrands(): Observable<DataItem[]> {
    return this.api.getBrands().pipe(
      catchError((error) => {
        console.error('Error al cargar marcas', error);
        return of([]);
      })
    );
  }

  getDepartments(): Observable<DataItem[]> {
    return this.api.getDepartments().pipe(
      catchError((error) => {
        console.error('Error al cargar departamentos', error);
        return of([]);
      })
    );
  }

  getCategories(): Observable<DataItem[]> {
    return this.api.getCategories().pipe(
      catchError((error) => {
        console.error('Error al cargar categorías', error);
        return of([]);
      })
    );
  }

  getSuppliers(): Observable<DataItem[]> {
    return this.api.getSuppliers().pipe(
      catchError((error) => {
        console.error('Error al cargar proveedores', error);
        return of([]);
      })
    );
  }

  getItemById(type: EntityType, id: number): Observable<DataItem | null> {
    return this.api.getItemById(type, id).pipe(
      map((item) => item),
      catchError((error) => {
        console.error(`Error al obtener ${type} con ID ${id}`, error);
        return throwError(() => error);
      })
    );
  }

  saveItem(type: EntityType, item: DataItem): Observable<DataItem> {
    return this.api.saveItem(type, item).pipe(
      catchError((error) => {
        console.error(`Error al guardar ${type}`, error);
        return throwError(() => error);
      })
    );
  }

  deleteItem(type: EntityType, id: number): Observable<boolean> {
    return this.api.deleteItem(type, id).pipe(
      map(() => true),
      catchError((error) => {
        console.error(`Error al eliminar ${type}`, error);
        return throwError(() => error);
      })
    );
  }
}

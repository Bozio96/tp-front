// client-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Client } from '../pages/clients/client.model';

@Injectable({ providedIn: 'root' })
export class ClientApiService {
  private readonly baseUrl = 'http://localhost:3000/api';
  private readonly clientsUrl = `${this.baseUrl}/clients`;

  constructor(private http: HttpClient) {}

  getAllClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.clientsUrl).pipe(
      catchError(error => {
        console.error('API - Error al obtener clientes:', error);
        return of([]);
      })
    );
  }

  getClientById(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.clientsUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`API - Error al obtener cliente ${id}:`, error);
        return of({} as Client);
      })
    );
  }

  createClient(client: Client): Observable<Client> {
    return this.http.post<Client>(this.clientsUrl, client).pipe(
      catchError(error => {
        console.error('API - Error al crear cliente:', error);
        return of(client);
      })
    );
  }

  updateClient(client: Client): Observable<Client> {
    return this.http.put<Client>(`${this.clientsUrl}/${client.id}`, client).pipe(
      catchError(error => {
        console.error(`API - Error al actualizar cliente ${client.id}:`, error);
        return of(client);
      })
    );
  }

  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.clientsUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`API - Error al eliminar cliente ${id}:`, error);
        return of(undefined);
      })
    );
  }
}

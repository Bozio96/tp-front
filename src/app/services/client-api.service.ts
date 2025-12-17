import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs'; //Mejor capturar de otra forma el error en vez de un of
import { catchError } from 'rxjs/operators';
import { Client } from '../models/client.model';
import { API_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class ClientApiService {
  private readonly baseUrl = API_URL;
  private readonly clientsUrl = `${this.baseUrl}/clients`;

  constructor(private http: HttpClient) {}

  getAllClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.clientsUrl).pipe(
      catchError(() => of([]))
    );
  }

  getClientById(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.clientsUrl}/${id}`);
  }

  createClient(client: Omit<Client, 'id'>): Observable<Client> {
    return this.http.post<Client>(this.clientsUrl, client);
  }

  updateClient(id: number, payload: Partial<Client>): Observable<Client> {
    return this.http.put<Client>(`${this.clientsUrl}/${id}`, payload);
  }

  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.clientsUrl}/${id}`);
  }
}

//Ver el getItem, saveItem y deleteItem

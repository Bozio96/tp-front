import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ClientApiService } from './client-api.service';
import { Client } from '../models/client.model';

@Injectable({ providedIn: 'root' })
export class ClientService {
  constructor(private api: ClientApiService) {}

  getAllClients(): Observable<Client[]> {
    return this.api.getAllClients().pipe(
      catchError(() => of([]))
    );
  }

  searchClients(term: string): Observable<Client[]> {
    if (!term.trim()) {
      return this.getAllClients();
    }
    return this.getAllClients().pipe(
      map(clients => clients.filter(c => {
        const lowerTerm = term.toLowerCase();
        return (
          c.nombre.toLowerCase().includes(lowerTerm) ||
          c.apellido.toLowerCase().includes(lowerTerm) ||
          (c.dni ?? '').toLowerCase().includes(lowerTerm) ||
          (c.cuil ?? '').toLowerCase().includes(lowerTerm)
        );
      })),
      catchError(() => of([]))
    );
  }

  getClientById(id: number): Observable<Client> {
    return this.api.getClientById(id);
  }

  getClientCount(): Observable<number> {
    return this.getAllClients().pipe(
      map(clients => clients.length)
    );
  }

  addClient(newClient: Omit<Client, 'id'>): Observable<Client> {
    return this.api.createClient(newClient);
  }

  updateClient(id: number, updates: Partial<Client>): Observable<Client> {
    return this.api.updateClient(id, updates);
  }

  deleteClient(id: number): Observable<boolean> {
    return this.api.deleteClient(id).pipe(
      map(() => true)
    );
  }
}

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ClientApiService } from './client-api.service';
import { Client } from '../pages/clients/client.model';

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
      map(clients => clients.filter(c => 
        c.nombre.toLowerCase().includes(term.toLowerCase()) ||
        c.apellido.toLowerCase().includes(term.toLowerCase()) ||
        c.dni.toLowerCase().includes(term.toLowerCase())
      )),
      catchError(() => of([]))
    );
  }

  getClientById(id: number): Observable<Client | undefined> {
    return this.api.getClientById(id).pipe(
      map(client => client),
      catchError(() => of(undefined))
    );
  }

  getClientCount(): Observable<number> {
    return this.getAllClients().pipe(
      map(clients => clients.length)
    );
  }

  addClient(newClient: Client): Observable<Client> {
    return this.api.createClient(newClient).pipe(
      catchError(() => of(newClient))
    );
  }

  updateClient(updatedClient: Client): Observable<Client> {
    return this.api.updateClient(updatedClient).pipe(
      map(client => client),
      catchError(() => of(updatedClient))
    );
  }

  deleteClient(id: number): Observable<boolean> {
    return this.api.deleteClient(id).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}

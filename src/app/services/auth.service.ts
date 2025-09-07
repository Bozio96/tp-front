// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs'; // Importar BehaviorSubject
import { delay, tap } from 'rxjs/operators';

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor() {}

  login(username: string, password: string): Observable<boolean> {
    console.log(`Intentando login para: ${username}`);

    return of(true).pipe(
      delay(1000),
      tap(() => {
        if (username === 'admin' && password === '1234') {
          const user: User = { id: 1, username: 'admin', role: 'admin' };
          this.currentUserSubject.next(user);
          this.isLoggedInSubject.next(true);
          console.log('Login exitoso. Usuario:', user);
        } else if (username === 'user' && password === '12345') {
          const user: User = { id: 2, username: 'user', role: 'user' };
          this.currentUserSubject.next(user);
          this.isLoggedInSubject.next(true);
          console.log('Login exitoso. Usuario:', user);
        } else {
          this.currentUserSubject.next(null);
          this.isLoggedInSubject.next(false);
          console.log('Login fallido: Credenciales inválidas.');
          throw new Error('Credenciales inválidas');
        }
      })
    );
  }

  logout(): void {
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
    console.log('Logout exitoso.');
  }

  

  // Los siguientes métodos ya no son necesarios, pero los dejo por compatibilidad
  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  getUserRole(): 'admin' | 'user' | null {
    return this.currentUserSubject.value?.role || null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
   hasRole(role: 'admin' | 'user'): boolean {
    const user = this.currentUserSubject.value;
    return !!user && user.role === role;
  }
}


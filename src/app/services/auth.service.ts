import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { User } from '../models/user.model';

export interface LoginResponse {
  access_token: string;
}

interface JwtPayload {
  sub: number;
  username: string;
  role: 'admin' | 'user';
  iat: number;
  exp: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromToken();
    this.isLoggedInSubject.next(this.isLoggedIn());
  }

  login(credentials: {username: string, password: string}): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access_token);
        const decodedToken = jwtDecode<JwtPayload>(response.access_token);
        const user: User = {
          id: decodedToken.sub,
          username: decodedToken.username,
          role: decodedToken.role,
        };
        this.currentUserSubject.next(user);
        this.isLoggedInSubject.next(true);
        console.log('Login exitoso. Token guardado y usuario cargado.');
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
    console.log('Logout exitoso.');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: 'admin' | 'user'): boolean {
    const user = this.currentUserSubject.value;
    return !!user && user.role === role;
  }

  getRoles(): string[] {
    return ['admin', 'user'];
  }

  private loadUserFromToken() {
    const token = this.getToken();
    if (token) {
      try {
        const decodedToken = jwtDecode<JwtPayload>(token);
        const user: User = {
          id: decodedToken.sub,
          username: decodedToken.username,
          role: decodedToken.role,
        };
        this.currentUserSubject.next(user);
        this.isLoggedInSubject.next(true);
        console.log('Usuario cargado desde el token.');
      } catch (error) {
        console.error('Error decodificando el token:', error);
        this.logout();
      }
    }
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { User } from '../models/user.model';
import { NotificationService } from './notification.service';

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
  private apiUrl = 'http://localhost:3000'; //Url backend
  private currentUserSubject = new BehaviorSubject<User | null>(null); //Almacena el usuario, es como un estado
  public currentUser$ = this.currentUserSubject.asObservable(); //Cualquiera puede ver esto(suscribirse), PERO NO EDITARLO
  //El $ al final es por convencion que es solo lectura

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private notifications: NotificationService
  ) {
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
    this.clearSession(true);
    console.log('Logout exitoso.');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      this.isLoggedInSubject.next(false);
      return false;
    }

    if (this.isTokenExpired(token)) {
      this.clearSession();
      return false;
    }

    return true;
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

  private loadUserFromToken(): void {
    const token = this.getToken();
    if (!token) {
      return;
    }

    const decodedToken = this.decodeToken(token);
    if (!decodedToken || this.isTokenExpired(token, decodedToken)) {
      this.notifications.showError('No se pudo validar tu sesion, por favor vuelve a iniciar sesion.');
      this.clearSession();
      return;
    }

    const user: User = {
      id: decodedToken.sub,
      username: decodedToken.username,
      role: decodedToken.role,
    };
    this.currentUserSubject.next(user);
    this.isLoggedInSubject.next(true);
    console.log('Usuario cargado desde el token.');
  }

  private decodeToken(token: string): JwtPayload | null {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      return null;
    }
  }

  private isTokenExpired(token: string, decoded?: JwtPayload | null): boolean {
    const payload = decoded ?? this.decodeToken(token);
    if (!payload?.exp) {
      return true;
    }
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp < nowInSeconds;
  }

  private clearSession(redirectToLogin = false): void {
    localStorage.removeItem('access_token');
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
    if (redirectToLogin) {
      this.router.navigate(['/login']);
    }
  }
}

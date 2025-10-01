import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: 'client' | 'agence';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
  };
  errors?: any;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe: string;
  password_confirmation: string;
  role: 'client' | 'agence';
}

export interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly apiUrl = 'http://localhost:8000/api';
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  private readonly isLoadingSubject = new BehaviorSubject<boolean>(false);

  public readonly currentUser$ = this.currentUserSubject.asObservable();
  public readonly isLoading$ = this.isLoadingSubject.asObservable();
  public readonly isAuthenticated$ = this.currentUser$.pipe(map(user => !!user));

  constructor() {
    this.loadUserFromStorage();
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    this.isLoadingSubject.next(true);
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        this.isLoadingSubject.next(false);
        if (response.success && response.data) {
          this.setAuthData(response.data.user, response.data.token);
        }
      })
    );
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.isLoadingSubject.next(true);
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        this.isLoadingSubject.next(false);
        if (response.success && response.data) {
          this.setAuthData(response.data.user, response.data.token);
        }
      })
    );
  }

  logout(): Observable<AuthResponse> {
    this.isLoadingSubject.next(true);
    return this.http.post<AuthResponse>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.isLoadingSubject.next(false);
        this.clearAuthData();
      })
    );
  }

  getCurrentUser(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/user`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.currentUserSubject.next(response.data.user);
        }
      })
    );
  }

  private setAuthData(user: User, token: string): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.router.navigate(['/home']);
  }

  private clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth']);
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('current_user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        this.currentUserSubject.next(user);
      } catch (error) {
        this.clearAuthData();
      }
    }
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getCurrentUserSync(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUserSync();
  }

}

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '@env/environment';

export interface User {
    id: string;
    email: string;
    role: 'student' | 'admin' | 'sponsor' | 'cause';
}

export interface AuthResponse {
    success: boolean;
    data: {
        user: User;
        token: string;
        student?: any;
        admin?: any;
        sponsor?: any;
    };
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private apiUrl = environment.apiUrl;

    currentUser = signal<User | null>(null);
    isAuthenticated = signal<boolean>(false);
    isLoading = signal<boolean>(true);

    constructor(
        private http: HttpClient,
        private router: Router
    ) { }

    checkAuth(): Observable<any> {
        const token = localStorage.getItem('token');
        if (token) {
            return this.http.get<AuthResponse>(`${this.apiUrl}/auth/verify`).pipe(
                tap((response) => {
                    if (response.success) {
                        this.currentUser.set(response.data.user);
                        this.isAuthenticated.set(true);
                    }
                }),
                catchError(() => {
                    this.logout();
                    return of(null);
                }),
                tap(() => this.isLoading.set(false))
            );
        } else {
            this.isLoading.set(false);
            return of(null);
        }
    }

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
            tap((response) => {
                if (response.success) {
                    localStorage.setItem('token', response.data.token);
                    this.currentUser.set(response.data.user);
                    this.isAuthenticated.set(true);
                }
            })
        );
    }

    registerStudent(data: {
        email: string;
        password: string;
        displayName: string;
        age: number;
        parentEmail: string;
    }): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register/student`, data).pipe(
            tap((response) => {
                if (response.success) {
                    localStorage.setItem('token', response.data.token);
                    this.currentUser.set(response.data.user);
                    this.isAuthenticated.set(true);
                }
            })
        );
    }

    registerAdmin(data: {
        email: string;
        password: string;
        name: string;
        organization?: string;
        roleTitle?: string;
    }): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register/admin`, data).pipe(
            tap((response) => {
                if (response.success) {
                    localStorage.setItem('token', response.data.token);
                    this.currentUser.set(response.data.user);
                    this.isAuthenticated.set(true);
                }
            })
        );
    }

    registerSponsor(data: {
        email: string;
        password: string;
        name: string;
    }): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register/sponsor`, data).pipe(
            tap((response) => {
                if (response.success) {
                    localStorage.setItem('token', response.data.token);
                    this.currentUser.set(response.data.user);
                    this.isAuthenticated.set(true);
                }
            })
        );
    }

    logout(): void {
        localStorage.removeItem('token');
        this.currentUser.set(null);
        this.isAuthenticated.set(false);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }
}

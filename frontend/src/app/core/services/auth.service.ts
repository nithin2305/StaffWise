import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, ApiResponse, User, Role } from '../models';
import { CryptoService } from './crypto.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'hrms_token';
  private readonly REFRESH_TOKEN_KEY = 'hrms_refresh_token';
  private readonly USER_KEY = 'hrms_user';

  private _currentUser = signal<User | null>(this.loadUser());
  
  user = computed(() => this._currentUser());
  currentUser = computed(() => this._currentUser());
  isAuthenticated = computed(() => !!this.currentUser());
  userRole = computed(() => this.currentUser()?.role);

  constructor(
    private http: HttpClient,
    private router: Router,
    private cryptoService: CryptoService
  ) {}

  login(email: string, password: string): Observable<ApiResponse<AuthResponse>> {
    // Encrypt password before sending
    const encryptedPassword = this.cryptoService.encryptPassword(password);
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/login`, { 
      email, 
      password: encryptedPassword,
      encrypted: true 
    })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setSession(response.data);
          }
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    this.http.post(`${this.API_URL}/logout`, {}).subscribe({
      complete: () => this.clearSession()
    });
  }

  refreshToken(): Observable<ApiResponse<AuthResponse>> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<ApiResponse<AuthResponse>>(
      `${this.API_URL}/refresh`,
      {},
      { headers: { Authorization: `Bearer ${refreshToken}` } }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setSession(response.data);
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  hasRole(roles: Role[]): boolean {
    const userRole = this.userRole();
    return userRole ? roles.includes(userRole) : false;
  }

  isEmployee(): boolean {
    return this.userRole() === 'EMPLOYEE';
  }

  isHR(): boolean {
    return this.hasRole(['HR', 'SYSTEM_ADMIN']);
  }

  isPayrollChecker(): boolean {
    return this.hasRole(['PAYROLL_CHECKER', 'PAYROLL_ADMIN', 'SYSTEM_ADMIN']);
  }

  isPayrollAdmin(): boolean {
    return this.hasRole(['PAYROLL_ADMIN', 'SYSTEM_ADMIN']);
  }

  isSystemAdmin(): boolean {
    return this.userRole() === 'SYSTEM_ADMIN';
  }

  private setSession(authResult: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authResult.token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, authResult.refreshToken);
    
    const user: User = {
      employeeId: authResult.employeeId,
      empCode: authResult.empCode,
      fullName: authResult.fullName,
      email: authResult.email,
      role: authResult.role,
      department: authResult.department
    };
    
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this._currentUser.set(user);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private loadUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }
}

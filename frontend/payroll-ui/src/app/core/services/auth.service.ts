import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, finalize, map, shareReplay, tap, throwError } from 'rxjs';
import {
  AuthUser,
  LoginRequest,
  LoginResponseData,
  RefreshTokenResponseData,
  UserRole,
} from '../models/auth.model';
import { ApiService } from './api.service';

export type { UserRole } from '../models/auth.model';

const TOKEN_KEY = 'payroll_token';
const REFRESH_TOKEN_KEY = 'payroll_refresh_token';
const USER_KEY = 'payroll_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  private _user = signal<AuthUser | null>(this.readStoredUser());

  /** One in-flight refresh call shared by all callers */
  private refresh$: Observable<string> | null = null;

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user() && !!this.getToken());

  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');
  readonly isEmployee = computed(
    () => this._user()?.role === 'EMPLOYEE' || this._user()?.role === 'MANAGER',
  );

  login(credentials: LoginRequest): Observable<LoginResponseData> {
    return this.api.post<LoginResponseData>('/auth/login', credentials).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.token);
        localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);

        // Fallback to extracting a name from the email if backend doesn't send 'name'
        const displayName = res.name || credentials.email.split('@')[0].replace('.', ' ');

        const user: AuthUser = {
          email: credentials.email,
          name: displayName,
          role: res.role,
          employeeId: res.employeeId,
        };

        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this._user.set(user);
      }),
    );
  }

  /**
   * Calls /auth/refresh, saves BOTH tokens to localStorage,
   * and emits the new access token. Parallel callers share one HTTP call.
   */
  refreshAccessToken(): Observable<string> {
    const currentRefreshToken = this.getRefreshToken();

    if (!currentRefreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    if (!this.refresh$) {
      this.refresh$ = this.api
        .post<RefreshTokenResponseData>('/auth/refresh', { refreshToken: currentRefreshToken })
        .pipe(
          map((res: any) => {
            // Works whether ApiService unwraps `.data` or not
            const payload = res?.data ?? res;
            const newAccess: string | undefined = payload?.accessToken ?? payload?.token;
            const newRefresh: string = payload?.refreshToken ?? currentRefreshToken;

            if (!newAccess) {
              throw new Error('Refresh response did not contain an access token');
            }

            localStorage.setItem(TOKEN_KEY, newAccess);
            localStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);
            return newAccess;
          }),
          finalize(() => (this.refresh$ = null)),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
    }

    return this.refresh$;
  }

  logoutFromServer(): Observable<unknown> {
    const refreshToken = this.getRefreshToken();
    return this.api
      .post<unknown>('/auth/logout', { refreshToken })
      .pipe(finalize(() => this.logout()));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getRole(): UserRole | null {
    return this._user()?.role ?? null;
  }

  private readStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}

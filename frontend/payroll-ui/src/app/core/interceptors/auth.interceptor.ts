import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

function withToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}
function isTokenExpired(token: string | null, skewSeconds = 10): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return !payload.exp || payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
  } catch {
    return false;
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toast = inject(ToastService);

  const isApiCall = req.url.startsWith(environment.apiUrl);
  const isLoginOrRefresh = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');

  if (!isApiCall || isLoginOrRefresh) {
    return next(req);
  }

  const token = authService.getToken();

  const token$ =
    token && isTokenExpired(token) && authService.getRefreshToken()
      ? authService.refreshAccessToken().pipe(
          catchError((err) => {
            authService.logout();
            return throwError(() => err);
          }),
        )
      : of(token);

  return token$.pipe(
    switchMap((validToken) =>
      next(withToken(req, validToken)).pipe(
        catchError((error: unknown) => {
          const isAuthError =
            error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);

          if (!isAuthError) {
            return throwError(() => error);
          }

          return authService.refreshAccessToken().pipe(
            catchError((refreshError) => {
              authService.logout();
              return throwError(() => refreshError);
            }),
            switchMap((newToken) =>
              next(withToken(req, newToken)).pipe(
                catchError((retryError: unknown) => {
                  if (retryError instanceof HttpErrorResponse && retryError.status === 403) {
                    toast.error('You do not have permission to do that.');
                  }
                  return throwError(() => retryError);
                }),
              ),
            ),
          );
        }),
      ),
    ),
  );
};

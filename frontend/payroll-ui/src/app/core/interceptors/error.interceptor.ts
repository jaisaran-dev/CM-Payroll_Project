import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, mergeMap, of, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

interface ApiBody {
  success?: boolean;
  message?: string;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    mergeMap((event: HttpEvent<unknown>) => {
      if (event instanceof HttpResponse) {
        const body = event.body as ApiBody | null;

        // { success: false } replies (even with HTTP 200) become errors
        if (body?.success === false) {
          return throwError(
            () =>
              new HttpErrorResponse({
                error: body,
                status: event.status,
                url: event.url ?? undefined,
              }),
          );
        }

        // Success toast with the API's message
        if (
          req.method !== 'GET' &&
          !req.url.includes('/auth/refresh') &&
          body?.success === true &&
          body.message
        ) {
          toast.success(body.message);
        }
      }
      return of(event);
    }),

    catchError((err: HttpErrorResponse) => {
      const serverMessage: string | undefined = err.error?.message;
      const isLoginCall = req.url.includes('/auth/login');
      const isRefreshCall = req.url.includes('/auth/refresh');

      const isUnauthorized = err.status === 401 && !isLoginCall;
      const isForbidden = err.status === 403 && !isLoginCall;

      // Do not toast here for 401/403 or a failed refresh call:
      // authInterceptor handles refresh, retry, logout and the permission toast.
      if (isUnauthorized || isForbidden || isRefreshCall) {
        return throwError(() => err);
      }

      let message: string;

      if (err.status === 0) {
        message = 'Cannot reach the server. Check your connection.';
      } else {
        message = serverMessage ?? fallbackMessage(err.status);
      }

      toast.error(message);

      return throwError(() => err);
    }),
  );
};

function fallbackMessage(status: number): string {
  if (status === 403) return 'You do not have permission to do that.';
  if (status >= 500) return 'Server error. Please try again later.';
  return 'Something went wrong. Please try again.';
}

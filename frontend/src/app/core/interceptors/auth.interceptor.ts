import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();

  // Add token to request if available
  if (token && !req.url.includes('/auth/login')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/')) {
        // Token expired, try to refresh
        if (!isRefreshing) {
          isRefreshing = true;
          
          return authService.refreshToken().pipe(
            switchMap(response => {
              isRefreshing = false;
              if (response.success && response.data) {
                // Retry the failed request with new token
                const newReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${response.data.token}`
                  }
                });
                return next(newReq);
              }
              authService.logout();
              return throwError(() => error);
            }),
            catchError(refreshError => {
              isRefreshing = false;
              authService.logout();
              return throwError(() => refreshError);
            })
          );
        }
      }

      if (error.status === 403) {
        router.navigate(['/unauthorized']);
      }

      return throwError(() => error);
    })
  );
};

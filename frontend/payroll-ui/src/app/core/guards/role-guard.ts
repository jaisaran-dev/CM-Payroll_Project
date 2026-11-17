// src/app/core/guards/role-guard.ts
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../models/auth.model';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * Used in routes as:  canActivate: [RoleGuard], data: { roles: ['ADMIN'] }
 * - not signed in           -> redirected to /login
 * - signed in, wrong role   -> toast + redirected to the user's own home page
 */
export const RoleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const allowed = (route.data['roles'] ?? []) as UserRole[];
  const role = auth.getRole();

  // No roles listed on the route means any signed-in user may enter
  if (allowed.length === 0 || (role && allowed.includes(role))) {
    return true;
  }

  toast.error('You do not have access to that page.');
  return router.createUrlTree([role === 'ADMIN' ? '/employees' : '/attendance']);
};

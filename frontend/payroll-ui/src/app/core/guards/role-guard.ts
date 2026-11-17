import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../models/auth.model';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const RoleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);
  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }
  const allowed = (route.data['roles'] ?? []) as UserRole[];
  const role = auth.getRole();

  if (allowed.length === 0 || (role && allowed.includes(role))) {
    return true;
  }

  toast.error('You do not have access to that page.');
  return router.createUrlTree([
    role === 'ADMIN' || role === 'SUPER_ADMIN' ? '/employees' : '/attendance',
  ]);
};

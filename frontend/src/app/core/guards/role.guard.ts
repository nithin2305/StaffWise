import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as Role[];

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  if (authService.hasRole(requiredRoles)) {
    return true;
  }

  // Navigate to unauthorized page or home
  router.navigate(['/unauthorized']);
  return false;
};

// Specific role guards for convenience
export const employeeGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const hrGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isHR()) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};

export const payrollCheckerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isPayrollChecker()) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};

export const payrollAdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isPayrollAdmin()) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};

export const systemAdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isSystemAdmin()) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};

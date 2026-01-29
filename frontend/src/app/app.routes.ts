import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/guards';
import { hrGuard, payrollCheckerGuard, payrollAdminGuard, systemAdminGuard } from './core/guards';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/auth/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  // Employee Portal
  {
    path: 'employee',
    loadChildren: () => import('./features/employee/employee.routes').then(m => m.EMPLOYEE_ROUTES),
    canActivate: [authGuard]
  },
  // HR Portal
  {
    path: 'hr',
    loadChildren: () => import('./features/hr/hr.routes').then(m => m.HR_ROUTES),
    canActivate: [authGuard, hrGuard]
  },
  // Payroll Portal
  {
    path: 'payroll',
    loadChildren: () => import('./features/payroll/payroll.routes').then(m => m.PAYROLL_ROUTES),
    canActivate: [authGuard, payrollCheckerGuard]
  },
  // Admin Portal
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [authGuard, systemAdminGuard]
  },
  // Fallback
  {
    path: '**',
    redirectTo: 'login'
  }
];

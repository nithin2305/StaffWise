import { Routes } from '@angular/router';
import { PayrollLayoutComponent } from './payroll-layout.component';
import { payrollCheckerGuard, payrollAdminGuard } from '../../core/guards';

export const PAYROLL_ROUTES: Routes = [
  {
    path: '',
    component: PayrollLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard.component').then(m => m.PayrollDashboardComponent)
      },
      {
        path: 'check',
        loadComponent: () => import('./pages/check.component').then(m => m.CheckPayrollComponent),
        canActivate: [payrollCheckerGuard]  // HR can now check payroll
      },
      {
        path: 'authorize',
        loadComponent: () => import('./pages/authorize.component').then(m => m.AuthorizePayrollComponent),
        canActivate: [payrollAdminGuard]  // Payroll Admin authorizes
      },
      {
        path: 'process',
        loadComponent: () => import('./pages/process.component').then(m => m.ProcessPayrollComponent),
        canActivate: [payrollAdminGuard]  // Payroll Admin processes (same as authorize)
      },
      {
        path: 'runs',
        loadComponent: () => import('./pages/runs.component').then(m => m.PayrollRunsListComponent)
      }
    ]
  }
];

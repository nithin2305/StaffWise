import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users.component').then(m => m.AdminUsersComponent)
      },
      {
        path: 'roles',
        loadComponent: () => import('./pages/roles.component').then(m => m.AdminRolesComponent)
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./pages/audit-logs.component').then(m => m.AuditLogsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings.component').then(m => m.AdminSettingsComponent)
      }
    ]
  }
];

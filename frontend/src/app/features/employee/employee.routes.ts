import { Routes } from '@angular/router';
import { EmployeeLayoutComponent } from './employee-layout.component';

export const EMPLOYEE_ROUTES: Routes = [
  {
    path: '',
    component: EmployeeLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () => import('./pages/dashboard.component').then(m => m.EmployeeDashboardComponent)
      },
      { 
        path: 'attendance', 
        loadComponent: () => import('./pages/attendance.component').then(m => m.AttendanceComponent)
      },
      { 
        path: 'leave', 
        loadComponent: () => import('./pages/leave.component').then(m => m.LeaveComponent)
      },
      { 
        path: 'requests', 
        loadComponent: () => import('./pages/requests.component').then(m => m.RequestsComponent)
      },
      { 
        path: 'payslip', 
        loadComponent: () => import('./pages/payslip.component').then(m => m.PayslipComponent)
      },
      { 
        path: 'profile', 
        loadComponent: () => import('./pages/profile.component').then(m => m.ProfileComponent)
      }
    ]
  }
];

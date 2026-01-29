import { Routes } from '@angular/router';
import { HrLayoutComponent } from './hr-layout.component';

export const HR_ROUTES: Routes = [
  {
    path: '',
    component: HrLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () => import('./pages/dashboard.component').then(m => m.HrDashboardComponent)
      },
      { 
        path: 'employees', 
        loadComponent: () => import('./pages/employees.component').then(m => m.EmployeesComponent)
      },
      { 
        path: 'attendance', 
        loadComponent: () => import('./pages/attendance.component').then(m => m.HrAttendanceComponent)
      },
      { 
        path: 'leave-approval', 
        loadComponent: () => import('./pages/leave-approval.component').then(m => m.LeaveApprovalComponent)
      },
      { 
        path: 'requests', 
        loadComponent: () => import('./pages/requests.component').then(m => m.HrRequestsComponent)
      },
      { 
        path: 'payroll-compute', 
        loadComponent: () => import('./pages/payroll-compute.component').then(m => m.PayrollComputeComponent)
      },
      { 
        path: 'payroll-runs', 
        loadComponent: () => import('./pages/payroll-runs.component').then(m => m.PayrollRunsComponent)
      }
    ]
  }
];

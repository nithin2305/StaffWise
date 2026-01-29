import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="roles-page">
      <div class="card">
        <div class="card-header">
          <h3>Roles & Permissions</h3>
        </div>
        <div class="card-body">
          <div class="roles-list">
            @for (role of roles(); track role.name) {
              <div class="role-card">
                <div class="role-header">
                  <span class="role-icon material-icons">{{ role.icon }}</span>
                  <div class="role-info">
                    <h4>{{ role.displayName }}</h4>
                    <p>{{ role.description }}</p>
                  </div>
                </div>
                <div class="permissions">
                  <h5>Permissions</h5>
                  <ul>
                    @for (perm of role.permissions; track perm) {
                      <li>
                        <span class="material-icons check">check_circle</span>
                        {{ perm }}
                      </li>
                    }
                  </ul>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .roles-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .card {
      background: white;
      border-radius: 12px;
      box-shadow: var(--shadow-sm);
    }

    .card-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      h3 { margin: 0; }
    }

    .card-body { padding: 1.5rem; }

    .roles-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .role-card {
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
    }

    .role-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
      color: white;

      .role-icon { font-size: 2.5rem; }

      .role-info {
        h4 { margin: 0; }
        p { margin: 0.25rem 0 0; opacity: 0.8; font-size: 0.875rem; }
      }
    }

    .permissions {
      padding: 1rem 1.5rem;

      h5 {
        margin: 0 0 0.75rem;
        color: var(--text-secondary);
        font-size: 0.75rem;
        text-transform: uppercase;
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.875rem;

          &:last-child { border-bottom: none; }

          .check { color: #10b981; font-size: 1rem; }
        }
      }
    }
  `]
})
export class AdminRolesComponent {
  roles = signal([
    {
      name: 'EMPLOYEE',
      displayName: 'Employee',
      icon: 'person',
      description: 'Standard employee access',
      permissions: [
        'View own profile',
        'Check-in/Check-out',
        'Apply for leave',
        'Submit late coming requests',
        'Submit overtime requests',
        'View own payslips'
      ]
    },
    {
      name: 'HR',
      displayName: 'HR Manager',
      icon: 'people',
      description: 'Human Resources management',
      permissions: [
        'All Employee permissions',
        'Manage employee records',
        'View all attendance',
        'Approve/Reject leave requests',
        'Approve/Reject late/overtime requests',
        'Compute payroll'
      ]
    },
    {
      name: 'PAYROLL_CHECKER',
      displayName: 'Payroll Checker',
      icon: 'fact_check',
      description: 'Payroll verification',
      permissions: [
        'View computed payroll',
        'Check and verify payroll',
        'Approve payroll for authorization',
        'Reject payroll with remarks'
      ]
    },
    {
      name: 'PAYROLL_ADMIN',
      displayName: 'Payroll Admin',
      icon: 'payments',
      description: 'Payroll administration',
      permissions: [
        'All Payroll Checker permissions',
        'Authorize checked payroll',
        'Process payroll payments',
        'View payroll reports'
      ]
    },
    {
      name: 'SYSTEM_ADMIN',
      displayName: 'System Admin',
      icon: 'admin_panel_settings',
      description: 'Full system access',
      permissions: [
        'All permissions',
        'Manage all users',
        'Assign/Change user roles',
        'View audit logs',
        'System configuration'
      ]
    }
  ]);
}

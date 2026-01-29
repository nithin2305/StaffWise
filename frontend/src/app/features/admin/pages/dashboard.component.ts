import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="material-icons">people</span>
          <div class="stat-info">
            <h4>{{ stats().totalEmployees }}</h4>
            <p>Total Employees</p>
          </div>
        </div>
        <div class="stat-card">
          <span class="material-icons">person_add</span>
          <div class="stat-info">
            <h4>{{ stats().activeEmployees }}</h4>
            <p>Active Employees</p>
          </div>
        </div>
        <div class="stat-card">
          <span class="material-icons">admin_panel_settings</span>
          <div class="stat-info">
            <h4>{{ stats().totalAdmins }}</h4>
            <p>System Admins</p>
          </div>
        </div>
        <div class="stat-card">
          <span class="material-icons">history</span>
          <div class="stat-info">
            <h4>{{ stats().todayLogins }}</h4>
            <p>Today's Logins</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions & Activity -->
      <div class="content-grid">
        <!-- Quick Actions -->
        <div class="card">
          <div class="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div class="card-body">
            <div class="quick-actions">
              <a routerLink="/admin/users" class="action-item">
                <span class="material-icons">person_add</span>
                <span>Add User</span>
              </a>
              <a routerLink="/admin/roles" class="action-item">
                <span class="material-icons">security</span>
                <span>Manage Roles</span>
              </a>
              <a routerLink="/admin/audit-logs" class="action-item">
                <span class="material-icons">history</span>
                <span>View Logs</span>
              </a>
              <a routerLink="/admin/settings" class="action-item">
                <span class="material-icons">settings</span>
                <span>Settings</span>
              </a>
            </div>
          </div>
        </div>

        <!-- User Distribution -->
        <div class="card">
          <div class="card-header">
            <h3>User Distribution by Role</h3>
          </div>
          <div class="card-body">
            <div class="role-distribution">
              @for (role of roleDistribution(); track role.role) {
                <div class="role-item">
                  <div class="role-info">
                    <span class="role-name">{{ role.role | titlecase }}</span>
                    <span class="role-count">{{ role.count }}</span>
                  </div>
                  <div class="role-bar">
                    <div class="bar-fill" [style.width.%]="role.percentage"></div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card">
        <div class="card-header">
          <h3>Recent Activity</h3>
          <a routerLink="/admin/audit-logs" class="view-all">View All Logs</a>
        </div>
        <div class="card-body">
          @if (recentActivity().length > 0) {
            <table class="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                @for (log of recentActivity(); track log.id) {
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="avatar">{{ getInitials(log.username || '') }}</div>
                        <span>{{ log.username }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="action-badge" [class]="log.action?.toLowerCase()">
                        {{ log.action }}
                      </span>
                    </td>
                    <td>{{ log.entityType }}</td>
                    <td class="details-cell">{{ log.details }}</td>
                    <td>{{ log.timestamp | date:'medium' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <div class="empty-state">
              <span class="material-icons">history</span>
              <p>No recent activity</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: var(--shadow-sm);

      .material-icons {
        font-size: 2.5rem;
        color: #7c3aed;
      }

      .stat-info {
        h4 { margin: 0; font-size: 1.75rem; }
        p { margin: 0; color: var(--text-secondary); }
      }
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
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
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 { margin: 0; }
      .view-all {
        color: var(--primary-color);
        text-decoration: none;
        font-size: 0.875rem;
        &:hover { text-decoration: underline; }
      }
    }

    .card-body { padding: 1.5rem; }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .action-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s;

      .material-icons { color: #7c3aed; }

      &:hover {
        border-color: #7c3aed;
        background: #f5f3ff;
      }
    }

    .role-distribution {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .role-item {
      .role-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;

        .role-name { font-weight: 500; }
        .role-count { color: var(--text-secondary); }
      }

      .role-bar {
        height: 8px;
        background: var(--bg-secondary);
        border-radius: 4px;
        overflow: hidden;

        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #7c3aed, #a78bfa);
          border-radius: 4px;
        }
      }
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
      }

      th {
        font-weight: 600;
        color: var(--text-secondary);
        font-size: 0.75rem;
        text-transform: uppercase;
      }

      .details-cell {
        max-width: 200px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #7c3aed;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 600;
      }
    }

    .action-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;

      &.login { background: #d1fae5; color: #047857; }
      &.logout { background: #fef3c7; color: #b45309; }
      &.create { background: #dbeafe; color: #1d4ed8; }
      &.update { background: #e0e7ff; color: #4f46e5; }
      &.delete { background: #fee2e2; color: #b91c1c; }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      color: var(--text-secondary);
      .material-icons { font-size: 2rem; margin-bottom: 0.5rem; }
    }

    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .content-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  stats = signal({
    totalEmployees: 0,
    activeEmployees: 0,
    totalAdmins: 0,
    todayLogins: 0
  });

  roleDistribution = signal<{ role: string; count: number; percentage: number }[]>([]);
  recentActivity = signal<any[]>([]);

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.adminService.getDashboardStats().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stats.set(res.data);
        }
      }
    });

    this.adminService.getRoleDistribution().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const total = res.data.reduce((sum: number, r: any) => sum + r.count, 0);
          const distribution = res.data.map((r: any) => ({
            ...r,
            percentage: total > 0 ? (r.count / total) * 100 : 0
          }));
          this.roleDistribution.set(distribution);
        }
      }
    });

    this.adminService.getAuditLogs(0, 10).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.recentActivity.set(res.data.content || res.data);
        }
      }
    });
  }

  getInitials(name: string): string {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '';
  }
}

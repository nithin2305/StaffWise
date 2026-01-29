import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HrService } from '../../../core/services/hr.service';
import { Employee, EmployeeRequest, PayrollRun } from '../../../core/models';

@Component({
  selector: 'app-hr-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon employees">
            <span class="material-icons">people</span>
          </div>
          <div class="stat-info">
            <h3>{{ totalEmployees() }}</h3>
            <p>Total Employees</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon active">
            <span class="material-icons">person_check</span>
          </div>
          <div class="stat-info">
            <h3>{{ activeEmployees() }}</h3>
            <p>Active Employees</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon pending">
            <span class="material-icons">pending_actions</span>
          </div>
          <div class="stat-info">
            <h3>{{ pendingLeaves() }}</h3>
            <p>Pending Leave Requests</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon payroll">
            <span class="material-icons">payments</span>
          </div>
          <div class="stat-info">
            <h3>{{ pendingPayrolls() }}</h3>
            <p>Payroll Pending</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <a routerLink="../employees" class="action-card">
          <span class="material-icons">person_add</span>
          <span>Add Employee</span>
        </a>
        <a routerLink="../payroll-compute" class="action-card">
          <span class="material-icons">calculate</span>
          <span>Compute Payroll</span>
        </a>
        <a routerLink="../leave-approval" class="action-card">
          <span class="material-icons">event_available</span>
          <span>Approve Leaves</span>
        </a>
        <a routerLink="../attendance" class="action-card">
          <span class="material-icons">access_time</span>
          <span>Manage Attendance</span>
        </a>
      </div>

      <div class="content-grid">
        <!-- Pending Leave Requests -->
        <div class="card">
          <div class="card-header">
            <h3>Pending Leave Requests</h3>
            <a routerLink="../leave-approval" class="view-all">View All</a>
          </div>
          <div class="card-body">
            @if (pendingLeaveRequests().length > 0) {
              <div class="request-list">
                @for (request of pendingLeaveRequests().slice(0, 5); track request.id) {
                  <div class="request-item">
                    <div class="request-info">
                      <span class="employee-name">{{ request.employeeName }}</span>
                      <span class="request-details">
                        {{ request.leaveType | titlecase }} - {{ request.days }} days
                      </span>
                      <span class="request-date">{{ request.startDate | date:'mediumDate' }}</span>
                    </div>
                    <div class="request-actions">
                      <button class="btn btn-sm btn-success" (click)="approveLeave(request.id!)">
                        <span class="material-icons">check</span>
                      </button>
                      <button class="btn btn-sm btn-danger" (click)="rejectLeave(request.id!)">
                        <span class="material-icons">close</span>
                      </button>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="empty-state">
                <span class="material-icons">event_busy</span>
                <p>No pending leave requests</p>
              </div>
            }
          </div>
        </div>

        <!-- Recent Payroll Runs -->
        <div class="card">
          <div class="card-header">
            <h3>Recent Payroll Runs</h3>
            <a routerLink="../payroll-runs" class="view-all">View All</a>
          </div>
          <div class="card-body">
            @if (recentPayrollRuns().length > 0) {
              <div class="payroll-list">
                @for (run of recentPayrollRuns().slice(0, 5); track run.id) {
                  <div class="payroll-item">
                    <div class="payroll-info">
                      <span class="period">{{ getMonthName(run.month) }} {{ run.year }}</span>
                      <span class="employees">{{ run.totalEmployees }} employees</span>
                    </div>
                    <span class="status-badge" [class]="run.status.toLowerCase()">
                      {{ run.status | titlecase }}
                    </span>
                  </div>
                }
              </div>
            } @else {
              <div class="empty-state">
                <span class="material-icons">payments</span>
                <p>No payroll runs found</p>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Recent Employees -->
      <div class="card">
        <div class="card-header">
          <h3>Recent Employees</h3>
          <a routerLink="../employees" class="view-all">View All</a>
        </div>
        <div class="card-body">
          @if (recentEmployees().length > 0) {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Join Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (emp of recentEmployees().slice(0, 5); track emp.id) {
                  <tr>
                    <td>
                      <div class="employee-cell">
                        <div class="avatar">{{ getInitials(emp.fullName) }}</div>
                        <div class="details">
                          <span class="name">{{ emp.fullName }}</span>
                          <span class="code">{{ emp.empCode }}</span>
                        </div>
                      </div>
                    </td>
                    <td>{{ emp.departmentName }}</td>
                    <td>{{ emp.designation }}</td>
                    <td>{{ emp.dateOfJoining | date:'mediumDate' }}</td>
                    <td>
                      <span class="status-badge" [class]="emp.active ? 'active' : 'inactive'">
                        {{ emp.active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <div class="empty-state">
              <span class="material-icons">people</span>
              <p>No employees found</p>
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
    }

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      &.employees { background: #dbeafe; color: #2563eb; }
      &.active { background: #d1fae5; color: #059669; }
      &.pending { background: #fef3c7; color: #d97706; }
      &.payroll { background: #e0e7ff; color: #4f46e5; }

      .material-icons { font-size: 1.5rem; }
    }

    .stat-info {
      h3 { margin: 0; font-size: 1.5rem; color: var(--text-primary); }
      p { margin: 0.25rem 0 0; font-size: 0.875rem; color: var(--text-secondary); }
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      text-decoration: none;
      color: var(--text-primary);
      box-shadow: var(--shadow-sm);
      transition: all 0.3s ease;

      .material-icons {
        font-size: 2rem;
        color: var(--primary-color);
      }

      &:hover {
        transform: translateY(-3px);
        box-shadow: var(--shadow-md);
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
      overflow: hidden;
    }

    .card-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 { margin: 0; font-size: 1.125rem; color: var(--text-primary); }
      .view-all { font-size: 0.875rem; color: var(--primary-color); text-decoration: none; }
    }

    .card-body { padding: 1rem 1.5rem; }

    .request-list, .payroll-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .request-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: var(--bg-secondary);
      border-radius: 8px;
    }

    .request-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      .employee-name { font-weight: 600; color: var(--text-primary); }
      .request-details { font-size: 0.875rem; color: var(--text-secondary); }
      .request-date { font-size: 0.75rem; color: var(--text-light); }
    }

    .request-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-sm {
      padding: 0.375rem;
      .material-icons { font-size: 1rem; }
    }

    .payroll-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: var(--bg-secondary);
      border-radius: 8px;
    }

    .payroll-info {
      display: flex;
      flex-direction: column;

      .period { font-weight: 600; color: var(--text-primary); }
      .employees { font-size: 0.875rem; color: var(--text-secondary); }
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;

      &.computed { background: #fef3c7; color: #b45309; }
      &.checked { background: #dbeafe; color: #1d4ed8; }
      &.authorized { background: #e0e7ff; color: #4f46e5; }
      &.processed { background: #d1fae5; color: #047857; }
      &.active { background: #d1fae5; color: #047857; }
      &.inactive { background: #fee2e2; color: #b91c1c; }
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
        background: var(--bg-secondary);
      }
    }

    .employee-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--primary-color);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .details {
        display: flex;
        flex-direction: column;

        .name { font-weight: 500; color: var(--text-primary); }
        .code { font-size: 0.75rem; color: var(--text-secondary); }
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      color: var(--text-secondary);

      .material-icons { font-size: 2.5rem; margin-bottom: 0.5rem; }
    }

    @media (max-width: 1024px) {
      .stats-grid, .quick-actions { grid-template-columns: repeat(2, 1fr); }
      .content-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class HrDashboardComponent implements OnInit {
  private hrService = inject(HrService);

  totalEmployees = signal(0);
  activeEmployees = signal(0);
  pendingLeaves = signal(0);
  pendingPayrolls = signal(0);

  recentEmployees = signal<Employee[]>([]);
  pendingLeaveRequests = signal<EmployeeRequest[]>([]);
  recentPayrollRuns = signal<PayrollRun[]>([]);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.hrService.getAllEmployees().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.recentEmployees.set(res.data);
          this.totalEmployees.set(res.data.length);
          this.activeEmployees.set(res.data.filter(e => e.active).length);
        }
      }
    });

    this.hrService.getPendingLeaveRequests().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.pendingLeaveRequests.set(res.data);
          this.pendingLeaves.set(res.data.length);
        }
      }
    });

    this.hrService.getPayrollRuns().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.recentPayrollRuns.set(res.data);
          const pending = res.data.filter(r => 
            r.status === 'COMPUTED' || r.status === 'CHECKED'
          ).length;
          this.pendingPayrolls.set(pending);
        }
      }
    });
  }

  approveLeave(id: number): void {
    this.hrService.approveRequest(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadDashboardData();
        }
      }
    });
  }

  rejectLeave(id: number): void {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      this.hrService.rejectRequest(id, reason).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadDashboardData();
          }
        }
      });
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getMonthName(month: number): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  }
}

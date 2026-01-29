import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmployeeService } from '../../../core/services/employee.service';
import { Attendance, LeaveBalance, EmployeeRequest } from '../../../core/models';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <!-- Quick Actions -->
      <div class="quick-actions">
        <a routerLink="../attendance" class="action-card attendance">
          <span class="material-icons">access_time</span>
          <span>My Attendance</span>
        </a>
        <a routerLink="../leave" class="action-card leave">
          <span class="material-icons">event_busy</span>
          <span>Apply Leave</span>
        </a>
        <a routerLink="../requests" class="action-card request">
          <span class="material-icons">add_circle</span>
          <span>New Request</span>
        </a>
        <a routerLink="../profile" class="action-card profile">
          <span class="material-icons">person</span>
          <span>My Profile</span>
        </a>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon attendance">
            <span class="material-icons">access_time</span>
          </div>
          <div class="stat-info">
            <h3>{{ todayAttendance()?.checkIn || '--:--' }}</h3>
            <p>Today's Check-in</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon hours">
            <span class="material-icons">schedule</span>
          </div>
          <div class="stat-info">
            <h3>{{ workingHours() }}</h3>
            <p>Working Hours Today</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon pending">
            <span class="material-icons">pending_actions</span>
          </div>
          <div class="stat-info">
            <h3>{{ pendingRequests() }}</h3>
            <p>Pending Requests</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon leave-bal">
            <span class="material-icons">beach_access</span>
          </div>
          <div class="stat-info">
            <h3>{{ totalLeaveBalance() }}</h3>
            <p>Leave Balance</p>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <!-- Leave Balances -->
        <div class="card leave-balances">
          <div class="card-header">
            <h3>Leave Balances</h3>
            <a routerLink="../leave" class="view-all">View All</a>
          </div>
          <div class="card-body">
            @if (leaveBalances().length > 0) {
              <div class="balance-list">
                @for (balance of leaveBalances(); track balance.leaveType) {
                  <div class="balance-item">
                    <div class="balance-type">
                      <span class="type-icon" [class]="balance.leaveType.toLowerCase()">
                        @switch (balance.leaveType) {
                          @case ('ANNUAL') { <span class="material-icons">wb_sunny</span> }
                          @case ('SICK') { <span class="material-icons">local_hospital</span> }
                          @case ('PERSONAL') { <span class="material-icons">person</span> }
                          @default { <span class="material-icons">event</span> }
                        }
                      </span>
                      <span class="type-name">{{ balance.leaveType | titlecase }}</span>
                    </div>
                    <div class="balance-value">
                      <span class="available">{{ balance.balance }}</span>
                      <span class="total">/ {{ balance.entitled }}</span>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="empty-state">
                <span class="material-icons">info</span>
                <p>No leave balances found</p>
              </div>
            }
          </div>
        </div>

        <!-- Recent Requests -->
        <div class="card recent-requests">
          <div class="card-header">
            <h3>Recent Requests</h3>
            <a routerLink="../requests" class="view-all">View All</a>
          </div>
          <div class="card-body">
            @if (recentRequests().length > 0) {
              <div class="request-list">
                @for (request of recentRequests().slice(0, 5); track request.id) {
                  <div class="request-item">
                    <div class="request-info">
                      <span class="request-type">{{ request.requestType | titlecase }}</span>
                      <span class="request-date">{{ request.createdAt | date:'mediumDate' }}</span>
                    </div>
                    <span class="status-badge" [class]="request.status.toLowerCase()">
                      {{ request.status }}
                    </span>
                  </div>
                }
              </div>
            } @else {
              <div class="empty-state">
                <span class="material-icons">inbox</span>
                <p>No recent requests</p>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Recent Attendance -->
      <div class="card attendance-history">
        <div class="card-header">
          <h3>Recent Attendance</h3>
          <a routerLink="../attendance" class="view-all">View All</a>
        </div>
        <div class="card-body">
          @if (recentAttendance().length > 0) {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (att of recentAttendance().slice(0, 5); track att.id) {
                  <tr>
                    <td>{{ att.attendanceDate | date:'mediumDate' }}</td>
                    <td>{{ att.checkIn || '-' }}</td>
                    <td>{{ att.checkOut || '-' }}</td>
                    <td>{{ att.workingHours || 0 | number:'1.1-1' }} hrs</td>
                    <td>
                      <span class="status-badge" [class]="att.status?.toLowerCase() || 'present'">
                        {{ att.status || 'PRESENT' }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <div class="empty-state">
              <span class="material-icons">event_available</span>
              <p>No attendance records found</p>
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

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      color: white;
      font-weight: 600;

      .material-icons {
        font-size: 2rem;
      }

      &.attendance {
        background: linear-gradient(135deg, #10b981, #059669);
      }

      &.leave {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      }

      &.request {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
      }

      &.profile {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      }
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

      &.attendance { background: #dbeafe; color: #2563eb; }
      &.hours { background: #d1fae5; color: #059669; }
      &.pending { background: #fef3c7; color: #d97706; }
      &.leave-bal { background: #e0e7ff; color: #4f46e5; }

      .material-icons {
        font-size: 1.5rem;
      }
    }

    .stat-info {
      h3 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--text-primary);
      }

      p {
        margin: 0.25rem 0 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
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
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color);

      h3 {
        margin: 0;
        font-size: 1.125rem;
        color: var(--text-primary);
      }

      .view-all {
        font-size: 0.875rem;
        color: var(--primary-color);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .card-body {
      padding: 1rem 1.5rem;
    }

    .balance-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .balance-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      background: var(--bg-secondary);
      border-radius: 8px;
    }

    .balance-type {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .type-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      &.annual { background: #dbeafe; color: #2563eb; }
      &.sick { background: #fee2e2; color: #dc2626; }
      &.personal { background: #d1fae5; color: #059669; }

      .material-icons {
        font-size: 1.25rem;
      }
    }

    .type-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .balance-value {
      .available {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .total {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
    }

    .request-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .request-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      background: var(--bg-secondary);
      border-radius: 8px;
    }

    .request-info {
      display: flex;
      flex-direction: column;
    }

    .request-type {
      font-weight: 500;
      color: var(--text-primary);
    }

    .request-date {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;

      &.pending { background: #fef3c7; color: #b45309; }
      &.approved { background: #d1fae5; color: #047857; }
      &.rejected { background: #fee2e2; color: #b91c1c; }
      &.present { background: #d1fae5; color: #047857; }
      &.absent { background: #fee2e2; color: #b91c1c; }
      &.late { background: #fef3c7; color: #b45309; }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      color: var(--text-secondary);

      .material-icons {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
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
        letter-spacing: 0.5px;
      }

      td {
        color: var(--text-primary);
      }

      tbody tr:last-child td {
        border-bottom: none;
      }
    }

    @media (max-width: 1024px) {
      .quick-actions,
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .quick-actions,
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class EmployeeDashboardComponent implements OnInit {
  private employeeService = inject(EmployeeService);

  todayAttendance = signal<Attendance | null>(null);
  leaveBalances = signal<LeaveBalance[]>([]);
  recentRequests = signal<EmployeeRequest[]>([]);
  recentAttendance = signal<Attendance[]>([]);

  workingHours = signal('0.0 hrs');
  pendingRequests = signal(0);
  totalLeaveBalance = signal(0);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Load attendance
    this.employeeService.getMyAttendance().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.recentAttendance.set(res.data);
          
          // Find today's attendance
          const today = new Date().toISOString().split('T')[0];
          const todayAtt = res.data.find(a => a.attendanceDate === today);
          if (todayAtt) {
            this.todayAttendance.set(todayAtt);
            this.workingHours.set((todayAtt.workingHours || 0).toFixed(1) + ' hrs');
          }
        }
      }
    });

    // Load leave balances
    this.employeeService.getMyLeaveBalances().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.leaveBalances.set(res.data);
          const total = res.data.reduce((sum, b) => sum + b.balance, 0);
          this.totalLeaveBalance.set(total);
        }
      }
    });

    // Load requests
    this.employeeService.getMyRequests().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.recentRequests.set(res.data);
          const pending = res.data.filter(r => r.status === 'PENDING').length;
          this.pendingRequests.set(pending);
        }
      }
    });
  }

}

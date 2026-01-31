import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PayrollService } from '../../../core/services/payroll.service';
import { AuthService } from '../../../core/services/auth.service';
import { PayrollRun } from '../../../core/models';

@Component({
  selector: 'app-payroll-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="material-icons">pending_actions</span>
          <div class="stat-info">
            <h4>{{ stats().pendingCheck }}</h4>
            <p>Pending Check</p>
          </div>
        </div>
        @if (authService.isPayrollAdmin()) {
          <div class="stat-card">
            <span class="material-icons">fact_check</span>
            <div class="stat-info">
              <h4>{{ stats().pendingAuthorize }}</h4>
              <p>Pending Authorize</p>
            </div>
          </div>
          <div class="stat-card">
            <span class="material-icons">account_balance</span>
            <div class="stat-info">
              <h4>{{ stats().pendingProcess }}</h4>
              <p>Pending Process</p>
            </div>
          </div>
        }
        <div class="stat-card">
          <span class="material-icons">check_circle</span>
          <div class="stat-info">
            <h4>{{ stats().processedThisMonth }}</h4>
            <p>Processed (Month)</p>
          </div>
        </div>
      </div>

      <!-- Workflow Status -->
      <div class="card">
        <div class="card-header">
          <h3>Payroll Workflow</h3>
        </div>
        <div class="card-body">
          <div class="workflow">
            <div class="workflow-step" [class.active]="stats().pendingCheck > 0">
              <div class="step-icon">
                <span class="material-icons">calculate</span>
              </div>
              <div class="step-info">
                <h4>Compute</h4>
                <p>HR computes payroll</p>
              </div>
              <span class="count">{{ stats().pendingCheck }}</span>
            </div>
            <div class="workflow-arrow">
              <span class="material-icons">arrow_forward</span>
            </div>
            <div class="workflow-step" [class.active]="stats().pendingAuthorize > 0">
              <div class="step-icon">
                <span class="material-icons">fact_check</span>
              </div>
              <div class="step-info">
                <h4>Check</h4>
                <p>Checker verifies</p>
              </div>
              <span class="count">{{ stats().pendingAuthorize }}</span>
            </div>
            <div class="workflow-arrow">
              <span class="material-icons">arrow_forward</span>
            </div>
            <div class="workflow-step" [class.active]="stats().pendingProcess > 0">
              <div class="step-icon">
                <span class="material-icons">gavel</span>
              </div>
              <div class="step-info">
                <h4>Authorize</h4>
                <p>Admin authorizes</p>
              </div>
              <span class="count">{{ stats().pendingProcess }}</span>
            </div>
            <div class="workflow-arrow">
              <span class="material-icons">arrow_forward</span>
            </div>
            <div class="workflow-step">
              <div class="step-icon done">
                <span class="material-icons">account_balance</span>
              </div>
              <div class="step-info">
                <h4>Process</h4>
                <p>Payment processed</p>
              </div>
              <span class="count done">{{ stats().processedThisMonth }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Cards -->
      <div class="action-grid">
        @if (authService.isPayrollChecker() || authService.isPayrollAdmin()) {
          <div class="action-card" routerLink="/payroll/check">
            <span class="material-icons">fact_check</span>
            <h4>Check Payroll</h4>
            <p>Verify computed payroll runs</p>
            <span class="badge">{{ stats().pendingCheck }} pending</span>
          </div>
        }
        @if (authService.isPayrollAdmin()) {
          <div class="action-card" routerLink="/payroll/authorize">
            <span class="material-icons">gavel</span>
            <h4>Authorize Payroll</h4>
            <p>Authorize checked payroll</p>
            <span class="badge">{{ stats().pendingAuthorize }} pending</span>
          </div>
          <div class="action-card" routerLink="/payroll/process">
            <span class="material-icons">account_balance</span>
            <h4>Process Payment</h4>
            <p>Process authorized payroll</p>
            <span class="badge">{{ stats().pendingProcess }} pending</span>
          </div>
        }
      </div>

      <!-- Recent Runs -->
      <div class="card">
        <div class="card-header">
          <h3>Recent Payroll Runs</h3>
          <a routerLink="/payroll/runs" class="view-all">View All</a>
        </div>
        <div class="card-body">
          @if (recentRuns().length > 0) {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Employees</th>
                  <th>Total Net</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (run of recentRuns(); track run.id) {
                  <tr>
                    <td>{{ getMonthName(run.month) }} {{ run.year }}</td>
                    <td>{{ run.totalEmployees }}</td>
                    <td>{{ (run.totalNetPay || run.totalNet) | currency:'INR':'symbol':'1.0-0' }}</td>
                    <td>
                      <span class="status-badge" [class]="run.status.toLowerCase()">
                        {{ run.status | titlecase }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <div class="empty-state">
              <span class="material-icons">payments</span>
              <p>No recent payroll runs</p>
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
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
        color: #059669;
      }

      .stat-info {
        h4 { margin: 0; font-size: 1.75rem; }
        p { margin: 0; color: var(--text-secondary); }
      }
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

    .workflow {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .workflow-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 12px;
      background: var(--bg-secondary);
      min-width: 120px;

      .step-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        .material-icons { font-size: 1.5rem; color: var(--text-secondary); }
        &.done { background: #d1fae5; .material-icons { color: #047857; } }
      }

      .step-info {
        text-align: center;
        h4 { margin: 0; font-size: 0.875rem; }
        p { margin: 0; font-size: 0.75rem; color: var(--text-secondary); }
      }

      .count {
        background: #fef3c7;
        color: #b45309;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        &.done { background: #d1fae5; color: #047857; }
      }

      &.active {
        background: #fef3c7;
        .step-icon { background: #fbbf24; .material-icons { color: white; } }
      }
    }

    .workflow-arrow {
      .material-icons { color: var(--text-secondary); }
    }

    .action-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .action-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: var(--shadow-sm);

      .material-icons {
        font-size: 2rem;
        color: #059669;
        margin-bottom: 0.5rem;
      }

      h4 { margin: 0 0 0.25rem; }
      p { margin: 0 0 0.5rem; color: var(--text-secondary); font-size: 0.875rem; }

      .badge {
        background: #fef3c7;
        color: #b45309;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
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
    }

    .status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;

      &.computed { background: #fef3c7; color: #b45309; }
      &.checked { background: #dbeafe; color: #1d4ed8; }
      &.authorized { background: #e0e7ff; color: #4f46e5; }
      &.processed { background: #d1fae5; color: #047857; }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      color: var(--text-secondary);
      .material-icons { font-size: 2rem; margin-bottom: 0.5rem; }
    }
  `]
})
export class PayrollDashboardComponent implements OnInit {
  authService = inject(AuthService);
  private payrollService = inject(PayrollService);

  stats = signal({
    pendingCheck: 0,
    pendingAuthorize: 0,
    pendingProcess: 0,
    processedThisMonth: 0
  });

  recentRuns = signal<PayrollRun[]>([]);

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.payrollService.getDashboardStats().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stats.set(res.data);
        }
      }
    });

    this.payrollService.getRecentRuns().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.recentRuns.set(res.data.slice(0, 5));
        }
      }
    });
  }

  getMonthName(month: number | undefined): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return month ? months[month - 1] : '';
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HrService } from '../../../core/services/hr.service';
import { PayrollRun } from '../../../core/models';

@Component({
  selector: 'app-payroll-compute',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payroll-compute-page">
      <!-- Compute Form -->
      <div class="card compute-card">
        <div class="card-header">
          <h3>Compute Payroll</h3>
        </div>
        <div class="card-body">
          <div class="compute-form">
            <div class="form-row">
              <div class="form-group">
                <label>Month</label>
                <select [(ngModel)]="selectedMonth">
                  @for (month of months; track month.value) {
                    <option [value]="month.value">{{ month.label }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Year</label>
                <select [(ngModel)]="selectedYear">
                  @for (year of years; track year) {
                    <option [value]="year">{{ year }}</option>
                  }
                </select>
              </div>
              <button class="btn btn-primary btn-lg" (click)="computePayroll()" [disabled]="isComputing()">
                @if (isComputing()) {
                  <span class="spinner"></span>
                  Computing...
                } @else {
                  <span class="material-icons">calculate</span>
                  Compute Payroll
                }
              </button>
            </div>

            @if (successMessage()) {
              <div class="alert alert-success">
                <span class="material-icons">check_circle</span>
                {{ successMessage() }}
              </div>
            }

            @if (errorMessage()) {
              <div class="alert alert-error">
                <span class="material-icons">error</span>
                {{ errorMessage() }}
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Recent Payroll Runs -->
      <div class="card">
        <div class="card-header">
          <h3>Recent Payroll Runs</h3>
        </div>
        <div class="card-body">
          @if (payrollRuns().length > 0) {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Total Employees</th>
                  <th>Total Gross</th>
                  <th>Total Net</th>
                  <th>Status</th>
                  <th>Computed By</th>
                  <th>Computed At</th>
                </tr>
              </thead>
              <tbody>
                @for (run of payrollRuns(); track run.id) {
                  <tr>
                    <td>
                      <span class="period">{{ getMonthName(run.month) }} {{ run.year }}</span>
                    </td>
                    <td>{{ run.totalEmployees }}</td>
                    <td>{{ run.totalGross | currency:'INR':'symbol':'1.0-0' }}</td>
                    <td>{{ run.totalNet | currency:'INR':'symbol':'1.0-0' }}</td>
                    <td>
                      <span class="status-badge" [class]="run.status.toLowerCase()">
                        {{ run.status | titlecase }}
                      </span>
                    </td>
                    <td>{{ run.computedBy }}</td>
                    <td>{{ run.computedAt | date:'medium' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <div class="empty-state">
              <span class="material-icons">payments</span>
              <p>No payroll runs found</p>
            </div>
          }
        </div>
      </div>

      <!-- Workflow Info -->
      <div class="workflow-info">
        <h4>Payroll Workflow</h4>
        <div class="workflow-steps">
          <div class="step active">
            <div class="step-icon">
              <span class="material-icons">calculate</span>
            </div>
            <span class="step-label">Compute</span>
            <span class="step-role">HR</span>
          </div>
          <div class="step-connector"></div>
          <div class="step">
            <div class="step-icon">
              <span class="material-icons">fact_check</span>
            </div>
            <span class="step-label">Check</span>
            <span class="step-role">Checker</span>
          </div>
          <div class="step-connector"></div>
          <div class="step">
            <div class="step-icon">
              <span class="material-icons">verified</span>
            </div>
            <span class="step-label">Authorize</span>
            <span class="step-role">Payroll Admin</span>
          </div>
          <div class="step-connector"></div>
          <div class="step">
            <div class="step-icon">
              <span class="material-icons">payments</span>
            </div>
            <span class="step-label">Process</span>
            <span class="step-role">Payroll Admin</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payroll-compute-page {
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

    .compute-form {
      .form-row {
        display: flex;
        align-items: flex-end;
        gap: 1rem;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
      }

      select {
        padding: 0.75rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        font-size: 1rem;
        min-width: 150px;
      }
    }

    .btn-lg {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 0.5rem;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;

      &.alert-success { background: #f0fdf4; color: #047857; }
      &.alert-error { background: #fef2f2; color: var(--error-color); }
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        padding: 1rem;
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

      .period { font-weight: 600; }
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;

      &.computed { background: #fef3c7; color: #b45309; }
      &.checked { background: #dbeafe; color: #1d4ed8; }
      &.authorized { background: #e0e7ff; color: #4f46e5; }
      &.processed { background: #d1fae5; color: #047857; }
      &.rejected { background: #fee2e2; color: #b91c1c; }
    }

    .workflow-info {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);

      h4 {
        margin: 0 0 1.5rem;
        text-align: center;
        color: var(--text-primary);
      }
    }

    .workflow-steps {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;

      &.active .step-icon {
        background: var(--primary-color);
        color: white;
      }
    }

    .step-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--bg-secondary);
      display: flex;
      align-items: center;
      justify-content: center;

      .material-icons { font-size: 1.5rem; }
    }

    .step-label {
      font-weight: 600;
      color: var(--text-primary);
    }

    .step-role {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .step-connector {
      width: 60px;
      height: 2px;
      background: var(--border-color);
      margin: 0 0.5rem;
      margin-bottom: 2rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      color: var(--text-secondary);

      .material-icons { font-size: 3rem; margin-bottom: 0.5rem; }
    }
  `]
})
export class PayrollComputeComponent implements OnInit {
  private hrService = inject(HrService);

  payrollRuns = signal<PayrollRun[]>([]);
  isComputing = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();

  months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  years = [2024, 2023, 2022];

  ngOnInit(): void {
    this.loadPayrollRuns();
  }

  loadPayrollRuns(): void {
    this.hrService.getPayrollRuns().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.payrollRuns.set(res.data);
        }
      }
    });
  }

  computePayroll(): void {
    this.isComputing.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    this.hrService.computePayroll(this.selectedMonth, this.selectedYear).subscribe({
      next: (res) => {
        this.isComputing.set(false);
        if (res.success) {
          this.successMessage.set(`Payroll for ${this.getMonthName(this.selectedMonth)} ${this.selectedYear} computed successfully!`);
          this.loadPayrollRuns();
        } else {
          this.errorMessage.set(res.message || 'Failed to compute payroll');
        }
      },
      error: (err) => {
        this.isComputing.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to compute payroll');
      }
    });
  }

  getMonthName(month: number): string {
    return this.months.find(m => m.value === month)?.label || '';
  }
}

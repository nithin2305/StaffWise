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
                <label>Fortnight</label>
                <select [(ngModel)]="selectedFortnight">
                  @for (fn of fortnights; track fn.value) {
                    <option [value]="fn.value">{{ fn.label }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Year</label>
                <select [(ngModel)]="selectedYear" (ngModelChange)="onYearChange()">
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

            <div class="period-info">
              <span class="material-icons">info</span>
              <span>Period: {{ getFortnightDateRange() }}</span>
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
                      <span class="period">Fortnight {{ run.fortnight || run.month }}, {{ run.year }}</span>
                      <br>
                      <small class="period-dates">{{ run.periodStart | date:'d MMM' }} - {{ run.periodEnd | date:'d MMM yyyy' }}</small>
                    </td>
                    <td>{{ run.totalEmployees }}</td>
                    <td>K{{ run.totalGross | number:'1.2-2' }}</td>
                    <td>K{{ run.totalNet | number:'1.2-2' }}</td>
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
        <h4>Simplified Payroll Workflow</h4>
        <div class="workflow-steps">
          <div class="step active">
            <div class="step-icon">
              <span class="material-icons">calculate</span>
            </div>
            <span class="step-label">Step 1: Compute</span>
            <span class="step-role">HR</span>
            <span class="step-desc">Calculate salaries (auto-verified)</span>
          </div>
          <div class="step-connector"></div>
          <div class="step">
            <div class="step-icon">
              <span class="material-icons">verified</span>
            </div>
            <span class="step-label">Step 2: Authorize & Credit</span>
            <span class="step-role">Payroll Admin</span>
            <span class="step-desc">Final approval & payment</span>
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

    .period-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      background: #f0f9ff;
      border-radius: 8px;
      color: #0369a1;
      font-size: 0.875rem;

      .material-icons { font-size: 1.125rem; }
    }

    .period-dates {
      color: var(--text-secondary);
      font-size: 0.75rem;
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

    .step-desc {
      font-size: 0.7rem;
      color: var(--text-secondary);
      font-style: italic;
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

  selectedFortnight = this.getCurrentFortnight();
  selectedYear = new Date().getFullYear();

  // Generate fortnights 1-26
  fortnights = Array.from({ length: 26 }, (_, i) => ({
    value: i + 1,
    label: `Fortnight ${i + 1} (${this.getFortnightDateLabel(i + 1, new Date().getFullYear())})`
  }));

  years = [2026, 2025, 2024, 2023];

  ngOnInit(): void {
    this.loadPayrollRuns();
    this.updateFortnightLabels();
  }

  // Calculate current fortnight based on today's date
  getCurrentFortnight(): number {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(Math.floor(dayOfYear / 14) + 1, 26);
  }

  // Get date label for a fortnight
  getFortnightDateLabel(fortnight: number, year: number): string {
    const startOfYear = new Date(year, 0, 1);
    const startDate = new Date(startOfYear.getTime() + (fortnight - 1) * 14 * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + 13 * 24 * 60 * 60 * 1000);
    
    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} - ${endStr}`;
  }

  // Update fortnight labels when year changes
  updateFortnightLabels(): void {
    this.fortnights = Array.from({ length: 26 }, (_, i) => ({
      value: i + 1,
      label: `Fortnight ${i + 1} (${this.getFortnightDateLabel(i + 1, this.selectedYear)})`
    }));
  }

  // Get date range display for selected fortnight
  getFortnightDateRange(): string {
    return this.getFortnightDateLabel(this.selectedFortnight, this.selectedYear) + ', ' + this.selectedYear;
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

    this.hrService.computePayroll(this.selectedFortnight, this.selectedYear).subscribe({
      next: (res) => {
        this.isComputing.set(false);
        if (res.success) {
          this.successMessage.set(`Payroll for Fortnight ${this.selectedFortnight}, ${this.selectedYear} computed successfully!`);
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

  onYearChange(): void {
    this.updateFortnightLabels();
  }
}

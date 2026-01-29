import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PayrollService } from '../../../core/services/payroll.service';
import { PayrollRun, PayrollDetail } from '../../../core/models';

@Component({
  selector: 'app-payroll-runs-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="payroll-runs-page">
      <!-- Runs List -->
      <div class="card">
        <div class="card-header">
          <h3>All Payroll Runs</h3>
        </div>
        <div class="card-body">
          @if (payrollRuns().length > 0) {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Employees</th>
                  <th>Total Gross</th>
                  <th>Total Net</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (run of payrollRuns(); track run.id) {
                  <tr [class.selected]="selectedRun()?.id === run.id">
                    <td>
                      <span class="period">{{ getMonthName(run.month) }} {{ run.year }}</span>
                    </td>
                    <td>{{ run.totalEmployees }}</td>
                    <td>{{ run.totalGross | currency:'INR':'symbol':'1.0-0' }}</td>
                    <td>{{ (run.totalNetPay || run.totalNet) | currency:'INR':'symbol':'1.0-0' }}</td>
                    <td>
                      <span class="status-badge" [class]="run.status.toLowerCase()">
                        {{ run.status | titlecase }}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-secondary" (click)="viewDetails(run)">
                        <span class="material-icons">visibility</span>
                        Details
                      </button>
                    </td>
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

      <!-- Details Panel -->
      @if (selectedRun()) {
        <div class="card">
          <div class="card-header">
            <h3>{{ getMonthName(selectedRun()!.month) }} {{ selectedRun()!.year }} - Details</h3>
            <span class="status-badge" [class]="selectedRun()!.status.toLowerCase()">
              {{ selectedRun()!.status | titlecase }}
            </span>
          </div>
          <div class="card-body">
            <!-- Audit Info -->
            <div class="audit-grid">
              @if (selectedRun()!.computedBy) {
                <div class="audit-item">
                  <span class="label">Computed</span>
                  <span class="value">{{ selectedRun()!.computedBy }}</span>
                  <span class="date">{{ selectedRun()!.computedAt | date:'medium' }}</span>
                </div>
              }
              @if (selectedRun()!.checkedBy) {
                <div class="audit-item">
                  <span class="label">Checked</span>
                  <span class="value">{{ selectedRun()!.checkedBy }}</span>
                  <span class="date">{{ selectedRun()!.checkedAt | date:'medium' }}</span>
                </div>
              }
              @if (selectedRun()!.authorizedBy) {
                <div class="audit-item">
                  <span class="label">Authorized</span>
                  <span class="value">{{ selectedRun()!.authorizedBy }}</span>
                  <span class="date">{{ selectedRun()!.authorizedAt | date:'medium' }}</span>
                </div>
              }
              @if (selectedRun()!.processedBy) {
                <div class="audit-item">
                  <span class="label">Processed</span>
                  <span class="value">{{ selectedRun()!.processedBy }}</span>
                  <span class="date">{{ selectedRun()!.processedAt | date:'medium' }}</span>
                </div>
              }
            </div>

            <!-- Details Table -->
            @if (payrollDetails().length > 0) {
              <table class="data-table details-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Basic</th>
                    <th>HRA</th>
                    <th>Allowances</th>
                    <th>Gross</th>
                    <th>PF</th>
                    <th>TDS</th>
                    <th>Deductions</th>
                    <th>Net Pay</th>
                  </tr>
                </thead>
                <tbody>
                  @for (detail of payrollDetails(); track detail.id) {
                    <tr>
                      <td>
                        <div class="employee-cell">
                          <span class="name">{{ detail.employeeName }}</span>
                          <span class="code">{{ detail.empCode }}</span>
                        </div>
                      </td>
                      <td>{{ detail.basicSalary | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td>{{ detail.hra | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td>{{ (detail.transportAllowance || 0) + (detail.medicalAllowance || 0) + (detail.specialAllowance || 0) | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td>{{ (detail.grossSalary || detail.grossEarnings) | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td>{{ (detail.pfDeduction || detail.pf) | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td>{{ (detail.taxDeduction || detail.tds) | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td>{{ detail.totalDeductions | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td class="net-pay">{{ detail.netPay | currency:'INR':'symbol':'1.0-0' }}</td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>Total</strong></td>
                    <td colspan="3"></td>
                    <td><strong>{{ selectedRun()!.totalGross | currency:'INR':'symbol':'1.0-0' }}</strong></td>
                    <td colspan="3"></td>
                    <td class="net-pay"><strong>{{ (selectedRun()!.totalNetPay || selectedRun()!.totalNet) | currency:'INR':'symbol':'1.0-0' }}</strong></td>
                  </tr>
                </tfoot>
              </table>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .payroll-runs-page {
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
      display: flex;
      align-items: center;
      justify-content: space-between;
      h3 { margin: 0; }
    }

    .card-body { padding: 0; }

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

      tbody tr:hover { background: var(--bg-secondary); }
      tr.selected { background: #eff6ff; }
    }

    .details-table {
      td { font-size: 0.875rem; }
      .net-pay { font-weight: 600; color: var(--primary-color); }

      tfoot td {
        background: var(--bg-secondary);
        border-top: 2px solid var(--border-color);
      }
    }

    .employee-cell {
      display: flex;
      flex-direction: column;
      .name { font-weight: 500; }
      .code { font-size: 0.75rem; color: var(--text-secondary); }
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

    .btn-sm {
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      .material-icons { font-size: 1rem; margin-right: 0.25rem; }
    }

    .audit-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: #f8fafc;
    }

    .audit-item {
      .label { display: block; font-size: 0.75rem; color: var(--text-secondary); }
      .value { font-weight: 600; }
      .date { display: block; font-size: 0.75rem; color: var(--text-secondary); }
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
export class PayrollRunsListComponent implements OnInit {
  private payrollService = inject(PayrollService);

  payrollRuns = signal<PayrollRun[]>([]);
  selectedRun = signal<PayrollRun | null>(null);
  payrollDetails = signal<PayrollDetail[]>([]);

  ngOnInit(): void {
    this.loadPayrollRuns();
  }

  loadPayrollRuns(): void {
    this.payrollService.getRecentRuns().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.payrollRuns.set(res.data);
        }
      }
    });
  }

  viewDetails(run: PayrollRun): void {
    this.selectedRun.set(run);
    this.payrollService.getPayrollDetails(run.id!).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.payrollDetails.set(res.data);
        }
      }
    });
  }

  getMonthName(month: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  }
}

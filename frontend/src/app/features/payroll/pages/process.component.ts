import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PayrollService } from '../../../core/services/payroll.service';
import { PayrollRun, PayrollDetail } from '../../../core/models';

@Component({
  selector: 'app-process-payroll',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="process-payroll-page">
      <!-- Pending Runs -->
      <div class="card">
        <div class="card-header">
          <h3>Payroll Runs Ready for Processing</h3>
        </div>
        <div class="card-body">
          @if (pendingRuns().length > 0) {
            <div class="runs-list">
              @for (run of pendingRuns(); track run.id) {
                <div class="run-card" [class.selected]="selectedRun()?.id === run.id" (click)="selectRun(run)">
                  <div class="run-info">
                    <h4>{{ getMonthName(run.month) }} {{ run.year }}</h4>
                    <p>{{ run.totalEmployees }} employees • Authorized by {{ run.authorizedBy || 'N/A' }}</p>
                  </div>
                  <div class="run-amount">
                    <span class="label">Total Net</span>
                    <span class="value">{{ run.totalNet | currency:'INR':'symbol':'1.0-0' }}</span>
                  </div>
                  <span class="material-icons">chevron_right</span>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state">
              <span class="material-icons">check_circle</span>
              <p>No payroll runs ready for processing</p>
            </div>
          }
        </div>
      </div>

      <!-- Payroll Details -->
      @if (selectedRun()) {
        <div class="card">
          <div class="card-header">
            <h3>{{ getMonthName(selectedRun()!.month) }} {{ selectedRun()!.year }} - Process Payment</h3>
            <button class="btn btn-primary" (click)="processPayroll()" [disabled]="processing()">
              <span class="material-icons">{{ processing() ? 'hourglass_empty' : 'account_balance' }}</span>
              {{ processing() ? 'Processing...' : 'Process Payment' }}
            </button>
          </div>
          <div class="card-body">
            <!-- Audit Trail -->
            <div class="audit-trail">
              <div class="trail-step completed">
                <div class="step-icon">
                  <span class="material-icons">calculate</span>
                </div>
                <div class="step-info">
                  <h5>Computed</h5>
                  <p>{{ selectedRun()!.computedBy }} • {{ selectedRun()!.computedAt | date:'medium' }}</p>
                </div>
              </div>
              <div class="trail-connector"></div>
              <div class="trail-step completed">
                <div class="step-icon">
                  <span class="material-icons">fact_check</span>
                </div>
                <div class="step-info">
                  <h5>Checked</h5>
                  <p>{{ selectedRun()!.checkedBy }} • {{ selectedRun()!.checkedAt | date:'medium' }}</p>
                </div>
              </div>
              <div class="trail-connector"></div>
              <div class="trail-step completed">
                <div class="step-icon">
                  <span class="material-icons">gavel</span>
                </div>
                <div class="step-info">
                  <h5>Authorized</h5>
                  <p>{{ selectedRun()!.authorizedBy }} • {{ selectedRun()!.authorizedAt | date:'medium' }}</p>
                </div>
              </div>
              <div class="trail-connector"></div>
              <div class="trail-step pending">
                <div class="step-icon">
                  <span class="material-icons">account_balance</span>
                </div>
                <div class="step-info">
                  <h5>Process</h5>
                  <p>Pending</p>
                </div>
              </div>
            </div>

            <!-- Summary -->
            <div class="payment-summary">
              <h4>Payment Summary</h4>
              <div class="summary-row">
                <span>Total Employees</span>
                <span>{{ selectedRun()!.totalEmployees }}</span>
              </div>
              <div class="summary-row">
                <span>Total Gross Pay</span>
                <span>{{ selectedRun()!.totalGross | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
              <div class="summary-row">
                <span>Total Deductions</span>
                <span>{{ (selectedRun()!.totalGross - selectedRun()!.totalNet) | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
              <div class="summary-row total">
                <span>Total Net Pay</span>
                <span>{{ selectedRun()!.totalNet | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
            </div>

            <!-- Employee List -->
            @if (payrollDetails().length > 0) {
              <h4 class="section-title">Employee Payments</h4>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Bank Account</th>
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
                      <td>{{ detail.bankAccount || 'XXXX-XXXX-' + (detail.id! % 10000) }}</td>
                      <td class="net-pay">{{ detail.netPay | currency:'INR':'symbol':'1.0-0' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>
      }

      <!-- Success Modal -->
      @if (showSuccessModal()) {
        <div class="modal-overlay" (click)="closeSuccessModal()">
          <div class="modal success-modal" (click)="$event.stopPropagation()">
            <div class="modal-body">
              <div class="success-icon">
                <span class="material-icons">check_circle</span>
              </div>
              <h3>Payment Processed Successfully!</h3>
              <p>Payroll for {{ getMonthName(processedRun()!.month) }} {{ processedRun()!.year }} has been processed.</p>
              <p class="amount">{{ processedRun()!.totalNet | currency:'INR':'symbol':'1.0-0' }}</p>
              <p class="employees">{{ processedRun()!.totalEmployees }} employees paid</p>
              <button class="btn btn-primary" (click)="closeSuccessModal()">Done</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .process-payroll-page {
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

    .card-body { padding: 1.5rem; }

    .runs-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .run-card {
      display: flex;
      align-items: center;
      padding: 1rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      .run-info {
        flex: 1;
        h4 { margin: 0; }
        p { margin: 0; font-size: 0.875rem; color: var(--text-secondary); }
      }

      .run-amount {
        text-align: right;
        margin-right: 1rem;
        .label { display: block; font-size: 0.75rem; color: var(--text-secondary); }
        .value { font-weight: 600; color: var(--primary-color); }
      }

      &:hover { border-color: var(--primary-color); }
      &.selected { border-color: var(--primary-color); background: #f0f9ff; }
    }

    .audit-trail {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: var(--bg-secondary);
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .trail-step {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .step-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border: 2px solid var(--border-color);

        .material-icons { font-size: 1.25rem; color: var(--text-secondary); }
      }

      .step-info {
        h5 { margin: 0; font-size: 0.875rem; }
        p { margin: 0; font-size: 0.75rem; color: var(--text-secondary); }
      }

      &.completed .step-icon {
        background: #d1fae5;
        border-color: #10b981;
        .material-icons { color: #047857; }
      }

      &.pending .step-icon {
        background: #fef3c7;
        border-color: #f59e0b;
        .material-icons { color: #b45309; }
      }
    }

    .trail-connector {
      width: 40px;
      height: 2px;
      background: var(--border-color);
      margin: 0 0.5rem;
    }

    .payment-summary {
      background: #f8fafc;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;

      h4 { margin: 0 0 1rem; }
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border-color);

      &:last-child { border-bottom: none; }

      &.total {
        padding-top: 1rem;
        font-weight: 600;
        font-size: 1.125rem;
        color: var(--primary-color);
      }
    }

    .section-title {
      margin: 0 0 1rem;
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

      .net-pay { font-weight: 600; color: var(--primary-color); }
    }

    .employee-cell {
      display: flex;
      flex-direction: column;
      .name { font-weight: 500; }
      .code { font-size: 0.75rem; color: var(--text-secondary); }
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 400px;
    }

    .success-modal .modal-body {
      padding: 2rem;
      text-align: center;
    }

    .success-icon {
      .material-icons {
        font-size: 4rem;
        color: #10b981;
      }
    }

    .success-modal {
      h3 { margin: 1rem 0 0.5rem; }
      p { margin: 0.25rem 0; color: var(--text-secondary); }
      .amount { font-size: 1.5rem; font-weight: 600; color: var(--primary-color); margin-top: 1rem; }
      .employees { font-size: 0.875rem; }
      .btn { margin-top: 1.5rem; }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      color: var(--text-secondary);
      .material-icons { font-size: 3rem; margin-bottom: 0.5rem; color: #10b981; }
    }
  `]
})
export class ProcessPayrollComponent implements OnInit {
  private payrollService = inject(PayrollService);

  pendingRuns = signal<PayrollRun[]>([]);
  selectedRun = signal<PayrollRun | null>(null);
  payrollDetails = signal<PayrollDetail[]>([]);
  processing = signal(false);
  showSuccessModal = signal(false);
  processedRun = signal<PayrollRun | null>(null);

  ngOnInit(): void {
    this.loadPendingRuns();
  }

  loadPendingRuns(): void {
    this.payrollService.getPendingProcess().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.pendingRuns.set(res.data);
        }
      }
    });
  }

  selectRun(run: PayrollRun): void {
    this.selectedRun.set(run);
    this.payrollService.getPayrollDetails(run.id!).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.payrollDetails.set(res.data);
        }
      }
    });
  }

  processPayroll(): void {
    const run = this.selectedRun();
    if (!run) return;

    this.processing.set(true);
    this.payrollService.processPayroll(run.id!).subscribe({
      next: (res) => {
        this.processing.set(false);
        if (res.success) {
          this.processedRun.set(run);
          this.showSuccessModal.set(true);
          this.selectedRun.set(null);
          this.payrollDetails.set([]);
          this.loadPendingRuns();
        }
      },
      error: () => {
        this.processing.set(false);
      }
    });
  }

  closeSuccessModal(): void {
    this.showSuccessModal.set(false);
    this.processedRun.set(null);
  }

  getMonthName(month: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  }
}

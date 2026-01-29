import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PayrollService } from '../../../core/services/payroll.service';
import { PayrollRun, PayrollDetail } from '../../../core/models';

@Component({
  selector: 'app-check-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="check-payroll-page">
      <!-- Pending Runs -->
      <div class="card">
        <div class="card-header">
          <h3>Payroll Runs Pending Check</h3>
        </div>
        <div class="card-body">
          @if (pendingRuns().length > 0) {
            <div class="runs-list">
              @for (run of pendingRuns(); track run.id) {
                <div class="run-card" [class.selected]="selectedRun()?.id === run.id" (click)="selectRun(run)">
                  <div class="run-info">
                    <h4>{{ getMonthName(run.month) }} {{ run.year }}</h4>
                    <p>{{ run.totalEmployees }} employees</p>
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
              <p>No payroll runs pending check</p>
            </div>
          }
        </div>
      </div>

      <!-- Payroll Details -->
      @if (selectedRun()) {
        <div class="card">
          <div class="card-header">
            <h3>{{ getMonthName(selectedRun()!.month) }} {{ selectedRun()!.year }} - Payroll Details</h3>
            <div class="header-actions">
              <button class="btn btn-danger" (click)="openRejectModal()">
                <span class="material-icons">close</span>
                Reject
              </button>
              <button class="btn btn-success" (click)="approvePayroll()">
                <span class="material-icons">check</span>
                Approve
              </button>
            </div>
          </div>
          <div class="card-body">
            <!-- Summary -->
            <div class="summary-grid">
              <div class="summary-item">
                <span class="label">Total Gross</span>
                <span class="value">{{ selectedRun()!.totalGross | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
              <div class="summary-item">
                <span class="label">Total Deductions</span>
                <span class="value">{{ (selectedRun()!.totalGross - selectedRun()!.totalNet) | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
              <div class="summary-item highlight">
                <span class="label">Total Net Pay</span>
                <span class="value">{{ selectedRun()!.totalNet | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
            </div>

            <!-- Details Table -->
            @if (payrollDetails().length > 0) {
              <table class="data-table">
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
                    <th>Verify</th>
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
                      <td>{{ detail.otherAllowances | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td>{{ detail.grossEarnings | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td>{{ detail.pf | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td>{{ detail.tds | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td>{{ detail.totalDeductions | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td class="net-pay">{{ detail.netPay | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td>
                        <label class="checkbox">
                          <input type="checkbox" [(ngModel)]="verifiedItems[detail.id!]">
                          <span class="checkmark"></span>
                        </label>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>
      }

      <!-- Reject Modal -->
      @if (showRejectModal()) {
        <div class="modal-overlay" (click)="closeRejectModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Reject Payroll</h3>
              <button class="close-btn" (click)="closeRejectModal()">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Rejection Reason *</label>
                <textarea [(ngModel)]="rejectionReason" rows="3" placeholder="Please provide a reason for rejection"></textarea>
              </div>
              <div class="form-actions">
                <button class="btn btn-secondary" (click)="closeRejectModal()">Cancel</button>
                <button class="btn btn-danger" (click)="rejectPayroll()" [disabled]="!rejectionReason">
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .check-payroll-page {
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

    .header-actions {
      display: flex;
      gap: 0.5rem;
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
      &.selected {
        border-color: var(--primary-color);
        background: #f0f9ff;
      }
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-item {
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 8px;
      text-align: center;

      .label { display: block; font-size: 0.875rem; color: var(--text-secondary); }
      .value { font-size: 1.25rem; font-weight: 600; }

      &.highlight {
        background: #d1fae5;
        .value { color: #047857; }
      }
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
        font-size: 0.875rem;
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

    .checkbox {
      display: inline-block;
      position: relative;
      cursor: pointer;

      input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
      }

      .checkmark {
        width: 20px;
        height: 20px;
        border: 2px solid var(--border-color);
        border-radius: 4px;
        display: inline-block;
      }

      input:checked ~ .checkmark {
        background: var(--primary-color);
        border-color: var(--primary-color);
        &::after {
          content: '✓';
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
        }
      }
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

    .modal-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      h3 { margin: 0; }
      .close-btn { background: none; border: none; cursor: pointer; }
    }

    .modal-body { padding: 1.5rem; }

    .form-group {
      margin-bottom: 1rem;
      label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
      textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        resize: vertical;
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
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
export class CheckPayrollComponent implements OnInit {
  private payrollService = inject(PayrollService);

  pendingRuns = signal<PayrollRun[]>([]);
  selectedRun = signal<PayrollRun | null>(null);
  payrollDetails = signal<PayrollDetail[]>([]);
  showRejectModal = signal(false);
  rejectionReason = '';
  verifiedItems: { [key: number]: boolean } = {};

  ngOnInit(): void {
    this.loadPendingRuns();
  }

  loadPendingRuns(): void {
    this.payrollService.getPendingCheck().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.pendingRuns.set(res.data);
        }
      }
    });
  }

  selectRun(run: PayrollRun): void {
    this.selectedRun.set(run);
    this.verifiedItems = {};
    this.payrollService.getPayrollDetails(run.id!).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.payrollDetails.set(res.data);
          res.data.forEach(d => this.verifiedItems[d.id!] = false);
        }
      }
    });
  }

  approvePayroll(): void {
    const run = this.selectedRun();
    if (!run) return;

    this.payrollService.checkPayroll(run.id!).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedRun.set(null);
          this.payrollDetails.set([]);
          this.loadPendingRuns();
        }
      }
    });
  }

  openRejectModal(): void {
    this.rejectionReason = '';
    this.showRejectModal.set(true);
  }

  closeRejectModal(): void {
    this.showRejectModal.set(false);
  }

  rejectPayroll(): void {
    const run = this.selectedRun();
    if (!run || !this.rejectionReason) return;

    this.payrollService.rejectPayroll(run.id!, this.rejectionReason).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeRejectModal();
          this.selectedRun.set(null);
          this.payrollDetails.set([]);
          this.loadPendingRuns();
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

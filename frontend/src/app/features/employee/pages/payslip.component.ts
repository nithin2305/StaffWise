import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../core/services/employee.service';
import { PayrollDetail, ApiResponse } from '../../../core/models';

@Component({
  selector: 'app-payslip',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payslip-page">
      <!-- Month Selector -->
      <div class="card month-selector">
        <div class="card-body">
          <div class="selector-row">
            <div class="selector-group">
              <label>Year</label>
              <select [(ngModel)]="selectedYear" (change)="loadPayslips()">
                @for (year of years; track year) {
                  <option [value]="year">{{ year }}</option>
                }
              </select>
            </div>
            <div class="month-buttons">
              @for (month of months; track month.value) {
                <button 
                  class="month-btn" 
                  [class.active]="selectedMonth === month.value"
                  (click)="selectMonth(month.value)">
                  {{ month.label }}
                </button>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Payslip -->
      @if (selectedPayslip()) {
        <div class="card payslip-detail">
          <div class="card-header">
            <h3>Payslip - {{ getMonthName(selectedPayslip()!.month) }} {{ selectedPayslip()!.year }}</h3>
            <button class="btn btn-primary" (click)="downloadPayslip()">
              <span class="material-icons">download</span>
              Download PDF
            </button>
          </div>
          <div class="card-body">
            <div class="payslip-content">
              <!-- Employee Info -->
              <div class="payslip-section employee-info">
                <div class="info-item">
                  <span class="label">Employee Code</span>
                  <span class="value">{{ selectedPayslip()!.empCode }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Employee Name</span>
                  <span class="value">{{ selectedPayslip()!.employeeName }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Pay Period</span>
                  <span class="value">{{ getMonthName(selectedPayslip()!.month) }} {{ selectedPayslip()!.year }}</span>
                </div>
              </div>

              <!-- Earnings & Deductions -->
              <div class="payslip-grid">
                <!-- Earnings -->
                <div class="payslip-section">
                  <h4>Earnings</h4>
                  @if (hasValue(selectedPayslip()!.basicSalary)) {
                    <div class="pay-item">
                      <span>Basic Salary</span>
                      <span>{{ selectedPayslip()!.basicSalary | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                  }
                  @if (hasValue(selectedPayslip()!.hra)) {
                    <div class="pay-item">
                      <span>House Rent Allowance (HRA)</span>
                      <span>{{ selectedPayslip()!.hra | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                  }
                  @if (hasValue(selectedPayslip()!.transportAllowance)) {
                    <div class="pay-item">
                      <span>Transport Allowance</span>
                      <span>{{ selectedPayslip()!.transportAllowance | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                  }
                  @if (hasValue(selectedPayslip()!.medicalAllowance)) {
                    <div class="pay-item">
                      <span>Medical Allowance</span>
                      <span>{{ selectedPayslip()!.medicalAllowance | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                  }
                  @if (hasValue(selectedPayslip()!.specialAllowance)) {
                    <div class="pay-item">
                      <span>Special Allowance</span>
                      <span>{{ selectedPayslip()!.specialAllowance | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                  }
                  @if (hasValue(selectedPayslip()!.otherAllowances)) {
                    <div class="pay-item">
                      <span>Other Allowances</span>
                      <span>{{ selectedPayslip()!.otherAllowances | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                  }
                  @if (hasValue(selectedPayslip()!.overtimePay)) {
                    <div class="pay-item">
                      <span>Overtime Pay</span>
                      <span>{{ selectedPayslip()!.overtimePay | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                  }
                  @if (hasValue(selectedPayslip()!.bonus)) {
                    <div class="pay-item">
                      <span>Bonus</span>
                      <span>{{ selectedPayslip()!.bonus | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                  }
                  <div class="pay-item total">
                    <span>Gross Earnings</span>
                    <span>{{ getGrossEarnings() | currency:'INR':'symbol':'1.0-0' }}</span>
                  </div>
                </div>

                <!-- Deductions -->
                <div class="payslip-section">
                  <h4>Deductions</h4>
                  @if (hasValue(selectedPayslip()!.pf) || hasValue(selectedPayslip()!.pfDeduction)) {
                    <div class="pay-item">
                      <span>Provident Fund (PF)</span>
                      <span>{{ (selectedPayslip()!.pf || selectedPayslip()!.pfDeduction) | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                  }
                  @if (hasValue(selectedPayslip()!.professionalTax)) {
                    <div class="pay-item">
                      <span>Professional Tax</span>
                      <span>{{ selectedPayslip()!.professionalTax | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                  }
                  @if (hasValue(selectedPayslip()!.tds) || hasValue(selectedPayslip()!.taxDeduction)) {
                    <div class="pay-item">
                      <span>Tax Deducted at Source (TDS)</span>
                      <span>{{ (selectedPayslip()!.tds || selectedPayslip()!.taxDeduction) | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                  }
                  @if (hasValue(selectedPayslip()!.insuranceDeduction)) {
                    <div class="pay-item">
                      <span>Insurance Deduction</span>
                      <span>{{ selectedPayslip()!.insuranceDeduction | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                  }
                  @if (hasValue(selectedPayslip()!.loanDeduction)) {
                    <div class="pay-item">
                      <span>Loan Deduction</span>
                      <span>{{ selectedPayslip()!.loanDeduction | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                  }
                  @if (hasValue(selectedPayslip()!.leaveDeduction) || hasValue(selectedPayslip()!.lwpDeduction)) {
                    <div class="pay-item">
                      <span>Leave Deduction (LWP)</span>
                      <span>{{ (selectedPayslip()!.leaveDeduction || selectedPayslip()!.lwpDeduction) | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                  }
                  @if (hasValue(selectedPayslip()!.lateDeduction)) {
                    <div class="pay-item">
                      <span>Late Deduction</span>
                      <span>{{ selectedPayslip()!.lateDeduction | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                  }
                  @if (hasValue(selectedPayslip()!.otherDeductions)) {
                    <div class="pay-item">
                      <span>Other Deductions</span>
                      <span>{{ selectedPayslip()!.otherDeductions | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                  }
                  <div class="pay-item total">
                    <span>Total Deductions</span>
                    <span>{{ selectedPayslip()!.totalDeductions | currency:'INR':'symbol':'1.0-0' }}</span>
                  </div>
                </div>
              </div>

              <!-- Net Pay -->
              <div class="net-pay-section">
                <div class="net-pay">
                  <span>Net Pay</span>
                  <span class="amount">{{ selectedPayslip()!.netPay | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
              </div>

              <!-- Additional Info -->
              <div class="additional-info">
                <div class="info-row">
                  @if (hasValue(selectedPayslip()!.workingDays) || hasValue(selectedPayslip()!.totalWorkingDays)) {
                    <div class="info-item">
                      <span class="label">Working Days</span>
                      <span class="value">{{ selectedPayslip()!.workingDays || selectedPayslip()!.totalWorkingDays }}</span>
                    </div>
                  }
                  @if (hasValue(selectedPayslip()!.presentDays) || hasValue(selectedPayslip()!.daysWorked)) {
                    <div class="info-item">
                      <span class="label">Present Days</span>
                      <span class="value">{{ selectedPayslip()!.presentDays || selectedPayslip()!.daysWorked }}</span>
                    </div>
                  }
                  @if (hasValue(selectedPayslip()!.leaveDays) || hasValue(selectedPayslip()!.leavesTaken)) {
                    <div class="info-item">
                      <span class="label">Leave Days</span>
                      <span class="value">{{ selectedPayslip()!.leaveDays || selectedPayslip()!.leavesTaken }}</span>
                    </div>
                  }
                  @if (hasValue(selectedPayslip()!.lwpDays)) {
                    <div class="info-item">
                      <span class="label">LWP Days</span>
                      <span class="value">{{ selectedPayslip()!.lwpDays }}</span>
                    </div>
                  }
                  @if (hasValue(selectedPayslip()!.approvedOvertimeHours)) {
                    <div class="info-item">
                      <span class="label">Overtime Hours</span>
                      <span class="value">{{ selectedPayslip()!.approvedOvertimeHours }}</span>
                    </div>
                  }
                  @if (hasValue(selectedPayslip()!.lateCount)) {
                    <div class="info-item">
                      <span class="label">Late Count</span>
                      <span class="value">{{ selectedPayslip()!.lateCount }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="card">
          <div class="card-body">
            <div class="empty-state">
              <span class="material-icons">receipt_long</span>
              <p>No payslip available for the selected period</p>
            </div>
          </div>
        </div>
      }

      <!-- Payslip History -->
      <div class="card">
        <div class="card-header">
          <h3>Payslip History</h3>
        </div>
        <div class="card-body">
          @if (payslips().length > 0) {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Pay Period</th>
                  <th>Gross Earnings</th>
                  <th>Total Deductions</th>
                  <th>Net Pay</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (payslip of payslips(); track payslip.id) {
                  <tr [class.selected]="selectedPayslip()?.id === payslip.id">
                    <td>{{ getMonthName(payslip.month) }} {{ payslip.year }}</td>
                    <td>{{ payslip.grossEarnings | currency:'INR':'symbol':'1.0-0' }}</td>
                    <td>{{ payslip.totalDeductions | currency:'INR':'symbol':'1.0-0' }}</td>
                    <td class="net-pay-cell">{{ payslip.netPay | currency:'INR':'symbol':'1.0-0' }}</td>
                    <td>
                      <button class="btn btn-sm btn-secondary" (click)="viewPayslip(payslip)">
                        <span class="material-icons">visibility</span>
                        View
                      </button>
                      <button class="btn btn-sm btn-primary" (click)="downloadPayslipFor(payslip.month, payslip.year)">
                        <span class="material-icons">download</span>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <div class="empty-state">
              <span class="material-icons">history</span>
              <p>No payslip history found</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payslip-page {
      display: flex;
      flex-direction: column;
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

      h3 {
        margin: 0;
        font-size: 1.125rem;
        color: var(--text-primary);
      }
    }

    .card-body {
      padding: 1.5rem;
    }

    .selector-row {
      display: flex;
      align-items: flex-end;
      gap: 2rem;
      flex-wrap: wrap;
    }

    .selector-group {
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-secondary);
      }

      select {
        padding: 0.5rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        font-size: 1rem;
      }
    }

    .month-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .month-btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      background: white;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: var(--bg-secondary);
      }

      &.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }
    }

    .payslip-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .employee-info {
      display: flex;
      gap: 2rem;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 8px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      .label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .value {
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .payslip-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .payslip-section {
      h4 {
        margin: 0 0 1rem;
        color: var(--text-primary);
        border-bottom: 2px solid var(--primary-color);
        padding-bottom: 0.5rem;
      }
    }

    .pay-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border-color);

      &.total {
        font-weight: 600;
        border-top: 2px solid var(--border-color);
        border-bottom: none;
        margin-top: 0.5rem;
        padding-top: 0.75rem;
      }
    }

    .net-pay-section {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
      border-radius: 12px;
      padding: 1.5rem;
    }

    .net-pay {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: white;

      span:first-child {
        font-size: 1.125rem;
        font-weight: 500;
      }

      .amount {
        font-size: 2rem;
        font-weight: 700;
      }
    }

    .additional-info {
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 8px;

      .info-row {
        display: flex;
        gap: 2rem;
        justify-content: space-around;
      }

      .info-item {
        align-items: center;
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
        background: var(--bg-secondary);
      }

      .net-pay-cell {
        font-weight: 600;
        color: var(--primary-color);
      }

      tr.selected {
        background: #eff6ff;
      }
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;

      .material-icons {
        font-size: 1rem;
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      color: var(--text-secondary);

      .material-icons {
        font-size: 3rem;
        margin-bottom: 0.5rem;
      }
    }

    @media (max-width: 768px) {
      .payslip-grid {
        grid-template-columns: 1fr;
      }

      .employee-info,
      .additional-info .info-row {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `]
})
export class PayslipComponent implements OnInit {
  private employeeService = inject(EmployeeService);

  payslips = signal<PayrollDetail[]>([]);
  selectedPayslip = signal<PayrollDetail | null>(null);
  
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;

  years = [2024, 2023, 2022];
  months = [
    { value: 1, label: 'Jan' },
    { value: 2, label: 'Feb' },
    { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' },
    { value: 5, label: 'May' },
    { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' },
    { value: 8, label: 'Aug' },
    { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' },
    { value: 11, label: 'Nov' },
    { value: 12, label: 'Dec' }
  ];

  ngOnInit(): void {
    this.loadPayslips();
  }

  loadPayslips(): void {
    this.employeeService.getMyPayslips().subscribe({
      next: (res: ApiResponse<PayrollDetail[]>) => {
        if (res.success && res.data) {
          this.payslips.set(res.data);
          this.selectCurrentPayslip();
        }
      }
    });
  }

  selectCurrentPayslip(): void {
    const payslip = this.payslips().find(
      p => p.month === this.selectedMonth && p.year === this.selectedYear
    );
    this.selectedPayslip.set(payslip || null);
  }

  selectMonth(month: number): void {
    this.selectedMonth = month;
    this.selectCurrentPayslip();
  }

  viewPayslip(payslip: PayrollDetail): void {
    this.selectedPayslip.set(payslip);
    this.selectedMonth = payslip.month;
    this.selectedYear = payslip.year;
  }

  downloadPayslip(): void {
    if (!this.selectedPayslip()) return;
    this.downloadPayslipFor(this.selectedPayslip()!.month, this.selectedPayslip()!.year);
  }

  downloadPayslipFor(month: number, year: number): void {
    this.employeeService.downloadPayslip(month, year).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payslip_${year}_${month}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  getMonthName(month: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  }

  hasValue(value: number | undefined | null): boolean {
    return value !== null && value !== undefined && value !== 0;
  }

  getGrossEarnings(): number {
    const p = this.selectedPayslip();
    if (!p) return 0;
    return p.grossEarnings || p.grossSalary || 0;
  }
}

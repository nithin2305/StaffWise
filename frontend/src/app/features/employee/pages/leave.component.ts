import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeService } from '../../../core/services/employee.service';
import { LeaveBalance, EmployeeRequest, LeaveType } from '../../../core/models';

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="leave-page">
      <!-- Leave Balances -->
      <div class="balances-section">
        <h3>Leave Balances</h3>
        <div class="balance-cards">
          @for (balance of leaveBalances(); track balance.leaveType) {
            <div class="balance-card" [class]="balance.leaveType.toLowerCase()">
              <div class="balance-icon">
                @switch (balance.leaveType) {
                  @case ('ANNUAL') { <span class="material-icons">wb_sunny</span> }
                  @case ('SICK') { <span class="material-icons">local_hospital</span> }
                  @case ('PERSONAL') { <span class="material-icons">person</span> }
                  @default { <span class="material-icons">event</span> }
                }
              </div>
              <div class="balance-info">
                <span class="balance-type">{{ balance.leaveType | titlecase }}</span>
                <div class="balance-numbers">
                  <span class="available">{{ balance.balance }}</span>
                  <span class="total">/ {{ balance.entitled }}</span>
                </div>
                <span class="used">Used: {{ balance.used }}</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Apply Leave Form -->
      <div class="card apply-leave">
        <div class="card-header">
          <h3>Apply for Leave</h3>
        </div>
        <div class="card-body">
          <form [formGroup]="leaveForm" (ngSubmit)="submitLeave()">
            <div class="form-row">
              <div class="form-group">
                <label for="leaveType">Leave Type *</label>
                <select id="leaveType" formControlName="leaveType">
                  <option value="">Select Leave Type</option>
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="PERSONAL">Personal Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
                @if (leaveForm.get('leaveType')?.invalid && leaveForm.get('leaveType')?.touched) {
                  <span class="error-message">Please select a leave type</span>
                }
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="startDate">Start Date *</label>
                <input type="date" id="startDate" formControlName="startDate">
                @if (leaveForm.get('startDate')?.invalid && leaveForm.get('startDate')?.touched) {
                  <span class="error-message">Start date is required</span>
                }
              </div>
              <div class="form-group">
                <label for="endDate">End Date *</label>
                <input type="date" id="endDate" formControlName="endDate">
                @if (leaveForm.get('endDate')?.invalid && leaveForm.get('endDate')?.touched) {
                  <span class="error-message">End date is required</span>
                }
              </div>
            </div>

            <div class="form-group">
              <label for="reason">Reason *</label>
              <textarea id="reason" formControlName="reason" rows="3" 
                placeholder="Please provide a reason for your leave request"></textarea>
              @if (leaveForm.get('reason')?.invalid && leaveForm.get('reason')?.touched) {
                <span class="error-message">Reason is required</span>
              }
            </div>

            @if (errorMessage()) {
              <div class="alert alert-error">
                <span class="material-icons">error</span>
                {{ errorMessage() }}
              </div>
            }

            @if (successMessage()) {
              <div class="alert alert-success">
                <span class="material-icons">check_circle</span>
                {{ successMessage() }}
              </div>
            }

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="resetForm()">
                <span class="material-icons">refresh</span>
                Reset
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="leaveForm.invalid || isLoading()">
                @if (isLoading()) {
                  <span class="spinner"></span>
                  Submitting...
                } @else {
                  <span class="material-icons">send</span>
                  Submit Request
                }
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Leave History -->
      <div class="card leave-history">
        <div class="card-header">
          <h3>Leave Request History</h3>
        </div>
        <div class="card-body">
          @if (leaveRequests().length > 0) {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Applied On</th>
                </tr>
              </thead>
              <tbody>
                @for (request of leaveRequests(); track request.id) {
                  <tr>
                    <td>{{ request.leaveType | titlecase }}</td>
                    <td>{{ request.startDate | date:'mediumDate' }}</td>
                    <td>{{ request.endDate | date:'mediumDate' }}</td>
                    <td>{{ request.days }}</td>
                    <td class="reason-cell">{{ request.reason }}</td>
                    <td>
                      <span class="status-badge" [class]="request.status.toLowerCase()">
                        {{ request.status }}
                      </span>
                    </td>
                    <td>{{ request.createdAt | date:'mediumDate' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <div class="empty-state">
              <span class="material-icons">event_busy</span>
              <p>No leave requests found</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .leave-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .balances-section {
      h3 {
        margin: 0 0 1rem;
        color: var(--text-primary);
      }
    }

    .balance-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .balance-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: var(--shadow-sm);
      border-left: 4px solid;

      &.annual { border-left-color: #2563eb; }
      &.sick { border-left-color: #dc2626; }
      &.personal { border-left-color: #059669; }
      &.unpaid { border-left-color: #6b7280; }
    }

    .balance-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary);

      .material-icons {
        font-size: 1.5rem;
        color: var(--primary-color);
      }
    }

    .balance-info {
      display: flex;
      flex-direction: column;
    }

    .balance-type {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .balance-numbers {
      .available {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .total {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
    }

    .used {
      font-size: 0.75rem;
      color: var(--text-light);
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

      h3 {
        margin: 0;
        font-size: 1.125rem;
        color: var(--text-primary);
      }
    }

    .card-body {
      padding: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      input, select, textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        font-size: 0.9375rem;
        transition: border-color 0.2s;

        &:focus {
          outline: none;
          border-color: var(--primary-color);
        }
      }

      textarea {
        resize: vertical;
      }
    }

    .error-message {
      font-size: 0.75rem;
      color: var(--error-color);
      margin-top: 0.25rem;
      display: block;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;

      &.alert-error {
        background: #fef2f2;
        color: var(--error-color);
      }

      &.alert-success {
        background: #f0fdf4;
        color: #047857;
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1rem;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
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

      td {
        color: var(--text-primary);
      }

      .reason-cell {
        max-width: 200px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
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

    @media (max-width: 1024px) {
      .balance-cards {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .balance-cards,
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LeaveComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);

  leaveBalances = signal<LeaveBalance[]>([]);
  leaveRequests = signal<EmployeeRequest[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  leaveForm!: FormGroup;

  ngOnInit(): void {
    this.leaveForm = this.fb.group({
      leaveType: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      reason: ['', Validators.required]
    });

    this.loadData();
  }

  loadData(): void {
    this.employeeService.getMyLeaveBalances().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.leaveBalances.set(res.data);
        }
      }
    });

    this.employeeService.getMyRequests().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const leaves = res.data.filter(r => r.requestType === 'LEAVE');
          this.leaveRequests.set(leaves);
        }
      }
    });
  }

  submitLeave(): void {
    if (this.leaveForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formValue = this.leaveForm.value;
    
    this.employeeService.submitLeaveRequest({
      leaveType: formValue.leaveType as LeaveType,
      fromDate: formValue.startDate,
      toDate: formValue.endDate,
      reason: formValue.reason
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.successMessage.set('Leave request submitted successfully');
          this.resetForm();
          this.loadData();
        } else {
          this.errorMessage.set(res.message || 'Failed to submit leave request');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to submit leave request');
      }
    });
  }

  resetForm(): void {
    this.leaveForm.reset();
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}

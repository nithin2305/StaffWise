import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeService } from '../../../core/services/employee.service';
import { EmployeeRequest, RequestType } from '../../../core/models';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="requests-page">
      <!-- Request Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab() === 'all'" (click)="setTab('all')">
          All Requests
        </button>
        <button class="tab" [class.active]="activeTab() === 'late'" (click)="setTab('late')">
          Late Coming
        </button>
        <button class="tab" [class.active]="activeTab() === 'overtime'" (click)="setTab('overtime')">
          Overtime
        </button>
      </div>

      <!-- New Request Form -->
      @if (activeTab() !== 'all') {
        <div class="card request-form">
          <div class="card-header">
            <h3>{{ activeTab() === 'late' ? 'Late Coming Request' : 'Overtime Request' }}</h3>
          </div>
          <div class="card-body">
            <form [formGroup]="requestForm" (ngSubmit)="submitRequest()">
              <div class="form-row">
                <div class="form-group">
                  <label for="date">Date *</label>
                  <input type="date" id="date" formControlName="date">
                  @if (requestForm.get('date')?.invalid && requestForm.get('date')?.touched) {
                    <span class="error-message">Date is required</span>
                  }
                </div>

                @if (activeTab() === 'late') {
                  <div class="form-group">
                    <label for="lateMinutes">Late Minutes *</label>
                    <input type="number" id="lateMinutes" formControlName="lateMinutes" min="1">
                    @if (requestForm.get('lateMinutes')?.invalid && requestForm.get('lateMinutes')?.touched) {
                      <span class="error-message">Please enter late minutes</span>
                    }
                  </div>
                } @else {
                  <div class="form-group">
                    <label for="overtimeHours">Overtime Hours *</label>
                    <input type="number" id="overtimeHours" formControlName="overtimeHours" min="0.5" step="0.5">
                    @if (requestForm.get('overtimeHours')?.invalid && requestForm.get('overtimeHours')?.touched) {
                      <span class="error-message">Please enter overtime hours</span>
                    }
                  </div>
                }
              </div>

              <div class="form-group">
                <label for="reason">Reason *</label>
                <textarea id="reason" formControlName="reason" rows="3" 
                  placeholder="Please provide a reason for your request"></textarea>
                @if (requestForm.get('reason')?.invalid && requestForm.get('reason')?.touched) {
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
                  Reset
                </button>
                <button type="submit" class="btn btn-primary" [disabled]="requestForm.invalid || isLoading()">
                  @if (isLoading()) {
                    <span class="spinner"></span>
                  }
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Request History -->
      <div class="card">
        <div class="card-header">
          <h3>{{ activeTab() === 'all' ? 'All Requests' : (activeTab() === 'late' ? 'Late Coming Requests' : 'Overtime Requests') }}</h3>
        </div>
        <div class="card-body">
          @if (filteredRequests().length > 0) {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Details</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Applied On</th>
                  @if (showRemarks()) {
                    <th>Remarks</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (request of filteredRequests(); track request.id) {
                  <tr>
                    <td>
                      <span class="type-badge" [class]="request.requestType.toLowerCase()">
                        {{ request.requestType | titlecase }}
                      </span>
                    </td>
                    <td>{{ request.startDate | date:'mediumDate' }}</td>
                    <td>
                      @if (request.requestType === 'LEAVE') {
                        {{ request.leaveType | titlecase }} ({{ request.days }} days)
                      } @else if (request.requestType === 'LATE_COMING') {
                        {{ request.lateMinutes }} minutes late
                      } @else {
                        {{ request.overtimeHours }} hours overtime
                      }
                    </td>
                    <td class="reason-cell">{{ request.reason }}</td>
                    <td>
                      <span class="status-badge" [class]="request.status.toLowerCase()">
                        {{ request.status }}
                      </span>
                    </td>
                    <td>{{ request.createdAt | date:'mediumDate' }}</td>
                    @if (showRemarks()) {
                      <td>{{ request.rejectionReason || '-' }}</td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <div class="empty-state">
              <span class="material-icons">description</span>
              <p>No requests found</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .requests-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .tabs {
      display: flex;
      gap: 0.5rem;
      background: white;
      padding: 0.5rem;
      border-radius: 12px;
      box-shadow: var(--shadow-sm);
    }

    .tab {
      flex: 1;
      padding: 0.75rem 1rem;
      border: none;
      background: none;
      border-radius: 8px;
      font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: var(--bg-secondary);
      }

      &.active {
        background: var(--primary-color);
        color: white;
      }
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

      input, textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        font-size: 0.9375rem;

        &:focus {
          outline: none;
          border-color: var(--primary-color);
        }
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
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 0.5rem;
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

      .reason-cell {
        max-width: 200px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .type-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;

      &.leave { background: #dbeafe; color: #1d4ed8; }
      &.late_coming { background: #fef3c7; color: #b45309; }
      &.overtime { background: #d1fae5; color: #047857; }
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

    @media (max-width: 640px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RequestsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);

  activeTab = signal<'all' | 'late' | 'overtime'>('all');
  allRequests = signal<EmployeeRequest[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  requestForm!: FormGroup;

  filteredRequests = signal<EmployeeRequest[]>([]);
  showRemarks = signal(false);

  ngOnInit(): void {
    this.initForm();
    this.loadRequests();
  }

  initForm(): void {
    this.requestForm = this.fb.group({
      date: ['', Validators.required],
      lateMinutes: [''],
      overtimeHours: [''],
      reason: ['', Validators.required]
    });
  }

  setTab(tab: 'all' | 'late' | 'overtime'): void {
    this.activeTab.set(tab);
    this.updateFilteredRequests();
    this.resetForm();
    
    // Update validators based on tab
    if (tab === 'late') {
      this.requestForm.get('lateMinutes')?.setValidators([Validators.required, Validators.min(1)]);
      this.requestForm.get('overtimeHours')?.clearValidators();
    } else if (tab === 'overtime') {
      this.requestForm.get('overtimeHours')?.setValidators([Validators.required, Validators.min(0.5)]);
      this.requestForm.get('lateMinutes')?.clearValidators();
    }
    
    this.requestForm.get('lateMinutes')?.updateValueAndValidity();
    this.requestForm.get('overtimeHours')?.updateValueAndValidity();
  }

  loadRequests(): void {
    this.employeeService.getMyRequests().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.allRequests.set(res.data);
          this.updateFilteredRequests();
        }
      }
    });
  }

  updateFilteredRequests(): void {
    const requests = this.allRequests();
    const tab = this.activeTab();
    
    if (tab === 'all') {
      this.filteredRequests.set(requests);
      this.showRemarks.set(true);
    } else if (tab === 'late') {
      this.filteredRequests.set(requests.filter(r => r.requestType === 'LATE_COMING'));
      this.showRemarks.set(true);
    } else {
      this.filteredRequests.set(requests.filter(r => r.requestType === 'OVERTIME'));
      this.showRemarks.set(true);
    }
  }

  submitRequest(): void {
    if (this.requestForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formValue = this.requestForm.value;
    const tab = this.activeTab();

    const request: Partial<EmployeeRequest> = {
      startDate: formValue.date,
      reason: formValue.reason
    };

    const observable = tab === 'late'
      ? this.employeeService.submitLateComingRequest({
          ...request,
          lateMinutes: formValue.lateMinutes
        })
      : this.employeeService.submitOvertimeRequest({
          ...request,
          overtimeHours: formValue.overtimeHours
        });

    observable.subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.successMessage.set('Request submitted successfully');
          this.resetForm();
          this.loadRequests();
        } else {
          this.errorMessage.set(res.message || 'Failed to submit request');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to submit request');
      }
    });
  }

  resetForm(): void {
    this.requestForm.reset();
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}

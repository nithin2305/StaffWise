import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HrService } from '../../../core/services/hr.service';
import { EmployeeRequest } from '../../../core/models';

@Component({
  selector: 'app-leave-approval',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="leave-approval-page">
      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card pending">
          <span class="material-icons">hourglass_empty</span>
          <div class="stat-info">
            <h3>{{ pendingCount() }}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div class="stat-card approved">
          <span class="material-icons">check_circle</span>
          <div class="stat-info">
            <h3>{{ approvedCount() }}</h3>
            <p>Approved Today</p>
          </div>
        </div>
        <div class="stat-card rejected">
          <span class="material-icons">cancel</span>
          <div class="stat-info">
            <h3>{{ rejectedCount() }}</h3>
            <p>Rejected Today</p>
          </div>
        </div>
      </div>

      <!-- Pending Requests -->
      <div class="card">
        <div class="card-header">
          <h3>Pending Leave Requests</h3>
        </div>
        <div class="card-body">
          @if (pendingRequests().length > 0) {
            <div class="request-cards">
              @for (request of pendingRequests(); track request.id) {
                <div class="request-card">
                  <div class="request-header">
                    <div class="employee-info">
                      <div class="avatar">{{ getInitials(request.employeeName!) }}</div>
                      <div class="details">
                        <span class="name">{{ request.employeeName }}</span>
                        <span class="code">{{ request.empCode }}</span>
                      </div>
                    </div>
                    <span class="leave-type" [class]="request.leaveType!.toLowerCase()">
                      {{ request.leaveType | titlecase }}
                    </span>
                  </div>
                  <div class="request-body">
                    <div class="date-range">
                      <div class="date">
                        <span class="label">From</span>
                        <span class="value">{{ request.startDate | date:'mediumDate' }}</span>
                      </div>
                      <span class="material-icons">arrow_forward</span>
                      <div class="date">
                        <span class="label">To</span>
                        <span class="value">{{ request.endDate | date:'mediumDate' }}</span>
                      </div>
                      <div class="days">
                        <span class="value">{{ request.days }}</span>
                        <span class="label">Days</span>
                      </div>
                    </div>
                    <div class="reason">
                      <span class="label">Reason:</span>
                      <span class="value">{{ request.reason }}</span>
                    </div>
                    <div class="applied-on">
                      Applied on {{ request.createdAt | date:'medium' }}
                    </div>
                  </div>
                  <div class="request-footer">
                    <button class="btn btn-success" (click)="approveRequest(request.id!)">
                      <span class="material-icons">check</span>
                      Approve
                    </button>
                    <button class="btn btn-danger" (click)="openRejectModal(request)">
                      <span class="material-icons">close</span>
                      Reject
                    </button>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state">
              <span class="material-icons">event_available</span>
              <p>No pending leave requests</p>
            </div>
          }
        </div>
      </div>

      <!-- Reject Modal -->
      @if (showRejectModal()) {
        <div class="modal-overlay" (click)="closeRejectModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Reject Leave Request</h3>
              <button class="close-btn" (click)="closeRejectModal()">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Rejection Reason *</label>
                <textarea [(ngModel)]="rejectionReason" rows="3" 
                  placeholder="Please provide a reason for rejection"></textarea>
              </div>
              <div class="form-actions">
                <button class="btn btn-secondary" (click)="closeRejectModal()">Cancel</button>
                <button class="btn btn-danger" (click)="confirmReject()" 
                  [disabled]="!rejectionReason">
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
    .leave-approval-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
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

      .material-icons { font-size: 2.5rem; }

      &.pending { 
        .material-icons { color: #f59e0b; }
      }
      &.approved { 
        .material-icons { color: #10b981; }
      }
      &.rejected { 
        .material-icons { color: #ef4444; }
      }
    }

    .stat-info {
      h3 { margin: 0; font-size: 1.75rem; }
      p { margin: 0; color: var(--text-secondary); }
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

    .request-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1rem;
    }

    .request-card {
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
    }

    .request-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: var(--bg-secondary);
    }

    .employee-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--primary-color);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
      }

      .details {
        display: flex;
        flex-direction: column;
        .name { font-weight: 600; }
        .code { font-size: 0.75rem; color: var(--text-secondary); }
      }
    }

    .leave-type {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;

      &.annual { background: #dbeafe; color: #1d4ed8; }
      &.sick { background: #fee2e2; color: #b91c1c; }
      &.personal { background: #d1fae5; color: #047857; }
      &.unpaid { background: #f3f4f6; color: #6b7280; }
    }

    .request-body {
      padding: 1rem;
    }

    .date-range {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;

      .date {
        display: flex;
        flex-direction: column;
        .label { font-size: 0.75rem; color: var(--text-secondary); }
        .value { font-weight: 600; }
      }

      .material-icons { color: var(--text-light); }

      .days {
        margin-left: auto;
        text-align: center;
        padding: 0.5rem 1rem;
        background: var(--primary-color);
        color: white;
        border-radius: 8px;

        .value { font-size: 1.25rem; font-weight: 700; display: block; }
        .label { font-size: 0.75rem; }
      }
    }

    .reason {
      padding: 0.75rem;
      background: var(--bg-secondary);
      border-radius: 8px;
      margin-bottom: 0.5rem;

      .label { font-weight: 500; }
      .value { color: var(--text-secondary); }
    }

    .applied-on {
      font-size: 0.75rem;
      color: var(--text-light);
    }

    .request-footer {
      display: flex;
      gap: 0.5rem;
      padding: 1rem;
      border-top: 1px solid var(--border-color);

      .btn { flex: 1; }
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
      max-width: 500px;
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

      .material-icons { font-size: 3rem; margin-bottom: 0.5rem; }
    }
  `]
})
export class LeaveApprovalComponent implements OnInit {
  private hrService = inject(HrService);

  pendingRequests = signal<EmployeeRequest[]>([]);
  pendingCount = signal(0);
  approvedCount = signal(0);
  rejectedCount = signal(0);

  showRejectModal = signal(false);
  selectedRequest = signal<EmployeeRequest | null>(null);
  rejectionReason = '';

  ngOnInit(): void {
    this.loadPendingRequests();
  }

  loadPendingRequests(): void {
    this.hrService.getPendingLeaveRequests().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.pendingRequests.set(res.data);
          this.pendingCount.set(res.data.length);
        }
      }
    });
  }

  approveRequest(id: number): void {
    this.hrService.approveRequest(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.approvedCount.update(c => c + 1);
          this.loadPendingRequests();
        }
      }
    });
  }

  openRejectModal(request: EmployeeRequest): void {
    this.selectedRequest.set(request);
    this.rejectionReason = '';
    this.showRejectModal.set(true);
  }

  closeRejectModal(): void {
    this.showRejectModal.set(false);
    this.selectedRequest.set(null);
    this.rejectionReason = '';
  }

  confirmReject(): void {
    const request = this.selectedRequest();
    if (!request || !this.rejectionReason) return;

    this.hrService.rejectRequest(request.id!, this.rejectionReason).subscribe({
      next: (res) => {
        if (res.success) {
          this.rejectedCount.update(c => c + 1);
          this.closeRejectModal();
          this.loadPendingRequests();
        }
      }
    });
  }

  getInitials(name: string): string {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '';
  }
}

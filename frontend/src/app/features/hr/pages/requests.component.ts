import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HrService } from '../../../core/services/hr.service';
import { EmployeeRequest } from '../../../core/models';

@Component({
  selector: 'app-hr-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="requests-page">
      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab() === 'late'" (click)="setTab('late')">
          Late Coming ({{ latePendingCount() }})
        </button>
        <button class="tab" [class.active]="activeTab() === 'overtime'" (click)="setTab('overtime')">
          Overtime ({{ overtimePendingCount() }})
        </button>
      </div>

      <!-- Requests List -->
      <div class="card">
        <div class="card-header">
          <h3>{{ activeTab() === 'late' ? 'Late Coming' : 'Overtime' }} Requests</h3>
        </div>
        <div class="card-body">
          @if (filteredRequests().length > 0) {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>{{ activeTab() === 'late' ? 'Late Minutes' : 'Overtime Hours' }}</th>
                  <th>Reason</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (request of filteredRequests(); track request.id) {
                  <tr>
                    <td>
                      <div class="employee-cell">
                        <div class="avatar">{{ getInitials(request.employeeName!) }}</div>
                        <div class="details">
                          <span class="name">{{ request.employeeName }}</span>
                          <span class="code">{{ request.empCode }}</span>
                        </div>
                      </div>
                    </td>
                    <td>{{ request.startDate | date:'mediumDate' }}</td>
                    <td>
                      @if (activeTab() === 'late') {
                        {{ request.lateMinutes }} minutes
                      } @else {
                        {{ request.overtimeHours }} hours
                      }
                    </td>
                    <td class="reason-cell">{{ request.reason }}</td>
                    <td>{{ request.createdAt | date:'medium' }}</td>
                    <td>
                      <span class="status-badge" [class]="request.status.toLowerCase()">
                        {{ request.status }}
                      </span>
                    </td>
                    <td>
                      @if (request.status === 'PENDING') {
                        <div class="action-buttons">
                          <button class="btn btn-sm btn-success" (click)="approveRequest(request.id!)">
                            <span class="material-icons">check</span>
                          </button>
                          <button class="btn btn-sm btn-danger" (click)="openRejectModal(request)">
                            <span class="material-icons">close</span>
                          </button>
                        </div>
                      } @else {
                        <span class="text-muted">-</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <div class="empty-state">
              <span class="material-icons">description</span>
              <p>No {{ activeTab() === 'late' ? 'late coming' : 'overtime' }} requests found</p>
            </div>
          }
        </div>
      </div>

      <!-- Reject Modal -->
      @if (showRejectModal()) {
        <div class="modal-overlay" (click)="closeRejectModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Reject Request</h3>
              <button class="close-btn" (click)="closeRejectModal()">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Rejection Reason *</label>
                <textarea [(ngModel)]="rejectionReason" rows="3"></textarea>
              </div>
              <div class="form-actions">
                <button class="btn btn-secondary" (click)="closeRejectModal()">Cancel</button>
                <button class="btn btn-danger" (click)="confirmReject()" [disabled]="!rejectionReason">
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      }
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

      &:hover { background: var(--bg-secondary); }
      &.active {
        background: var(--primary-color);
        color: white;
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

      .reason-cell {
        max-width: 200px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .employee-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--primary-color);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .details {
        display: flex;
        flex-direction: column;
        .name { font-weight: 500; }
        .code { font-size: 0.75rem; color: var(--text-secondary); }
      }
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;

      &.pending { background: #fef3c7; color: #b45309; }
      &.approved { background: #d1fae5; color: #047857; }
      &.rejected { background: #fee2e2; color: #b91c1c; }
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .btn-sm {
      padding: 0.375rem;
      .material-icons { font-size: 1rem; }
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

      .material-icons { font-size: 3rem; margin-bottom: 0.5rem; }
    }
  `]
})
export class HrRequestsComponent implements OnInit {
  private hrService = inject(HrService);

  activeTab = signal<'late' | 'overtime'>('late');
  lateRequests = signal<EmployeeRequest[]>([]);
  overtimeRequests = signal<EmployeeRequest[]>([]);
  filteredRequests = signal<EmployeeRequest[]>([]);

  latePendingCount = signal(0);
  overtimePendingCount = signal(0);

  showRejectModal = signal(false);
  selectedRequest = signal<EmployeeRequest | null>(null);
  rejectionReason = '';

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.hrService.getPendingLateRequests().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.lateRequests.set(res.data);
          this.latePendingCount.set(res.data.filter(r => r.status === 'PENDING').length);
          if (this.activeTab() === 'late') {
            this.filteredRequests.set(res.data);
          }
        }
      }
    });

    this.hrService.getPendingOvertimeRequests().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.overtimeRequests.set(res.data);
          this.overtimePendingCount.set(res.data.filter(r => r.status === 'PENDING').length);
          if (this.activeTab() === 'overtime') {
            this.filteredRequests.set(res.data);
          }
        }
      }
    });
  }

  setTab(tab: 'late' | 'overtime'): void {
    this.activeTab.set(tab);
    this.filteredRequests.set(tab === 'late' ? this.lateRequests() : this.overtimeRequests());
  }

  approveRequest(id: number): void {
    this.hrService.approveRequest(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadRequests();
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
  }

  confirmReject(): void {
    const request = this.selectedRequest();
    if (!request || !this.rejectionReason) return;

    this.hrService.rejectRequest(request.id!, this.rejectionReason).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeRejectModal();
          this.loadRequests();
        }
      }
    });
  }

  getInitials(name: string): string {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '';
  }
}

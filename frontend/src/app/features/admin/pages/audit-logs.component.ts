import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

interface AuditLog {
  id: number;
  username: string;
  action: string;
  entityType: string;
  entityId: number;
  details: string;
  ipAddress: string;
  timestamp: Date;
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="audit-logs-page">
      <!-- Filters -->
      <div class="card filters">
        <div class="filter-row">
          <div class="search-box">
            <span class="material-icons">search</span>
            <input type="text" placeholder="Search logs..." [(ngModel)]="searchTerm" (input)="filterLogs()">
          </div>
          <div class="filter-group">
            <select [(ngModel)]="actionFilter" (change)="filterLogs()">
              <option value="">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="APPROVE">Approve</option>
              <option value="REJECT">Reject</option>
            </select>
          </div>
          <div class="filter-group">
            <input type="date" [(ngModel)]="startDate" placeholder="Start Date">
          </div>
          <div class="filter-group">
            <input type="date" [(ngModel)]="endDate" placeholder="End Date">
          </div>
          <button class="btn btn-secondary" (click)="applyDateFilter()">
            <span class="material-icons">filter_list</span>
            Apply
          </button>
          <button class="btn btn-secondary" (click)="resetFilters()">
            <span class="material-icons">refresh</span>
            Reset
          </button>
        </div>
      </div>

      <!-- Logs Table -->
      <div class="card">
        <div class="card-header">
          <h3>Audit Logs</h3>
          <span class="count">{{ filteredLogs().length }} records</span>
        </div>
        <div class="card-body">
          @if (filteredLogs().length > 0) {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>Entity ID</th>
                  <th>Details</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                @for (log of filteredLogs(); track log.id) {
                  <tr>
                    <td>{{ log.timestamp | date:'medium' }}</td>
                    <td>
                      <div class="user-cell">
                        <div class="avatar">{{ getInitials(log.username) }}</div>
                        <span>{{ log.username }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="action-badge" [class]="log.action.toLowerCase()">
                        {{ log.action }}
                      </span>
                    </td>
                    <td>{{ log.entityType }}</td>
                    <td>{{ log.entityId || '-' }}</td>
                    <td class="details-cell" [title]="log.details">{{ log.details }}</td>
                    <td>{{ log.ipAddress }}</td>
                  </tr>
                }
              </tbody>
            </table>

            <!-- Pagination -->
            <div class="pagination">
              <button class="btn btn-secondary" [disabled]="currentPage() === 0" (click)="prevPage()">
                <span class="material-icons">chevron_left</span>
              </button>
              <span>Page {{ currentPage() + 1 }} of {{ totalPages() }}</span>
              <button class="btn btn-secondary" [disabled]="currentPage() >= totalPages() - 1" (click)="nextPage()">
                <span class="material-icons">chevron_right</span>
              </button>
            </div>
          } @else {
            <div class="empty-state">
              <span class="material-icons">history</span>
              <p>No audit logs found</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .audit-logs-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .card {
      background: white;
      border-radius: 12px;
      box-shadow: var(--shadow-sm);
    }

    .filters { padding: 1rem 1.5rem; }

    .filter-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-secondary);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      flex: 1;
      max-width: 250px;

      input {
        border: none;
        background: transparent;
        flex: 1;
        outline: none;
      }

      .material-icons { color: var(--text-secondary); }
    }

    .filter-group {
      select, input {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 6px;
      }
    }

    .card-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 { margin: 0; }
      .count { color: var(--text-secondary); font-size: 0.875rem; }
    }

    .card-body { padding: 0; }

    .data-table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        padding: 0.75rem 1rem;
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

      .details-cell {
        max-width: 250px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #7c3aed;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 600;
      }
    }

    .action-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;

      &.login { background: #d1fae5; color: #047857; }
      &.logout { background: #fef3c7; color: #b45309; }
      &.create { background: #dbeafe; color: #1d4ed8; }
      &.update { background: #e0e7ff; color: #4f46e5; }
      &.delete { background: #fee2e2; color: #b91c1c; }
      &.approve { background: #d1fae5; color: #047857; }
      &.reject { background: #fee2e2; color: #b91c1c; }
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 1rem;
      border-top: 1px solid var(--border-color);

      button {
        padding: 0.5rem;
        .material-icons { font-size: 1.25rem; }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
      }
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
export class AuditLogsComponent implements OnInit {
  private adminService = inject(AdminService);

  logs = signal<AuditLog[]>([]);
  filteredLogs = signal<AuditLog[]>([]);
  currentPage = signal(0);
  totalPages = signal(1);
  pageSize = 20;

  searchTerm = '';
  actionFilter = '';
  startDate = '';
  endDate = '';

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.adminService.getAuditLogs(this.currentPage(), this.pageSize).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const data = res.data.content || res.data;
          this.logs.set(data);
          this.totalPages.set(res.data.totalPages || Math.ceil(data.length / this.pageSize));
          this.filterLogs();
        }
      }
    });
  }

  filterLogs(): void {
    let result = this.logs();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(log =>
        log.username?.toLowerCase().includes(term) ||
        log.details?.toLowerCase().includes(term) ||
        log.entityType?.toLowerCase().includes(term)
      );
    }

    if (this.actionFilter) {
      result = result.filter(log => log.action === this.actionFilter);
    }

    this.filteredLogs.set(result);
  }

  applyDateFilter(): void {
    let result = this.logs();

    if (this.startDate) {
      const start = new Date(this.startDate);
      result = result.filter(log => new Date(log.timestamp) >= start);
    }

    if (this.endDate) {
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59);
      result = result.filter(log => new Date(log.timestamp) <= end);
    }

    this.filteredLogs.set(result);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.actionFilter = '';
    this.startDate = '';
    this.endDate = '';
    this.currentPage.set(0);
    this.loadLogs();
  }

  prevPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadLogs();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.loadLogs();
    }
  }

  getInitials(name: string): string {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '';
  }
}

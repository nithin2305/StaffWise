import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HrService } from '../../../core/services/hr.service';
import { Attendance, Employee, AttendanceStatus } from '../../../core/models';

@Component({
  selector: 'app-hr-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="attendance-page">
      <!-- Filters -->
      <div class="card filters">
        <div class="filter-row">
          <div class="filter-group">
            <label>Date</label>
            <input type="date" [(ngModel)]="selectedDate" (change)="loadAttendance()">
          </div>
          <div class="filter-group">
            <label>Employee</label>
            <select [(ngModel)]="selectedEmployee" (change)="loadEmployeeAttendance()">
              <option value="">All Employees</option>
              @for (emp of employees(); track emp.id) {
                <option [value]="emp.id">{{ emp.fullName }} ({{ emp.empCode }})</option>
              }
            </select>
          </div>
          <button class="btn btn-secondary" (click)="resetFilters()">
            <span class="material-icons">refresh</span>
            Reset
          </button>
        </div>
      </div>

      <!-- Attendance Summary -->
      <div class="summary-grid">
        <div class="summary-card">
          <span class="material-icons present">check_circle</span>
          <div class="summary-info">
            <h4>{{ summary().present }}</h4>
            <p>Present</p>
          </div>
        </div>
        <div class="summary-card">
          <span class="material-icons absent">cancel</span>
          <div class="summary-info">
            <h4>{{ summary().absent }}</h4>
            <p>Absent</p>
          </div>
        </div>
        <div class="summary-card">
          <span class="material-icons late">schedule</span>
          <div class="summary-info">
            <h4>{{ summary().late }}</h4>
            <p>Late</p>
          </div>
        </div>
        <div class="summary-card">
          <span class="material-icons leave">event_busy</span>
          <div class="summary-info">
            <h4>{{ summary().onLeave }}</h4>
            <p>On Leave</p>
          </div>
        </div>
      </div>

      <!-- Attendance Table -->
      <div class="card">
        <div class="card-header">
          <h3>Attendance Records</h3>
        </div>
        <div class="card-body">
          @if (attendanceRecords().length > 0) {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                  <th>Late Minutes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (att of attendanceRecords(); track att.id) {
                  <tr>
                    <td>
                      <div class="employee-cell">
                        <div class="avatar">{{ getInitials(att.employeeName!) }}</div>
                        <span>{{ att.employeeName }}</span>
                      </div>
                    </td>
                    <td>{{ att.attendanceDate | date:'mediumDate' }}</td>
                    <td>{{ att.checkIn || '-' }}</td>
                    <td>{{ att.checkOut || '-' }}</td>
                    <td>{{ att.workingHours || 0 | number:'1.1-1' }} hrs</td>
                    <td>
                      <span class="status-badge" [class]="att.status?.toLowerCase() || 'present'">
                        {{ att.status || 'PRESENT' }}
                      </span>
                    </td>
                    <td>{{ att.lateMinutes || 0 }} min</td>
                    <td>
                      <button class="btn btn-sm btn-secondary" (click)="editAttendance(att)">
                        <span class="material-icons">edit</span>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <div class="empty-state">
              <span class="material-icons">event_available</span>
              <p>No attendance records found</p>
            </div>
          }
        </div>
      </div>

      <!-- Edit Modal -->
      @if (showEditModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Edit Attendance</h3>
              <button class="close-btn" (click)="closeModal()">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Check In Time</label>
                <input type="time" [(ngModel)]="editForm.checkIn">
              </div>
              <div class="form-group">
                <label>Check Out Time</label>
                <input type="time" [(ngModel)]="editForm.checkOut">
              </div>
              <div class="form-group">
                <label>Status</label>
                <select [(ngModel)]="editForm.status">
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LATE">Late</option>
                  <option value="LEAVE">On Leave</option>
                  <option value="HALF_DAY">Half Day</option>
                </select>
              </div>
              <div class="form-group">
                <label>Remarks</label>
                <textarea [(ngModel)]="editForm.remarks" rows="2"></textarea>
              </div>
              <div class="form-actions">
                <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
                <button class="btn btn-primary" (click)="saveAttendance()">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .attendance-page {
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
      align-items: flex-end;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
      }

      input, select {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        font-size: 0.9375rem;
        min-width: 200px;
      }
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .summary-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: var(--shadow-sm);

      .material-icons {
        font-size: 2.5rem;

        &.present { color: #10b981; }
        &.absent { color: #ef4444; }
        &.late { color: #f59e0b; }
        &.leave { color: #6366f1; }
      }
    }

    .summary-info {
      h4 { margin: 0; font-size: 1.75rem; }
      p { margin: 0; color: var(--text-secondary); }
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

      tbody tr:hover { background: var(--bg-secondary); }
    }

    .employee-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--primary-color);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 600;
      }
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;

      &.present { background: #d1fae5; color: #047857; }
      &.absent { background: #fee2e2; color: #b91c1c; }
      &.late { background: #fef3c7; color: #b45309; }
      &.leave { background: #e0e7ff; color: #4f46e5; }
      &.half_day { background: #fef3c7; color: #b45309; }
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

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }

      input, select, textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 8px;
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      color: var(--text-secondary);

      .material-icons { font-size: 3rem; margin-bottom: 0.5rem; }
    }

    @media (max-width: 768px) {
      .summary-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class HrAttendanceComponent implements OnInit {
  private hrService = inject(HrService);

  employees = signal<Employee[]>([]);
  attendanceRecords = signal<Attendance[]>([]);
  showEditModal = signal(false);
  editingAttendance = signal<Attendance | null>(null);

  selectedDate = new Date().toISOString().split('T')[0];
  selectedEmployee = '';

  summary = signal({
    present: 0,
    absent: 0,
    late: 0,
    onLeave: 0
  });

  editForm: { checkIn: string; checkOut: string; status: AttendanceStatus; remarks: string } = {
    checkIn: '',
    checkOut: '',
    status: 'PRESENT',
    remarks: ''
  };

  ngOnInit(): void {
    this.loadEmployees();
    this.loadAttendance();
  }

  loadEmployees(): void {
    this.hrService.getActiveEmployees().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.employees.set(res.data);
        }
      }
    });
  }

  loadAttendance(): void {
    this.hrService.getAttendanceByDate(this.selectedDate).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.attendanceRecords.set(res.data);
          this.calculateSummary(res.data);
        }
      }
    });
  }

  loadEmployeeAttendance(): void {
    if (!this.selectedEmployee) {
      this.loadAttendance();
      return;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    this.hrService.getEmployeeAttendance(
      parseInt(this.selectedEmployee),
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.attendanceRecords.set(res.data);
          this.calculateSummary(res.data);
        }
      }
    });
  }

  calculateSummary(records: Attendance[]): void {
    const summary = {
      present: records.filter(r => !r.status || r.status === 'PRESENT').length,
      absent: records.filter(r => r.status === 'ABSENT').length,
      late: records.filter(r => r.status === 'LATE').length,
      onLeave: records.filter(r => r.status === 'LEAVE').length
    };
    this.summary.set(summary);
  }

  resetFilters(): void {
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.selectedEmployee = '';
    this.loadAttendance();
  }

  editAttendance(att: Attendance): void {
    this.editingAttendance.set(att);
    this.editForm = {
      checkIn: att.checkIn || '',
      checkOut: att.checkOut || '',
      status: att.status || 'PRESENT',
      remarks: att.remarks || ''
    };
    this.showEditModal.set(true);
  }

  closeModal(): void {
    this.showEditModal.set(false);
    this.editingAttendance.set(null);
  }

  saveAttendance(): void {
    const att = this.editingAttendance();
    if (!att) return;

    this.hrService.updateAttendance(att.id!, this.editForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal();
          this.loadAttendance();
        }
      }
    });
  }

  getInitials(name: string): string {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '';
  }
}

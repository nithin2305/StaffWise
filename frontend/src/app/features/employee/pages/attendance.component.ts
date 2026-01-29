import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../core/services/employee.service';
import { Attendance } from '../../../core/models';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="attendance-page">
      <!-- Today's Status -->
      <div class="today-status">
        <div class="status-card">
          <div class="status-header">
            <span class="material-icons">today</span>
            <h3>Today's Attendance</h3>
          </div>
          <div class="status-body">
            <div class="time-display">
              <div class="time-item">
                <span class="label">Check In</span>
                <span class="value">{{ todayAttendance()?.checkIn || '--:--' }}</span>
              </div>
              <div class="time-item">
                <span class="label">Check Out</span>
                <span class="value">{{ todayAttendance()?.checkOut || '--:--' }}</span>
              </div>
              <div class="time-item">
                <span class="label">Working Hours</span>
                <span class="value">{{ (todayAttendance()?.workingHours || 0) | number:'1.1-1' }} hrs</span>
              </div>
            </div>
            <div class="action-buttons">
              <button class="btn btn-success" (click)="checkIn()" [disabled]="checkedIn()">
                <span class="material-icons">login</span>
                Check In
              </button>
              <button class="btn btn-warning" (click)="checkOut()" [disabled]="!checkedIn()">
                <span class="material-icons">logout</span>
                Check Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters card">
        <div class="filter-row">
          <div class="filter-group">
            <label>From Date</label>
            <input type="date" [(ngModel)]="startDate" (change)="loadAttendance()">
          </div>
          <div class="filter-group">
            <label>To Date</label>
            <input type="date" [(ngModel)]="endDate" (change)="loadAttendance()">
          </div>
          <button class="btn btn-primary" (click)="loadAttendance()">
            <span class="material-icons">search</span>
            Filter
          </button>
        </div>
      </div>

      <!-- Attendance History -->
      <div class="card">
        <div class="card-header">
          <h3>Attendance History</h3>
        </div>
        <div class="card-body">
          @if (attendance().length > 0) {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                  <th>Late Minutes</th>
                  <th>Overtime Hours</th>
                </tr>
              </thead>
              <tbody>
                @for (att of attendance(); track att.id) {
                  <tr>
                    <td>{{ att.attendanceDate | date:'mediumDate' }}</td>
                    <td>{{ att.attendanceDate | date:'EEEE' }}</td>
                    <td>{{ att.checkIn || '-' }}</td>
                    <td>{{ att.checkOut || '-' }}</td>
                    <td>{{ att.workingHours || 0 | number:'1.1-1' }} hrs</td>
                    <td>
                      <span class="status-badge" [class]="att.status?.toLowerCase() || 'present'">
                        {{ att.status || 'PRESENT' }}
                      </span>
                    </td>
                    <td>{{ att.lateMinutes || 0 }} min</td>
                    <td>{{ att.overtimeHours || 0 | number:'1.1-1' }} hrs</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <div class="empty-state">
              <span class="material-icons">event_available</span>
              <p>No attendance records found for the selected period</p>
            </div>
          }
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="summary-grid">
        <div class="summary-card">
          <span class="material-icons">check_circle</span>
          <div class="summary-info">
            <h4>{{ stats().presentDays }}</h4>
            <p>Present Days</p>
          </div>
        </div>
        <div class="summary-card">
          <span class="material-icons">cancel</span>
          <div class="summary-info">
            <h4>{{ stats().absentDays }}</h4>
            <p>Absent Days</p>
          </div>
        </div>
        <div class="summary-card">
          <span class="material-icons">schedule</span>
          <div class="summary-info">
            <h4>{{ stats().lateDays }}</h4>
            <p>Late Days</p>
          </div>
        </div>
        <div class="summary-card">
          <span class="material-icons">timer</span>
          <div class="summary-info">
            <h4>{{ stats().totalHours | number:'1.0-0' }}</h4>
            <p>Total Hours</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .attendance-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .today-status {
      .status-card {
        background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
        border-radius: 12px;
        padding: 1.5rem;
        color: white;
      }
    }

    .status-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;

      .material-icons {
        font-size: 1.5rem;
      }

      h3 {
        margin: 0;
        font-size: 1.25rem;
      }
    }

    .status-body {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .time-display {
      display: flex;
      gap: 2rem;
    }

    .time-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      .label {
        font-size: 0.75rem;
        opacity: 0.8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .value {
        font-size: 1.5rem;
        font-weight: 600;
      }
    }

    .action-buttons {
      display: flex;
      gap: 1rem;
    }

    .filters {
      padding: 1rem 1.5rem;
    }

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

      input {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        font-size: 0.9375rem;
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
      padding: 1rem 1.5rem;
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
        letter-spacing: 0.5px;
        background: var(--bg-secondary);
      }

      td {
        color: var(--text-primary);
      }

      tbody tr:hover {
        background: var(--bg-secondary);
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
      &.leave { background: #dbeafe; color: #1d4ed8; }
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
        font-size: 2rem;
        color: var(--primary-color);
      }
    }

    .summary-info {
      h4 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--text-primary);
      }

      p {
        margin: 0.25rem 0 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
    }

    @media (max-width: 768px) {
      .status-body {
        flex-direction: column;
        align-items: flex-start;
      }

      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class AttendanceComponent implements OnInit {
  private employeeService = inject(EmployeeService);

  attendance = signal<Attendance[]>([]);
  todayAttendance = signal<Attendance | null>(null);
  checkedIn = signal(false);
  
  startDate = '';
  endDate = '';

  stats = signal({
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    totalHours: 0
  });

  ngOnInit(): void {
    // Set default date range (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    this.startDate = firstDay.toISOString().split('T')[0];
    this.endDate = lastDay.toISOString().split('T')[0];

    this.loadAttendance();
  }

  loadAttendance(): void {
    this.employeeService.getMyAttendanceByRange(this.startDate, this.endDate).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.attendance.set(res.data);
          this.calculateStats(res.data);
          
          // Check today's attendance
          const today = new Date().toISOString().split('T')[0];
          const todayAtt = res.data.find(a => a.attendanceDate === today);
          if (todayAtt) {
            this.todayAttendance.set(todayAtt);
            this.checkedIn.set(!!todayAtt.checkIn && !todayAtt.checkOut);
          }
        }
      }
    });
  }

  calculateStats(data: Attendance[]): void {
    const presentDays = data.filter(a => a.status === 'PRESENT' || !a.status).length;
    const absentDays = data.filter(a => a.status === 'ABSENT').length;
    const lateDays = data.filter(a => a.status === 'LATE').length;
    const totalHours = data.reduce((sum, a) => sum + (a.workingHours || 0), 0);

    this.stats.set({ presentDays, absentDays, lateDays, totalHours });
  }

  checkIn(): void {
    if (this.checkedIn()) return;
    
    this.employeeService.checkIn().subscribe({
      next: (res) => {
        if (res.success) {
          this.checkedIn.set(true);
          this.todayAttendance.set(res.data || null);
          this.loadAttendance();
        }
      }
    });
  }

  checkOut(): void {
    if (!this.checkedIn()) return;
    
    this.employeeService.checkOut().subscribe({
      next: (res) => {
        if (res.success) {
          this.checkedIn.set(false);
          this.todayAttendance.set(res.data || null);
          this.loadAttendance();
        }
      }
    });
  }
}

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">
      <!-- Company Settings -->
      <div class="card">
        <div class="card-header">
          <h3>Company Settings</h3>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label>Company Name</label>
            <input type="text" [(ngModel)]="settings.companyName">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Work Start Time</label>
              <input type="time" [(ngModel)]="settings.workStartTime">
            </div>
            <div class="form-group">
              <label>Work End Time</label>
              <input type="time" [(ngModel)]="settings.workEndTime">
            </div>
          </div>
          <div class="form-group">
            <label>Late Threshold (minutes)</label>
            <input type="number" [(ngModel)]="settings.lateThreshold">
          </div>
        </div>
      </div>

      <!-- Leave Settings -->
      <div class="card">
        <div class="card-header">
          <h3>Leave Settings</h3>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label>Annual Leave (days)</label>
              <input type="number" [(ngModel)]="settings.annualLeave">
            </div>
            <div class="form-group">
              <label>Sick Leave (days)</label>
              <input type="number" [(ngModel)]="settings.sickLeave">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Casual Leave (days)</label>
              <input type="number" [(ngModel)]="settings.casualLeave">
            </div>
            <div class="form-group">
              <label>Maternity Leave (days)</label>
              <input type="number" [(ngModel)]="settings.maternityLeave">
            </div>
          </div>
        </div>
      </div>

      <!-- Payroll Settings -->
      <div class="card">
        <div class="card-header">
          <h3>Payroll Settings</h3>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label>PF Percentage (%)</label>
              <input type="number" step="0.1" [(ngModel)]="settings.pfPercentage">
            </div>
            <div class="form-group">
              <label>ESI Percentage (%)</label>
              <input type="number" step="0.1" [(ngModel)]="settings.esiPercentage">
            </div>
          </div>
          <div class="form-group">
            <label>HRA Percentage (%)</label>
            <input type="number" step="0.1" [(ngModel)]="settings.hraPercentage">
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions">
        <button class="btn btn-secondary" (click)="resetSettings()">Reset to Defaults</button>
        <button class="btn btn-primary" (click)="saveSettings()">Save Settings</button>
      </div>

      <!-- Success Toast -->
      @if (showSuccess()) {
        <div class="toast success">
          <span class="material-icons">check_circle</span>
          Settings saved successfully!
        </div>
      }
    </div>
  `,
  styles: [`
    .settings-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 800px;
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

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-secondary);
      }

      input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 8px;

        &:focus {
          outline: none;
          border-color: var(--primary-color);
        }
      }
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: var(--shadow-md);
      animation: slideIn 0.3s ease;

      &.success {
        background: #d1fae5;
        color: #047857;
      }
    }

    @keyframes slideIn {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `]
})
export class AdminSettingsComponent {
  showSuccess = signal(false);

  settings = {
    companyName: 'StaffWise Inc.',
    workStartTime: '09:00',
    workEndTime: '18:00',
    lateThreshold: 15,
    annualLeave: 21,
    sickLeave: 12,
    casualLeave: 7,
    maternityLeave: 90,
    pfPercentage: 12,
    esiPercentage: 1.75,
    hraPercentage: 40
  };

  saveSettings(): void {
    // In real app, save to backend
    this.showSuccess.set(true);
    setTimeout(() => this.showSuccess.set(false), 3000);
  }

  resetSettings(): void {
    this.settings = {
      companyName: 'StaffWise Inc.',
      workStartTime: '09:00',
      workEndTime: '18:00',
      lateThreshold: 15,
      annualLeave: 21,
      sickLeave: 12,
      casualLeave: 7,
      maternityLeave: 90,
      pfPercentage: 12,
      esiPercentage: 1.75,
      hraPercentage: 40
    };
  }
}

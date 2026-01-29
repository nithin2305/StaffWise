import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeService } from '../../../core/services/employee.service';
import { Employee } from '../../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-page">
      <div class="profile-header">
        <div class="avatar">
          {{ getInitials() }}
        </div>
        <div class="header-info">
          <h2>{{ profile()?.fullName }}</h2>
          <p>{{ profile()?.designation }}</p>
          <span class="emp-code">{{ profile()?.empCode }}</span>
        </div>
      </div>

      <div class="profile-content">
        <div class="card">
          <div class="card-header">
            <h3>Personal Information</h3>
            <button class="btn btn-secondary" (click)="toggleEdit()">
              <span class="material-icons">{{ isEditing() ? 'close' : 'edit' }}</span>
              {{ isEditing() ? 'Cancel' : 'Edit' }}
            </button>
          </div>
          <div class="card-body">
            @if (isEditing()) {
              <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
                <div class="form-grid">
                  <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" formControlName="fullName">
                  </div>
                  <div class="form-group">
                    <label>Email</label>
                    <input type="email" formControlName="email" readonly>
                  </div>
                  <div class="form-group">
                    <label>Phone</label>
                    <input type="tel" formControlName="phone">
                  </div>
                  <div class="form-group">
                    <label>Address</label>
                    <textarea formControlName="address" rows="2"></textarea>
                  </div>
                  <div class="form-group">
                    <label>Emergency Contact Name</label>
                    <input type="text" formControlName="emergencyContactName">
                  </div>
                  <div class="form-group">
                    <label>Emergency Contact Phone</label>
                    <input type="tel" formControlName="emergencyContactPhone">
                  </div>
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
                  <button type="submit" class="btn btn-primary" [disabled]="profileForm.invalid || isLoading()">
                    @if (isLoading()) {
                      <span class="spinner"></span>
                    }
                    Save Changes
                  </button>
                </div>
              </form>
            } @else {
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Full Name</span>
                  <span class="value">{{ profile()?.fullName }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Email</span>
                  <span class="value">{{ profile()?.email }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Phone</span>
                  <span class="value">{{ profile()?.phone || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Date of Birth</span>
                  <span class="value">{{ profile()?.dateOfBirth | date:'mediumDate' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Gender</span>
                  <span class="value">{{ profile()?.gender | titlecase }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Address</span>
                  <span class="value">{{ profile()?.address || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Emergency Contact</span>
                  <span class="value">{{ profile()?.emergencyContactName || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Emergency Phone</span>
                  <span class="value">{{ profile()?.emergencyContactPhone || '-' }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Employment Information</h3>
          </div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Employee Code</span>
                <span class="value">{{ profile()?.empCode }}</span>
              </div>
              <div class="info-item">
                <span class="label">Department</span>
                <span class="value">{{ profile()?.departmentName }}</span>
              </div>
              <div class="info-item">
                <span class="label">Designation</span>
                <span class="value">{{ profile()?.designation }}</span>
              </div>
              <div class="info-item">
                <span class="label">Role</span>
                <span class="value">
                  <span class="role-badge">{{ profile()?.role | titlecase }}</span>
                </span>
              </div>
              <div class="info-item">
                <span class="label">Date of Joining</span>
                <span class="value">{{ profile()?.dateOfJoining | date:'mediumDate' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Employment Type</span>
                <span class="value">{{ profile()?.employmentType | titlecase }}</span>
              </div>
              <div class="info-item">
                <span class="label">Reporting Manager</span>
                <span class="value">{{ profile()?.reportingManagerName || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Status</span>
                <span class="value">
                  <span class="status-badge" [class]="profile()?.active ? 'active' : 'inactive'">
                    {{ profile()?.active ? 'Active' : 'Inactive' }}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Bank & Tax Information</h3>
          </div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Bank Name</span>
                <span class="value">{{ profile()?.bankName || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Account Number</span>
                <span class="value">{{ maskAccountNumber(profile()?.bankAccountNumber) }}</span>
              </div>
              <div class="info-item">
                <span class="label">IFSC Code</span>
                <span class="value">{{ profile()?.ifscCode || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">PAN Number</span>
                <span class="value">{{ profile()?.panNumber || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Aadhar Number</span>
                <span class="value">{{ maskAadhar(profile()?.aadharNumber) }}</span>
              </div>
              <div class="info-item">
                <span class="label">PF Number</span>
                <span class="value">{{ profile()?.pfNumber || '-' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 2rem;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
      border-radius: 12px;
      color: white;
    }

    .avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 600;
    }

    .header-info {
      h2 {
        margin: 0;
        font-size: 1.75rem;
      }

      p {
        margin: 0.25rem 0;
        opacity: 0.9;
      }

      .emp-code {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        font-size: 0.875rem;
      }
    }

    .profile-content {
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

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
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
        font-weight: 500;
        color: var(--text-primary);
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
      }

      input, textarea {
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        font-size: 0.9375rem;

        &:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        &[readonly] {
          background: var(--bg-secondary);
        }
      }
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;

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
      margin-top: 1.5rem;
      display: flex;
      justify-content: flex-end;
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

    .role-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: #e0e7ff;
      color: #4338ca;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;

      &.active { background: #d1fae5; color: #047857; }
      &.inactive { background: #fee2e2; color: #b91c1c; }
    }

    @media (max-width: 768px) {
      .info-grid,
      .form-grid {
        grid-template-columns: 1fr;
      }

      .profile-header {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);

  profile = signal<Employee | null>(null);
  isEditing = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  profileForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadProfile();
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      emergencyContactName: [''],
      emergencyContactPhone: ['']
    });
  }

  loadProfile(): void {
    this.employeeService.getMyProfile().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.profile.set(res.data);
          this.profileForm.patchValue({
            fullName: res.data.fullName,
            email: res.data.email,
            phone: res.data.phone,
            address: res.data.address,
            emergencyContactName: res.data.emergencyContactName,
            emergencyContactPhone: res.data.emergencyContactPhone
          });
        }
      }
    });
  }

  toggleEdit(): void {
    this.isEditing.update(v => !v);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.employeeService.updateMyProfile(this.profileForm.value).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.profile.set(res.data || null);
          this.successMessage.set('Profile updated successfully');
          this.isEditing.set(false);
        } else {
          this.errorMessage.set(res.message || 'Failed to update profile');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to update profile');
      }
    });
  }

  getInitials(): string {
    const name = this.profile()?.fullName || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  maskAccountNumber(account?: string): string {
    if (!account) return '-';
    return '****' + account.slice(-4);
  }

  maskAadhar(aadhar?: string): string {
    if (!aadhar) return '-';
    return '****-****-' + aadhar.slice(-4);
  }
}

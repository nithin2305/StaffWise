import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HrService } from '../../../core/services/hr.service';
import { Employee } from '../../../core/models';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="employees-page">
      <!-- Header Actions -->
      <div class="page-header">
        <div class="search-box">
          <span class="material-icons">search</span>
          <input type="text" placeholder="Search employees..." (input)="onSearch($event)">
        </div>
        <button class="btn btn-primary" (click)="openModal()">
          <span class="material-icons">person_add</span>
          Add Employee
        </button>
      </div>

      <!-- Employees Table -->
      <div class="card">
        <div class="card-body">
          @if (filteredEmployees().length > 0) {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Role</th>
                  <th>Join Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (emp of filteredEmployees(); track emp.id) {
                  <tr>
                    <td>
                      <div class="employee-cell">
                        <div class="avatar">{{ getInitials(emp.fullName) }}</div>
                        <div class="details">
                          <span class="name">{{ emp.fullName }}</span>
                          <span class="code">{{ emp.empCode }}</span>
                        </div>
                      </div>
                    </td>
                    <td>{{ emp.email }}</td>
                    <td>{{ emp.departmentName }}</td>
                    <td>{{ emp.designation }}</td>
                    <td>
                      <span class="role-badge">{{ emp.role | titlecase }}</span>
                    </td>
                    <td>{{ emp.dateOfJoining | date:'mediumDate' }}</td>
                    <td>
                      <span class="status-badge" [class]="emp.active ? 'active' : 'inactive'">
                        {{ emp.active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>
                      <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" (click)="editEmployee(emp)" title="Edit">
                          <span class="material-icons">edit</span>
                        </button>
                        <button class="btn btn-sm btn-danger" (click)="deactivateEmployee(emp.id!)" 
                          [disabled]="!emp.active" title="Deactivate">
                          <span class="material-icons">person_off</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <div class="empty-state">
              <span class="material-icons">people</span>
              <p>No employees found</p>
            </div>
          }
        </div>
      </div>

      <!-- Add/Edit Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ isEditing() ? 'Edit Employee' : 'Add New Employee' }}</h3>
              <button class="close-btn" (click)="closeModal()">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body">
              <form [formGroup]="employeeForm" (ngSubmit)="saveEmployee()">
                <div class="form-grid">
                  <div class="form-group">
                    <label>Full Name *</label>
                    <input type="text" formControlName="fullName">
                  </div>
                  <div class="form-group">
                    <label>Email *</label>
                    <input type="email" formControlName="email" [readonly]="isEditing()">
                  </div>
                  <div class="form-group">
                    <label>Employee Code *</label>
                    <input type="text" formControlName="empCode" [readonly]="isEditing()">
                  </div>
                  @if (!isEditing()) {
                    <div class="form-group">
                      <label>Password *</label>
                      <input type="password" formControlName="password">
                    </div>
                  }
                  <div class="form-group">
                    <label>Phone</label>
                    <input type="tel" formControlName="phone">
                  </div>
                  <div class="form-group">
                    <label>Date of Birth</label>
                    <input type="date" formControlName="dateOfBirth">
                  </div>
                  <div class="form-group">
                    <label>Gender</label>
                    <select formControlName="gender">
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Department *</label>
                    <select formControlName="departmentId">
                      <option value="">Select Department</option>
                      <option value="1">Engineering</option>
                      <option value="2">Human Resources</option>
                      <option value="3">Finance</option>
                      <option value="4">Marketing</option>
                      <option value="5">Operations</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Designation *</label>
                    <input type="text" formControlName="designation">
                  </div>
                  <div class="form-group">
                    <label>Role *</label>
                    <select formControlName="role">
                      <option value="">Select Role</option>
                      <option value="EMPLOYEE">Employee</option>
                      <option value="HR">HR</option>
                      <option value="PAYROLL_CHECKER">Payroll Checker</option>
                      <option value="PAYROLL_ADMIN">Payroll Admin</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Date of Joining *</label>
                    <input type="date" formControlName="dateOfJoining">
                  </div>
                  <div class="form-group">
                    <label>Basic Salary *</label>
                    <input type="number" formControlName="basicSalary">
                  </div>
                  <div class="form-group">
                    <label>Bank Name</label>
                    <input type="text" formControlName="bankName">
                  </div>
                  <div class="form-group">
                    <label>Bank Account Number</label>
                    <input type="text" formControlName="bankAccountNumber">
                  </div>
                  <div class="form-group">
                    <label>IFSC Code</label>
                    <input type="text" formControlName="ifscCode">
                  </div>
                  <div class="form-group">
                    <label>PAN Number</label>
                    <input type="text" formControlName="panNumber">
                  </div>
                </div>

                @if (errorMessage()) {
                  <div class="alert alert-error">
                    <span class="material-icons">error</span>
                    {{ errorMessage() }}
                  </div>
                }

                <div class="form-actions">
                  <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
                  <button type="submit" class="btn btn-primary" [disabled]="employeeForm.invalid || isLoading()">
                    @if (isLoading()) {
                      <span class="spinner"></span>
                    }
                    {{ isEditing() ? 'Update' : 'Create' }} Employee
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .employees-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      width: 300px;

      .material-icons { color: var(--text-secondary); }

      input {
        flex: 1;
        border: none;
        outline: none;
        font-size: 0.9375rem;
      }
    }

    .card {
      background: white;
      border-radius: 12px;
      box-shadow: var(--shadow-sm);
      overflow: hidden;
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
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--primary-color);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        font-weight: 600;
      }

      .details {
        display: flex;
        flex-direction: column;

        .name { font-weight: 500; }
        .code { font-size: 0.75rem; color: var(--text-secondary); }
      }
    }

    .role-badge {
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
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 { margin: 0; }

      .close-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-secondary);
      }
    }

    .modal-body { padding: 1.5rem; }

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

      input, select {
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        font-size: 0.9375rem;

        &:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        &[readonly] { background: var(--bg-secondary); }
      }
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;

      &.alert-error { background: #fef2f2; color: var(--error-color); }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
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

    @keyframes spin { to { transform: rotate(360deg); } }

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
export class EmployeesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private hrService = inject(HrService);

  employees = signal<Employee[]>([]);
  filteredEmployees = signal<Employee[]>([]);
  showModal = signal(false);
  isEditing = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  editingId = signal<number | null>(null);

  employeeForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadEmployees();
  }

  initForm(): void {
    this.employeeForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      empCode: ['', Validators.required],
      password: [''],
      phone: [''],
      dateOfBirth: [''],
      gender: [''],
      departmentId: ['', Validators.required],
      designation: ['', Validators.required],
      role: ['', Validators.required],
      dateOfJoining: ['', Validators.required],
      basicSalary: ['', [Validators.required, Validators.min(0)]],
      bankName: [''],
      bankAccountNumber: [''],
      ifscCode: [''],
      panNumber: ['']
    });
  }

  loadEmployees(): void {
    this.hrService.getAllEmployees().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.employees.set(res.data);
          this.filteredEmployees.set(res.data);
        }
      }
    });
  }

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    const filtered = this.employees().filter(emp =>
      emp.fullName.toLowerCase().includes(term) ||
      emp.empCode.toLowerCase().includes(term) ||
      emp.email.toLowerCase().includes(term)
    );
    this.filteredEmployees.set(filtered);
  }

  openModal(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.employeeForm.reset();
    this.employeeForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.employeeForm.get('password')?.updateValueAndValidity();
    this.showModal.set(true);
  }

  editEmployee(emp: Employee): void {
    this.isEditing.set(true);
    this.editingId.set(emp.id!);
    this.employeeForm.get('password')?.clearValidators();
    this.employeeForm.get('password')?.updateValueAndValidity();
    this.employeeForm.patchValue({
      fullName: emp.fullName,
      email: emp.email,
      empCode: emp.empCode,
      phone: emp.phone,
      dateOfBirth: emp.dateOfBirth,
      gender: emp.gender,
      departmentId: emp.departmentId,
      designation: emp.designation,
      role: emp.role,
      dateOfJoining: emp.dateOfJoining,
      basicSalary: emp.basicSalary,
      bankName: emp.bankName,
      bankAccountNumber: emp.bankAccountNumber,
      ifscCode: emp.ifscCode,
      panNumber: emp.panNumber
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.errorMessage.set('');
  }

  saveEmployee(): void {
    if (this.employeeForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const formData = this.employeeForm.value;

    const observable = this.isEditing()
      ? this.hrService.updateEmployee(this.editingId()!, formData)
      : this.hrService.createEmployee(formData);

    observable.subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.closeModal();
          this.loadEmployees();
        } else {
          this.errorMessage.set(res.message || 'Operation failed');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Operation failed');
      }
    });
  }

  deactivateEmployee(id: number): void {
    if (confirm('Are you sure you want to deactivate this employee?')) {
      this.hrService.deactivateEmployee(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadEmployees();
          }
        }
      });
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }
}

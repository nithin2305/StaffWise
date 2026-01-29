import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { Employee, Role } from '../../../core/models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-page">
      <!-- Filters -->
      <div class="card filters">
        <div class="filter-row">
          <div class="search-box">
            <span class="material-icons">search</span>
            <input type="text" placeholder="Search users..." [(ngModel)]="searchTerm" (input)="filterUsers()">
          </div>
          <div class="filter-group">
            <select [(ngModel)]="roleFilter" (change)="filterUsers()">
              <option value="">All Roles</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="HR">HR</option>
              <option value="PAYROLL_CHECKER">Payroll Checker</option>
              <option value="PAYROLL_ADMIN">Payroll Admin</option>
              <option value="SYSTEM_ADMIN">System Admin</option>
            </select>
          </div>
          <div class="filter-group">
            <select [(ngModel)]="statusFilter" (change)="filterUsers()">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button class="btn btn-primary" (click)="openAddModal()">
            <span class="material-icons">person_add</span>
            Add User
          </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="card">
        <div class="card-body">
          @if (filteredUsers().length > 0) {
            <table class="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Employee Code</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (user of filteredUsers(); track user.id) {
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="avatar">{{ getInitials(user.fullName) }}</div>
                        <div class="details">
                          <span class="name">{{ user.fullName }}</span>
                          <span class="email">{{ user.email }}</span>
                        </div>
                      </div>
                    </td>
                    <td>{{ user.empCode }}</td>
                    <td>{{ user.department }}</td>
                    <td>
                      <span class="role-badge" [class]="(user.role || '').toLowerCase().replace('_', '-')">
                        {{ formatRole(user.role!) }}
                      </span>
                    </td>
                    <td>
                      <span class="status-badge" [class.active]="user.isActive" [class.inactive]="!user.isActive">
                        {{ user.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>{{ user.lastLogin | date:'medium' }}</td>
                    <td>
                      <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" (click)="editUser(user)" title="Edit">
                          <span class="material-icons">edit</span>
                        </button>
                        <button class="btn btn-sm btn-secondary" (click)="changeRole(user)" title="Change Role">
                          <span class="material-icons">admin_panel_settings</span>
                        </button>
                        <button class="btn btn-sm" [class.btn-danger]="user.isActive" [class.btn-success]="!user.isActive" 
                                (click)="toggleStatus(user)" [title]="user.isActive ? 'Deactivate' : 'Activate'">
                          <span class="material-icons">{{ user.isActive ? 'person_off' : 'person' }}</span>
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
              <p>No users found</p>
            </div>
          }
        </div>
      </div>

      <!-- Add/Edit Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ isEditing() ? 'Edit User' : 'Add New User' }}</h3>
              <button class="close-btn" (click)="closeModal()">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group">
                  <label>First Name *</label>
                  <input type="text" [(ngModel)]="formData.firstName">
                </div>
                <div class="form-group">
                  <label>Last Name *</label>
                  <input type="text" [(ngModel)]="formData.lastName">
                </div>
              </div>
              <div class="form-group">
                <label>Email *</label>
                <input type="email" [(ngModel)]="formData.email" [disabled]="isEditing()">
              </div>
              @if (!isEditing()) {
                <div class="form-group">
                  <label>Password *</label>
                  <input type="password" [(ngModel)]="formData.password">
                </div>
              }
              <div class="form-row">
                <div class="form-group">
                  <label>Department *</label>
                  <select [(ngModel)]="formData.department">
                    <option value="">Select Department</option>
                    <option value="IT">IT</option>
                    <option value="HR">Human Resources</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Designation *</label>
                  <input type="text" [(ngModel)]="formData.designation">
                </div>
              </div>
              <div class="form-group">
                <label>Role *</label>
                <select [(ngModel)]="formData.role">
                  <option value="EMPLOYEE">Employee</option>
                  <option value="HR">HR</option>
                  <option value="PAYROLL_CHECKER">Payroll Checker</option>
                  <option value="PAYROLL_ADMIN">Payroll Admin</option>
                  <option value="SYSTEM_ADMIN">System Admin</option>
                </select>
              </div>
              <div class="form-actions">
                <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
                <button class="btn btn-primary" (click)="saveUser()">
                  {{ isEditing() ? 'Update' : 'Create' }} User
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Change Role Modal -->
      @if (showRoleModal()) {
        <div class="modal-overlay" (click)="closeRoleModal()">
          <div class="modal small" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Change User Role</h3>
              <button class="close-btn" (click)="closeRoleModal()">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body">
              <p>Change role for <strong>{{ selectedUser()?.fullName }}</strong></p>
              <div class="form-group">
                <label>New Role</label>
                <select [(ngModel)]="newRole">
                  <option value="EMPLOYEE">Employee</option>
                  <option value="HR">HR</option>
                  <option value="PAYROLL_CHECKER">Payroll Checker</option>
                  <option value="PAYROLL_ADMIN">Payroll Admin</option>
                  <option value="SYSTEM_ADMIN">System Admin</option>
                </select>
              </div>
              <div class="form-actions">
                <button class="btn btn-secondary" (click)="closeRoleModal()">Cancel</button>
                <button class="btn btn-primary" (click)="confirmRoleChange()">Update Role</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .users-page {
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
      max-width: 300px;

      input {
        border: none;
        background: transparent;
        flex: 1;
        outline: none;
      }

      .material-icons { color: var(--text-secondary); }
    }

    .filter-group {
      select {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        min-width: 150px;
      }
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

    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #7c3aed;
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
        .email { font-size: 0.75rem; color: var(--text-secondary); }
      }
    }

    .role-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;

      &.employee { background: #e0e7ff; color: #4f46e5; }
      &.hr { background: #dbeafe; color: #1d4ed8; }
      &.payroll-checker { background: #d1fae5; color: #047857; }
      &.payroll-admin { background: #fef3c7; color: #b45309; }
      &.system-admin { background: #ede9fe; color: #7c3aed; }
    }

    .status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;

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
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;

      &.small { max-width: 400px; }
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
      }

      input, select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 8px;

        &:disabled { background: var(--bg-secondary); }
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
  `]
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);

  users = signal<Employee[]>([]);
  filteredUsers = signal<Employee[]>([]);
  showModal = signal(false);
  isEditing = signal(false);
  selectedUser = signal<Employee | null>(null);
  showRoleModal = signal(false);
  newRole = '';

  searchTerm = '';
  roleFilter = '';
  statusFilter = '';

  formData: { firstName: string; lastName: string; email: string; password: string; department: string; designation: string; role: Role } = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: '',
    designation: '',
    role: 'EMPLOYEE'
  };

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.adminService.getAllUsers().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.users.set(res.data);
          this.filterUsers();
        }
      }
    });
  }

  filterUsers(): void {
    let result = this.users();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(u =>
        u.fullName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.empCode?.toLowerCase().includes(term)
      );
    }

    if (this.roleFilter) {
      result = result.filter(u => u.role === this.roleFilter);
    }

    if (this.statusFilter) {
      const isActive = this.statusFilter === 'active';
      result = result.filter(u => u.isActive === isActive);
    }

    this.filteredUsers.set(result);
  }

  openAddModal(): void {
    this.isEditing.set(false);
    this.formData = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      department: '',
      designation: '',
      role: 'EMPLOYEE'
    };
    this.showModal.set(true);
  }

  editUser(user: Employee): void {
    this.isEditing.set(true);
    this.selectedUser.set(user);
    const nameParts = user.fullName?.split(' ') || ['', ''];
    this.formData = {
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' '),
      email: user.email || '',
      password: '',
      department: user.department || '',
      designation: user.designation || '',
      role: user.role || 'EMPLOYEE'
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedUser.set(null);
  }

  saveUser(): void {
    if (this.isEditing()) {
      const user = this.selectedUser();
      if (!user) return;
      this.adminService.updateUser(user.id!, this.formData).subscribe({
        next: (res) => {
          if (res.success) {
            this.closeModal();
            this.loadUsers();
          }
        }
      });
    } else {
      this.adminService.createUser(this.formData).subscribe({
        next: (res) => {
          if (res.success) {
            this.closeModal();
            this.loadUsers();
          }
        }
      });
    }
  }

  changeRole(user: Employee): void {
    this.selectedUser.set(user);
    this.newRole = user.role || 'EMPLOYEE';
    this.showRoleModal.set(true);
  }

  closeRoleModal(): void {
    this.showRoleModal.set(false);
    this.selectedUser.set(null);
  }

  confirmRoleChange(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.adminService.updateUserRole(user.id!, this.newRole).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeRoleModal();
          this.loadUsers();
        }
      }
    });
  }

  toggleStatus(user: Employee): void {
    this.adminService.toggleUserStatus(user.id!).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadUsers();
        }
      }
    });
  }

  getInitials(name: string): string {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '';
  }

  formatRole(role: string): string {
    return role?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || '';
  }
}

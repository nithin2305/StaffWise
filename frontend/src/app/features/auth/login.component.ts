import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="logo">
            <span class="material-icons">business</span>
            <h1>StaffWise</h1>
          </div>
          <p class="subtitle">Role-Based HRMS Platform</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email Address</label>
            <div class="input-group">
              <span class="material-icons">email</span>
              <input
                type="email"
                id="email"
                formControlName="email"
                placeholder="Enter your email"
                [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
              />
            </div>
            @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
              <span class="error-message">Please enter a valid email address</span>
            }
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-group">
              <span class="material-icons">lock</span>
              <input
                [type]="showPassword ? 'text' : 'password'"
                id="password"
                formControlName="password"
                placeholder="Enter your password"
                [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
              />
              <button type="button" class="toggle-password" (click)="showPassword = !showPassword">
                <span class="material-icons">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
            @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
              <span class="error-message">Password is required</span>
            }
          </div>

          @if (errorMessage) {
            <div class="alert alert-error">
              <span class="material-icons">error</span>
              {{ errorMessage }}
            </div>
          }

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loginForm.invalid || isLoading">
            @if (isLoading) {
              <span class="spinner"></span>
              Signing in...
            } @else {
              <span class="material-icons">login</span>
              Sign In
            }
          </button>
        </form>

        <div class="demo-accounts">
          <p class="demo-title">Demo Accounts</p>
          <div class="accounts-grid">
            <button class="demo-btn" (click)="fillDemo('admin@staffwise.com', 'Admin@123')">
              <span class="role-badge admin">Admin</span>
            </button>
            <button class="demo-btn" (click)="fillDemo('hr@staffwise.com', 'Hr@123456')">
              <span class="role-badge hr">HR</span>
            </button>
            <button class="demo-btn" (click)="fillDemo('checker@staffwise.com', 'Checker@123')">
              <span class="role-badge checker">Checker</span>
            </button>
            <button class="demo-btn" (click)="fillDemo('payrolladmin@staffwise.com', 'PayrollAdmin@123')">
              <span class="role-badge payroll">Payroll</span>
            </button>
            <button class="demo-btn" (click)="fillDemo('john.doe@staffwise.com', 'Employee@123')">
              <span class="role-badge employee">Employee</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
      padding: 1rem;
    }

    .login-card {
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: var(--primary-color);

      .material-icons {
        font-size: 2.5rem;
      }

      h1 {
        font-size: 2rem;
        margin: 0;
        font-weight: 700;
      }
    }

    .subtitle {
      color: var(--text-secondary);
      margin-top: 0.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-primary);
      }
    }

    .input-group {
      display: flex;
      align-items: center;
      border: 2px solid var(--border-color);
      border-radius: 8px;
      padding: 0 1rem;
      transition: all 0.3s ease;

      &:focus-within {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      .material-icons {
        color: var(--text-secondary);
        font-size: 1.25rem;
      }

      input {
        flex: 1;
        border: none;
        padding: 0.875rem 0.75rem;
        font-size: 1rem;
        outline: none;
        background: transparent;

        &::placeholder {
          color: var(--text-light);
        }

        &.error {
          border-color: var(--error-color);
        }
      }

      .toggle-password {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        display: flex;

        .material-icons {
          color: var(--text-secondary);
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
        border: 1px solid #fecaca;
      }

      .material-icons {
        font-size: 1.25rem;
      }
    }

    .btn-block {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      font-size: 1rem;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .demo-accounts {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);

      .demo-title {
        text-align: center;
        color: var(--text-secondary);
        font-size: 0.875rem;
        margin-bottom: 1rem;
      }
    }

    .accounts-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
    }

    .demo-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
    }

    .role-badge {
      display: inline-block;
      padding: 0.375rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: transform 0.2s ease;

      &:hover {
        transform: scale(1.05);
      }

      &.admin { background: #ddd6fe; color: #6d28d9; }
      &.hr { background: #dbeafe; color: #1d4ed8; }
      &.checker { background: #fef3c7; color: #b45309; }
      &.payroll { background: #d1fae5; color: #047857; }
      &.employee { background: #e0e7ff; color: #4338ca; }
    }
  `]
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  fillDemo(email: string, password: string): void {
    this.loginForm.patchValue({ email, password });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'];
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl);
          } else {
            this.navigateToDashboard();
          }
        } else {
          this.errorMessage = response.message || 'Login failed';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Invalid email or password';
      }
    });
  }

  private navigateToDashboard(): void {
    const role = this.authService.userRole();
    switch (role) {
      case 'SYSTEM_ADMIN':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'HR':
        this.router.navigate(['/hr/dashboard']);
        break;
      case 'PAYROLL_CHECKER':
        this.router.navigate(['/payroll/check']);
        break;
      case 'PAYROLL_ADMIN':
        this.router.navigate(['/payroll/authorize']);
        break;
      default:
        this.router.navigate(['/employee/dashboard']);
    }
  }
}

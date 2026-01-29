import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="unauthorized-container">
      <div class="unauthorized-card">
        <div class="icon-wrapper">
          <span class="material-icons">block</span>
        </div>
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        <p class="hint">Please contact your administrator if you believe this is an error.</p>
        <button class="btn btn-primary" (click)="goToHome()">
          <span class="material-icons">home</span>
          Go to Home
        </button>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary);
      padding: 1rem;
    }

    .unauthorized-card {
      background: white;
      border-radius: 16px;
      padding: 3rem;
      text-align: center;
      max-width: 400px;
      box-shadow: var(--shadow-lg);
    }

    .icon-wrapper {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #fef2f2;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;

      .material-icons {
        font-size: 40px;
        color: var(--error-color);
      }
    }

    h1 {
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    p {
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }

    .hint {
      font-size: 0.875rem;
      margin-bottom: 2rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      border: none;
    }
  `]
})
export class UnauthorizedComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  goToHome(): void {
    const role = this.authService.userRole();
    
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

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

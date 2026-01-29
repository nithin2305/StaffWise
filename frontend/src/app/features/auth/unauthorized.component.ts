import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="unauthorized-container">
      <div class="unauthorized-card">
        <div class="icon-wrapper">
          <span class="material-icons">block</span>
        </div>
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        <p class="hint">Please contact your administrator if you believe this is an error.</p>
        <a routerLink="/" class="btn btn-primary">
          <span class="material-icons">home</span>
          Go to Home
        </a>
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
    }
  `]
})
export class UnauthorizedComponent {}

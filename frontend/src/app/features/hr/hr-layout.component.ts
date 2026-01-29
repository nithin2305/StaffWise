import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-hr-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive],
  template: `
    <div class="layout">
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <div class="logo">
            <span class="material-icons">business</span>
            @if (!sidebarCollapsed()) {
              <span class="logo-text">StaffWise</span>
            }
          </div>
          <button class="toggle-btn" (click)="toggleSidebar()">
            <span class="material-icons">{{ sidebarCollapsed() ? 'menu' : 'menu_open' }}</span>
          </button>
        </div>

        <nav class="sidebar-nav">
          <span class="nav-section">HR Management</span>
          
          <a routerLink="dashboard" routerLinkActive="active" class="nav-item">
            <span class="material-icons">dashboard</span>
            @if (!sidebarCollapsed()) { <span>Dashboard</span> }
          </a>
          <a routerLink="employees" routerLinkActive="active" class="nav-item">
            <span class="material-icons">people</span>
            @if (!sidebarCollapsed()) { <span>Employees</span> }
          </a>
          <a routerLink="attendance" routerLinkActive="active" class="nav-item">
            <span class="material-icons">access_time</span>
            @if (!sidebarCollapsed()) { <span>Attendance</span> }
          </a>
          <a routerLink="leave-approval" routerLinkActive="active" class="nav-item">
            <span class="material-icons">event_available</span>
            @if (!sidebarCollapsed()) { <span>Leave Approval</span> }
          </a>
          <a routerLink="requests" routerLinkActive="active" class="nav-item">
            <span class="material-icons">description</span>
            @if (!sidebarCollapsed()) { <span>Requests</span> }
          </a>

          <span class="nav-section">Payroll</span>
          
          <a routerLink="payroll-compute" routerLinkActive="active" class="nav-item">
            <span class="material-icons">calculate</span>
            @if (!sidebarCollapsed()) { <span>Compute Payroll</span> }
          </a>
          <a routerLink="payroll-runs" routerLinkActive="active" class="nav-item">
            <span class="material-icons">list_alt</span>
            @if (!sidebarCollapsed()) { <span>Payroll Runs</span> }
          </a>
        </nav>

        <div class="sidebar-footer">
          <button class="nav-item logout" (click)="logout()">
            <span class="material-icons">logout</span>
            @if (!sidebarCollapsed()) { <span>Logout</span> }
          </button>
        </div>
      </aside>

      <main class="main-content">
        <header class="header">
          <div class="header-left">
            <h2>{{ pageTitle() }}</h2>
          </div>
          <div class="header-right">
            <div class="user-info">
              <div class="user-avatar hr">{{ userInitials() }}</div>
              <div class="user-details">
                <span class="user-name">{{ user()?.fullName }}</span>
                <span class="user-role">HR Manager</span>
              </div>
            </div>
          </div>
        </header>

        <div class="content-wrapper">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
      background: var(--bg-secondary);
    }

    .sidebar {
      width: 260px;
      background: #0f172a;
      color: white;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      position: fixed;
      height: 100vh;
      z-index: 100;

      &.collapsed {
        width: 70px;
      }
    }

    .sidebar-header {
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .material-icons { font-size: 2rem; }
      .logo-text { font-size: 1.25rem; font-weight: 700; }
    }

    .toggle-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 8px;

      &:hover { background: rgba(255, 255, 255, 0.1); }
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-section {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: rgba(255, 255, 255, 0.4);
      padding: 1rem 1rem 0.5rem;
      margin-top: 0.5rem;

      &:first-child { margin-top: 0; }
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      border-radius: 8px;
      transition: all 0.2s;
      cursor: pointer;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      font-size: 0.9375rem;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }

      &.active {
        background: #3b82f6;
        color: white;
      }

      .material-icons { font-size: 1.25rem; }
    }

    .sidebar-footer {
      padding: 1rem 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logout {
      color: #fca5a5;

      &:hover {
        background: rgba(239, 68, 68, 0.2);
        color: #fecaca;
      }
    }

    .main-content {
      flex: 1;
      margin-left: 260px;
      transition: margin-left 0.3s ease;
    }

    .sidebar.collapsed ~ .main-content {
      margin-left: 70px;
    }

    .header {
      background: white;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 50;

      h2 { margin: 0; font-size: 1.5rem; color: var(--text-primary); }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;

      &.hr {
        background: #3b82f6;
        color: white;
      }
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name { font-weight: 600; color: var(--text-primary); }
    .user-role { font-size: 0.75rem; color: var(--text-secondary); }

    .content-wrapper { padding: 2rem; }
  `]
})
export class HrLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  sidebarCollapsed = signal(false);
  user = computed(() => this.authService.user());
  pageTitle = signal('Dashboard');

  userInitials = computed(() => {
    const name = this.user()?.fullName || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  });

  ngOnInit(): void {
    this.updatePageTitle();
    this.router.events.subscribe(() => this.updatePageTitle());
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  logout(): void {
    this.authService.logout();
  }

  private updatePageTitle(): void {
    const url = this.router.url;
    if (url.includes('dashboard')) this.pageTitle.set('HR Dashboard');
    else if (url.includes('employees')) this.pageTitle.set('Employee Management');
    else if (url.includes('attendance')) this.pageTitle.set('Attendance Management');
    else if (url.includes('leave-approval')) this.pageTitle.set('Leave Approval');
    else if (url.includes('requests')) this.pageTitle.set('Request Management');
    else if (url.includes('payroll-compute')) this.pageTitle.set('Compute Payroll');
    else if (url.includes('payroll-runs')) this.pageTitle.set('Payroll Runs');
  }
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <span class="material-icons logo-icon">admin_panel_settings</span>
          <h1>Admin</h1>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section">
            <span class="section-title">Overview</span>
            <a routerLink="/admin/dashboard" routerLinkActive="active">
              <span class="material-icons">dashboard</span>
              Dashboard
            </a>
          </div>

          <div class="nav-section">
            <span class="section-title">User Management</span>
            <a routerLink="/admin/users" routerLinkActive="active">
              <span class="material-icons">people</span>
              All Users
            </a>
            <a routerLink="/admin/roles" routerLinkActive="active">
              <span class="material-icons">security</span>
              Roles & Permissions
            </a>
          </div>

          <div class="nav-section">
            <span class="section-title">Configuration</span>
            <a routerLink="/admin/tax-config" routerLinkActive="active">
              <span class="material-icons">calculate</span>
              Tax Settings
            </a>
          </div>

          <div class="nav-section">
            <span class="section-title">System</span>
            <a routerLink="/admin/audit-logs" routerLinkActive="active">
              <span class="material-icons">history</span>
              Audit Logs
            </a>
            <a routerLink="/admin/settings" routerLinkActive="active">
              <span class="material-icons">settings</span>
              Settings
            </a>
          </div>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="avatar">{{ getInitials() }}</div>
            <div class="details">
              <span class="name">{{ currentUser()?.fullName }}</span>
              <span class="role">System Admin</span>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()">
            <span class="material-icons">logout</span>
          </button>
        </div>
      </aside>

      <main class="main-content">
        <header class="top-header">
          <button class="menu-toggle" (click)="toggleMenu()">
            <span class="material-icons">menu</span>
          </button>
          <h2>System Administration</h2>
          <div class="header-actions">
            <span class="badge admin">System Admin</span>
          </div>
        </header>

        <div class="content-area">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
      background: var(--bg-secondary);
    }

    .sidebar {
      width: 260px;
      background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
      color: white;
      display: flex;
      flex-direction: column;
      position: fixed;
      height: 100vh;
      z-index: 100;
    }

    .sidebar-header {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      .logo-icon { font-size: 2rem; }
      h1 { margin: 0; font-size: 1.5rem; font-weight: 700; }
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem 0;
      overflow-y: auto;
    }

    .nav-section {
      margin-bottom: 1.5rem;

      .section-title {
        display: block;
        padding: 0.5rem 1.5rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        opacity: 0.6;
      }

      a {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1.5rem;
        color: rgba(255, 255, 255, 0.8);
        text-decoration: none;
        transition: all 0.2s;

        .material-icons { font-size: 1.25rem; }

        &:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        &.active {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border-left: 3px solid white;
        }
      }
    }

    .sidebar-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
      }

      .details {
        display: flex;
        flex-direction: column;
        .name { font-weight: 500; font-size: 0.875rem; }
        .role { font-size: 0.75rem; opacity: 0.7; }
      }
    }

    .logout-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      padding: 0.5rem;
      border-radius: 8px;
      color: white;
      cursor: pointer;

      &:hover { background: rgba(255, 255, 255, 0.2); }
    }

    .main-content {
      flex: 1;
      margin-left: 260px;
      display: flex;
      flex-direction: column;
    }

    .top-header {
      background: white;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: var(--shadow-sm);
      position: sticky;
      top: 0;
      z-index: 50;

      .menu-toggle {
        display: none;
        background: none;
        border: none;
        cursor: pointer;
      }

      h2 { margin: 0; flex: 1; }

      .badge.admin {
        background: #ede9fe;
        color: #7c3aed;
        padding: 0.375rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
      }
    }

    .content-area {
      padding: 2rem;
      flex: 1;
    }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        &.open { transform: translateX(0); }
      }
      .main-content { margin-left: 0; }
      .menu-toggle { display: block !important; }
    }
  `]
})
export class AdminLayoutComponent {
  authService = inject(AuthService);
  currentUser = this.authService.currentUser;
  menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  logout(): void {
    this.authService.logout();
  }

  getInitials(): string {
    const name = this.currentUser()?.fullName || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }
}

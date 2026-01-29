import { Component, Input, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ToastMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible()) {
      <div class="toast" [class]="type()">
        <span class="material-icons">{{ getIcon() }}</span>
        <span class="message">{{ message() }}</span>
        <button class="close" (click)="close()">
          <span class="material-icons">close</span>
        </button>
      </div>
    }
  `,
  styles: [`
    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease;
      z-index: 9999;

      &.success { background: #d1fae5; color: #047857; }
      &.error { background: #fee2e2; color: #b91c1c; }
      &.warning { background: #fef3c7; color: #b45309; }
      &.info { background: #dbeafe; color: #1d4ed8; }

      .message { flex: 1; }

      .close {
        background: none;
        border: none;
        cursor: pointer;
        color: inherit;
        opacity: 0.7;
        &:hover { opacity: 1; }
        .material-icons { font-size: 1rem; }
      }
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  @Input() set toast(value: ToastMessage | null) {
    if (value) {
      this.type.set(value.type);
      this.message.set(value.message);
      this.visible.set(true);
      this.startTimer(value.duration || 3000);
    }
  }

  visible = signal(false);
  type = signal<'success' | 'error' | 'warning' | 'info'>('info');
  message = signal('');

  private timer: any;

  ngOnInit(): void {}

  ngOnDestroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  startTimer(duration: number): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.visible.set(false);
    }, duration);
  }

  close(): void {
    this.visible.set(false);
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  getIcon(): string {
    const icons = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info'
    };
    return icons[this.type()];
  }
}

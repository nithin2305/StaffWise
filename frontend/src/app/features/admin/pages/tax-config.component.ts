import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaxConfigService, TaxConfiguration, TaxSlab } from '../../../core/services/tax-config.service';

@Component({
  selector: 'app-tax-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tax-config-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2>Tax Configuration</h2>
          <p>Manage PNG Salary & Wages Tax (SWT) and Superannuation settings</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span class="material-icons">add</span>
          New Configuration
        </button>
      </div>

      <!-- Active Configuration Summary -->
      @if (activeConfig()) {
        <div class="card summary-card">
          <div class="card-header">
            <h3>
              <span class="material-icons">verified</span>
              Active Configuration: {{ activeConfig()!.financialYear }}
            </h3>
            <span class="status-badge active">Active</span>
          </div>
          <div class="card-body">
            <div class="summary-grid">
              <div class="summary-item">
                <span class="label">Tax-Free Threshold</span>
                <span class="value">K{{ activeConfig()!.taxFreeThreshold | number:'1.0-0' }}</span>
              </div>
              <div class="summary-item">
                <span class="label">Employee Super</span>
                <span class="value">{{ (activeConfig()!.superEmployeePercentage * 100) | number:'1.1-1' }}%</span>
              </div>
              <div class="summary-item">
                <span class="label">Employer Super</span>
                <span class="value">{{ (activeConfig()!.superEmployerPercentage * 100) | number:'1.1-1' }}%</span>
              </div>
              <div class="summary-item">
                <span class="label">Pay Periods/Year</span>
                <span class="value">{{ activeConfig()!.fortnightsPerYear }} Fortnights</span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Tax Slabs Table -->
      @if (activeConfig() && activeConfig()!.taxSlabs.length > 0) {
        <div class="card">
          <div class="card-header">
            <h3>Salary & Wages Tax (SWT) Slabs - Residents</h3>
            <button class="btn btn-secondary btn-sm" (click)="selectConfig(activeConfig()!)">
              <span class="material-icons">edit</span>
              Edit Slabs
            </button>
          </div>
          <div class="card-body">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Income From (K)</th>
                  <th>Income To (K)</th>
                  <th>Tax Rate</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                @for (slab of getResidentSlabs(activeConfig()!.taxSlabs); track slab.id) {
                  <tr>
                    <td>{{ slab.incomeFrom | number:'1.0-0' }}</td>
                    <td>{{ slab.incomeTo ? (slab.incomeTo | number:'1.0-0') : 'Unlimited' }}</td>
                    <td><span class="rate-badge">{{ (slab.taxRate * 100) | number:'1.0-0' }}%</span></td>
                    <td>{{ slab.description }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Non-Resident Slabs -->
        @if (getNonResidentSlabs(activeConfig()!.taxSlabs).length > 0) {
          <div class="card">
            <div class="card-header">
              <h3>Non-Resident Tax Rate</h3>
            </div>
            <div class="card-body">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Income From (K)</th>
                    <th>Income To (K)</th>
                    <th>Tax Rate</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  @for (slab of getNonResidentSlabs(activeConfig()!.taxSlabs); track slab.id) {
                    <tr>
                      <td>{{ slab.incomeFrom | number:'1.0-0' }}</td>
                      <td>{{ slab.incomeTo ? (slab.incomeTo | number:'1.0-0') : 'All Income' }}</td>
                      <td><span class="rate-badge">{{ (slab.taxRate * 100) | number:'1.0-0' }}%</span></td>
                      <td>{{ slab.description }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }

      <!-- All Configurations List -->
      <div class="card">
        <div class="card-header">
          <h3>All Tax Configurations</h3>
        </div>
        <div class="card-body">
          @if (configurations().length > 0) {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Financial Year</th>
                  <th>Period</th>
                  <th>Tax-Free Threshold</th>
                  <th>Super (Emp/Employer)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (config of configurations(); track config.id) {
                  <tr [class.active-row]="config.isActive">
                    <td><strong>{{ config.financialYear }}</strong></td>
                    <td>{{ config.startDate | date:'mediumDate' }} - {{ config.endDate | date:'mediumDate' }}</td>
                    <td>K{{ config.taxFreeThreshold | number:'1.0-0' }}</td>
                    <td>{{ (config.superEmployeePercentage * 100) }}% / {{ (config.superEmployerPercentage * 100) }}%</td>
                    <td>
                      <span class="status-badge" [class.active]="config.isActive" [class.inactive]="!config.isActive">
                        {{ config.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>
                      <div class="action-buttons">
                        <button class="btn-icon" (click)="selectConfig(config)" title="Edit">
                          <span class="material-icons">edit</span>
                        </button>
                        <button class="btn-icon danger" (click)="deleteConfig(config)" title="Delete" [disabled]="config.isActive">
                          <span class="material-icons">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <div class="empty-state">
              <span class="material-icons">settings</span>
              <p>No tax configurations found. Create one to get started.</p>
              <button class="btn btn-primary" (click)="openCreateModal()">Create Configuration</button>
            </div>
          }
        </div>
      </div>

      <!-- Edit/Create Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingConfig() ? 'Edit' : 'Create' }} Tax Configuration</h3>
              <button class="close-btn" (click)="closeModal()">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-section">
                <h4>General Settings</h4>
                <div class="form-grid">
                  <div class="form-group">
                    <label>Financial Year *</label>
                    <input type="text" [(ngModel)]="formData.financialYear" placeholder="e.g., 2025">
                  </div>
                  <div class="form-group">
                    <label>Start Date *</label>
                    <input type="date" [(ngModel)]="formData.startDate">
                  </div>
                  <div class="form-group">
                    <label>End Date *</label>
                    <input type="date" [(ngModel)]="formData.endDate">
                  </div>
                  <div class="form-group">
                    <label>Currency Code</label>
                    <input type="text" [(ngModel)]="formData.currencyCode" placeholder="PGK">
                  </div>
                </div>
              </div>

              <div class="form-section">
                <h4>Tax Settings</h4>
                <div class="form-grid">
                  <div class="form-group">
                    <label>Tax-Free Threshold (K) *</label>
                    <input type="number" [(ngModel)]="formData.taxFreeThreshold" placeholder="12500">
                  </div>
                  <div class="form-group">
                    <label>Fortnights Per Year</label>
                    <input type="number" [(ngModel)]="formData.fortnightsPerYear" placeholder="26">
                  </div>
                  <div class="form-group checkbox-group">
                    <label>
                      <input type="checkbox" [(ngModel)]="formData.defaultResidentStatus">
                      Default to Resident Status
                    </label>
                  </div>
                  <div class="form-group checkbox-group">
                    <label>
                      <input type="checkbox" [(ngModel)]="formData.isActive">
                      Active Configuration
                    </label>
                  </div>
                </div>
              </div>

              <div class="form-section">
                <h4>Superannuation Rates</h4>
                <div class="form-grid">
                  <div class="form-group">
                    <label>Employee Contribution (%)</label>
                    <input type="number" [(ngModel)]="formData.superEmployeePercentage" step="0.1" placeholder="6">
                    <small>Enter as percentage (e.g., 6 for 6%)</small>
                  </div>
                  <div class="form-group">
                    <label>Employer Contribution (%)</label>
                    <input type="number" [(ngModel)]="formData.superEmployerPercentage" step="0.1" placeholder="8.4">
                    <small>Enter as percentage (e.g., 8.4 for 8.4%)</small>
                  </div>
                </div>
              </div>

              <!-- Tax Slabs Section -->
              @if (editingConfig()) {
                <div class="form-section">
                  <div class="section-header">
                    <h4>Tax Slabs (Resident)</h4>
                    <div class="section-actions">
                      <button class="btn btn-secondary btn-sm" (click)="initializeDefaultSlabs()">
                        <span class="material-icons">refresh</span>
                        Reset to PNG Defaults
                      </button>
                      <button class="btn btn-primary btn-sm" (click)="addSlab(true)">
                        <span class="material-icons">add</span>
                        Add Slab
                      </button>
                    </div>
                  </div>
                  
                  <table class="data-table compact">
                    <thead>
                      <tr>
                        <th>From (K)</th>
                        <th>To (K)</th>
                        <th>Rate (%)</th>
                        <th>Description</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (slab of getResidentSlabs(editingSlabs()); track slab.slabOrder; let i = $index) {
                        <tr>
                          <td><input type="number" [(ngModel)]="slab.incomeFrom" class="input-sm"></td>
                          <td><input type="number" [(ngModel)]="slab.incomeTo" class="input-sm" placeholder="Unlimited"></td>
                          <td><input type="number" [(ngModel)]="slab.taxRate" step="0.01" class="input-sm"></td>
                          <td><input type="text" [(ngModel)]="slab.description" class="input-sm"></td>
                          <td>
                            <button class="btn-icon danger" (click)="removeSlab(slab)">
                              <span class="material-icons">delete</span>
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>

                  <h4 class="mt-1">Non-Resident Tax Rate</h4>
                  <table class="data-table compact">
                    <thead>
                      <tr>
                        <th>From (K)</th>
                        <th>To (K)</th>
                        <th>Rate (%)</th>
                        <th>Description</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (slab of getNonResidentSlabs(editingSlabs()); track slab.slabOrder) {
                        <tr>
                          <td><input type="number" [(ngModel)]="slab.incomeFrom" class="input-sm"></td>
                          <td><input type="number" [(ngModel)]="slab.incomeTo" class="input-sm" placeholder="All"></td>
                          <td><input type="number" [(ngModel)]="slab.taxRate" step="0.01" class="input-sm"></td>
                          <td><input type="text" [(ngModel)]="slab.description" class="input-sm"></td>
                          <td>
                            <button class="btn-icon danger" (click)="removeSlab(slab)">
                              <span class="material-icons">delete</span>
                            </button>
                          </td>
                        </tr>
                      }
                      @if (getNonResidentSlabs(editingSlabs()).length === 0) {
                        <tr>
                          <td colspan="5" class="text-center">
                            <button class="btn btn-secondary btn-sm" (click)="addSlab(false)">
                              Add Non-Resident Rate
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

              <div class="form-group">
                <label>Description</label>
                <textarea [(ngModel)]="formData.description" rows="2" placeholder="Optional notes about this configuration"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button class="btn btn-primary" (click)="saveConfig()" [disabled]="saving()">
                {{ saving() ? 'Saving...' : (editingConfig() ? 'Save Changes' : 'Create Configuration') }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Success/Error Messages -->
      @if (message()) {
        <div class="toast" [class.success]="messageType() === 'success'" [class.error]="messageType() === 'error'">
          <span class="material-icons">{{ messageType() === 'success' ? 'check_circle' : 'error' }}</span>
          {{ message() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .tax-config-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      h2 { margin: 0; }
      p { margin: 0.25rem 0 0; color: var(--text-secondary); font-size: 0.875rem; }
    }

    .card {
      background: white;
      border-radius: 12px;
      box-shadow: var(--shadow-sm);
    }

    .summary-card {
      border-left: 4px solid #10b981;
    }

    .card-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      h3 {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        .material-icons { color: #10b981; }
      }
    }

    .card-body { padding: 1.5rem; }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1.5rem;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      .label { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; }
      .value { font-size: 1.5rem; font-weight: 600; color: var(--text-primary); }
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      &.active { background: #d1fae5; color: #047857; }
      &.inactive { background: #f3f4f6; color: #6b7280; }
    }

    .rate-badge {
      background: #dbeafe;
      color: #1d4ed8;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        padding: 0.75rem 1rem;
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

      &.compact {
        th, td { padding: 0.5rem; }
      }

      .active-row { background: #f0fdf4; }
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      background: none;
      border: none;
      padding: 0.25rem;
      cursor: pointer;
      border-radius: 4px;
      color: var(--text-secondary);
      &:hover { background: var(--bg-secondary); color: var(--primary-color); }
      &.danger:hover { color: var(--error-color); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
      .material-icons { font-size: 3rem; margin-bottom: 1rem; }
    }

    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
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
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      h3 { margin: 0; }
      .close-btn { background: none; border: none; cursor: pointer; padding: 0.25rem; }
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    .form-section {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);

      h4 { margin: 0 0 1rem; color: var(--text-primary); }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        h4 { margin: 0; }
      }

      .section-actions {
        display: flex;
        gap: 0.5rem;
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
      gap: 0.25rem;

      label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
      }

      input, select, textarea {
        padding: 0.625rem;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        font-size: 0.875rem;
      }

      small {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      &.checkbox-group {
        flex-direction: row;
        align-items: center;
        label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
      }
    }

    .input-sm {
      padding: 0.375rem 0.5rem !important;
      font-size: 0.8125rem !important;
      width: 100%;
    }

    .mt-1 { margin-top: 1rem; }
    .text-center { text-align: center; }

    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: white;
      animation: slideIn 0.3s ease;
      z-index: 2000;

      &.success { background: #10b981; }
      &.error { background: #ef4444; }
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }
  `]
})
export class TaxConfigComponent implements OnInit {
  private taxConfigService = inject(TaxConfigService);

  configurations = signal<TaxConfiguration[]>([]);
  activeConfig = signal<TaxConfiguration | null>(null);
  showModal = signal(false);
  editingConfig = signal<TaxConfiguration | null>(null);
  editingSlabs = signal<TaxSlab[]>([]);
  saving = signal(false);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  formData: Partial<TaxConfiguration> = this.getEmptyFormData();

  ngOnInit(): void {
    this.loadConfigurations();
  }

  loadConfigurations(): void {
    this.taxConfigService.getAllConfigurations().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.configurations.set(res.data);
          const active = res.data.find(c => c.isActive);
          if (active) {
            this.activeConfig.set(active);
          }
        }
      }
    });
  }

  getEmptyFormData(): Partial<TaxConfiguration> {
    return {
      financialYear: '',
      startDate: '',
      endDate: '',
      superEmployeePercentage: 6,
      superEmployerPercentage: 8.4,
      superMinimumSalary: 0,
      taxFreeThreshold: 12500,
      defaultResidentStatus: true,
      currencyCode: 'PGK',
      fortnightsPerYear: 26,
      isActive: false,
      description: ''
    };
  }

  openCreateModal(): void {
    this.formData = this.getEmptyFormData();
    this.editingConfig.set(null);
    this.editingSlabs.set([]);
    this.showModal.set(true);
  }

  selectConfig(config: TaxConfiguration): void {
    this.editingConfig.set(config);
    this.editingSlabs.set([...config.taxSlabs]);
    this.formData = {
      ...config,
      superEmployeePercentage: config.superEmployeePercentage * 100,
      superEmployerPercentage: config.superEmployerPercentage * 100
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingConfig.set(null);
    this.editingSlabs.set([]);
  }

  saveConfig(): void {
    this.saving.set(true);

    const configData: TaxConfiguration = {
      ...this.formData as TaxConfiguration,
      superEmployeePercentage: (this.formData.superEmployeePercentage || 6) / 100,
      superEmployerPercentage: (this.formData.superEmployerPercentage || 8.4) / 100,
      taxSlabs: this.editingSlabs()
    };

    const request = this.editingConfig()
      ? this.taxConfigService.updateConfiguration(this.editingConfig()!.id!, configData)
      : this.taxConfigService.createConfiguration(configData);

    request.subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success) {
          this.showMessage('Configuration saved successfully', 'success');
          this.closeModal();
          this.loadConfigurations();
          
          // Save slabs if editing
          if (this.editingConfig() && this.editingSlabs().length > 0) {
            this.saveSlabs();
          }
        }
      },
      error: () => {
        this.saving.set(false);
        this.showMessage('Failed to save configuration', 'error');
      }
    });
  }

  saveSlabs(): void {
    const configId = this.editingConfig()?.id;
    if (!configId) return;

    // Update each slab
    for (const slab of this.editingSlabs()) {
      if (slab.id) {
        this.taxConfigService.updateSlab(slab.id, slab).subscribe();
      } else {
        this.taxConfigService.addSlab(configId, slab).subscribe();
      }
    }
  }

  deleteConfig(config: TaxConfiguration): void {
    if (config.isActive) {
      this.showMessage('Cannot delete active configuration', 'error');
      return;
    }

    if (confirm(`Delete tax configuration for ${config.financialYear}?`)) {
      this.taxConfigService.deleteConfiguration(config.id!).subscribe({
        next: () => {
          this.showMessage('Configuration deleted', 'success');
          this.loadConfigurations();
        },
        error: () => {
          this.showMessage('Failed to delete configuration', 'error');
        }
      });
    }
  }

  addSlab(isResident: boolean): void {
    const slabs = this.editingSlabs();
    const residentSlabs = slabs.filter(s => s.isResident === isResident);
    const lastSlab = residentSlabs[residentSlabs.length - 1];
    
    const newSlab: TaxSlab = {
      incomeFrom: lastSlab ? (lastSlab.incomeTo || 0) : 0,
      incomeTo: null,
      taxRate: 0,
      slabOrder: residentSlabs.length + 1,
      isResident: isResident,
      description: ''
    };
    
    this.editingSlabs.set([...slabs, newSlab]);
  }

  removeSlab(slab: TaxSlab): void {
    if (slab.id) {
      this.taxConfigService.deleteSlab(slab.id).subscribe({
        next: () => {
          this.editingSlabs.set(this.editingSlabs().filter(s => s !== slab));
        }
      });
    } else {
      this.editingSlabs.set(this.editingSlabs().filter(s => s !== slab));
    }
  }

  initializeDefaultSlabs(): void {
    const configId = this.editingConfig()?.id;
    if (!configId) return;

    if (confirm('This will replace all existing slabs with PNG default rates. Continue?')) {
      this.taxConfigService.initializeDefaultSlabs(configId).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.editingSlabs.set(res.data);
            this.showMessage('Default PNG tax slabs initialized', 'success');
            this.loadConfigurations();
          }
        },
        error: () => {
          this.showMessage('Failed to initialize default slabs', 'error');
        }
      });
    }
  }

  getResidentSlabs(slabs: TaxSlab[]): TaxSlab[] {
    return slabs.filter(s => s.isResident).sort((a, b) => a.slabOrder - b.slabOrder);
  }

  getNonResidentSlabs(slabs: TaxSlab[]): TaxSlab[] {
    return slabs.filter(s => !s.isResident).sort((a, b) => a.slabOrder - b.slabOrder);
  }

  showMessage(text: string, type: 'success' | 'error'): void {
    this.message.set(text);
    this.messageType.set(type);
    setTimeout(() => this.message.set(''), 3000);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Employee, Dashboard, Role } from '../models';

export interface AuditLog {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  performedBy: string;
  username?: string;
  performedAt: string;
  timestamp?: Date;
  oldValues?: string;
  newValues?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  remarks?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly API_URL = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboard(): Observable<ApiResponse<Dashboard>> {
    return this.http.get<ApiResponse<Dashboard>>(`${this.API_URL}/dashboard`);
  }

  getDashboardStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/dashboard/stats`);
  }

  getRoleDistribution(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/dashboard/role-distribution`);
  }

  // User Management
  getAllUsers(): Observable<ApiResponse<Employee[]>> {
    return this.http.get<ApiResponse<Employee[]>>(`${this.API_URL}/users`);
  }

  createUser(data: Partial<Employee> & { password?: string }): Observable<ApiResponse<Employee>> {
    return this.http.post<ApiResponse<Employee>>(`${this.API_URL}/users`, data);
  }

  updateUser(id: number, data: any): Observable<ApiResponse<Employee>> {
    return this.http.put<ApiResponse<Employee>>(`${this.API_URL}/users/${id}`, data);
  }

  updateUserRole(id: number, role: string): Observable<ApiResponse<Employee>> {
    const params = new HttpParams().set('role', role);
    return this.http.put<ApiResponse<Employee>>(`${this.API_URL}/users/${id}/role`, {}, { params });
  }

  toggleUserStatus(id: number): Observable<ApiResponse<Employee>> {
    return this.http.put<ApiResponse<Employee>>(`${this.API_URL}/users/${id}/toggle-status`, {});
  }

  deactivateUser(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/users/${id}`);
  }

  // Audit Logs
  getAuditLogs(page: number = 0, size: number = 20, entityType?: string, entityId?: number): Observable<ApiResponse<any>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (entityType) params = params.set('entityType', entityType);
    if (entityId) params = params.set('entityId', entityId.toString());
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/audit-logs`, { params });
  }

  getPayrollAuditLogs(): Observable<ApiResponse<AuditLog[]>> {
    return this.http.get<ApiResponse<AuditLog[]>>(`${this.API_URL}/audit-logs/payroll`);
  }

  getAuditLogsByUser(username: string): Observable<ApiResponse<AuditLog[]>> {
    return this.http.get<ApiResponse<AuditLog[]>>(`${this.API_URL}/audit-logs/user/${username}`);
  }
}

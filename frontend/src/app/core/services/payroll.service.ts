import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PayrollRun, PayrollDetail } from '../models';

export interface PayrollAction {
  payrollRunId: number;
  remarks?: string;
  action?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private readonly API_URL = `${environment.apiUrl}/payroll`;

  constructor(private http: HttpClient) {}

  // Dashboard stats
  getDashboardStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/dashboard/stats`);
  }

  // Recent runs
  getRecentRuns(): Observable<ApiResponse<PayrollRun[]>> {
    return this.http.get<ApiResponse<PayrollRun[]>>(`${this.API_URL}/view/runs`);
  }

  // View Endpoints
  getAllPayrollRuns(): Observable<ApiResponse<PayrollRun[]>> {
    return this.http.get<ApiResponse<PayrollRun[]>>(`${this.API_URL}/view/runs`);
  }

  getPayrollRunById(id: number): Observable<ApiResponse<PayrollRun>> {
    return this.http.get<ApiResponse<PayrollRun>>(`${this.API_URL}/view/runs/${id}`);
  }

  getPayrollDetails(runId: number): Observable<ApiResponse<PayrollDetail[]>> {
    return this.http.get<ApiResponse<PayrollDetail[]>>(`${this.API_URL}/view/runs/${runId}/details`);
  }

  // Checker Endpoints - Pending Check
  getPendingCheck(): Observable<ApiResponse<PayrollRun[]>> {
    return this.http.get<ApiResponse<PayrollRun[]>>(`${this.API_URL}/check/pending`);
  }

  getPayrollsForChecking(): Observable<ApiResponse<PayrollRun[]>> {
    return this.http.get<ApiResponse<PayrollRun[]>>(`${this.API_URL}/check/pending`);
  }

  checkPayroll(runId: number): Observable<ApiResponse<PayrollRun>> {
    return this.http.post<ApiResponse<PayrollRun>>(`${this.API_URL}/check/approve`, { payrollRunId: runId });
  }

  rejectPayrollAtCheck(action: PayrollAction): Observable<ApiResponse<PayrollRun>> {
    return this.http.post<ApiResponse<PayrollRun>>(`${this.API_URL}/check/reject`, action);
  }

  // Authorization Endpoints - Pending Authorize
  getPendingAuthorize(): Observable<ApiResponse<PayrollRun[]>> {
    return this.http.get<ApiResponse<PayrollRun[]>>(`${this.API_URL}/authorize/pending`);
  }

  getPayrollsForAuthorization(): Observable<ApiResponse<PayrollRun[]>> {
    return this.http.get<ApiResponse<PayrollRun[]>>(`${this.API_URL}/authorize/pending`);
  }

  authorizePayroll(runId: number): Observable<ApiResponse<PayrollRun>> {
    return this.http.post<ApiResponse<PayrollRun>>(`${this.API_URL}/authorize/approve`, { payrollRunId: runId });
  }

  rejectPayrollAtAuthorization(action: PayrollAction): Observable<ApiResponse<PayrollRun>> {
    return this.http.post<ApiResponse<PayrollRun>>(`${this.API_URL}/authorize/reject`, action);
  }

  // Processing Endpoints - Pending Process
  getPendingProcess(): Observable<ApiResponse<PayrollRun[]>> {
    return this.http.get<ApiResponse<PayrollRun[]>>(`${this.API_URL}/process/pending`);
  }

  getPayrollsForProcessing(): Observable<ApiResponse<PayrollRun[]>> {
    return this.http.get<ApiResponse<PayrollRun[]>>(`${this.API_URL}/process/pending`);
  }

  processPayroll(runId: number): Observable<ApiResponse<PayrollRun>> {
    return this.http.post<ApiResponse<PayrollRun>>(`${this.API_URL}/process/execute`, { payrollRunId: runId });
  }

  // Reject payroll (generic)
  rejectPayroll(runId: number, reason: string): Observable<ApiResponse<PayrollRun>> {
    return this.http.post<ApiResponse<PayrollRun>>(`${this.API_URL}/reject`, { 
      payrollRunId: runId, 
      remarks: reason 
    });
  }

  // Download Payslip
  downloadPayslip(employeeId: number, month: number, year: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}/payslip/${employeeId}/${month}/${year}/download`, {
      responseType: 'blob'
    });
  }
}

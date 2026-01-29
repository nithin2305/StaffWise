import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  ApiResponse, 
  Employee, 
  Attendance, 
  EmployeeRequest, 
  PayrollRun 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class HrService {
  private readonly API_URL = `${environment.apiUrl}/hr`;

  constructor(private http: HttpClient) {}

  // Employee Management
  getAllEmployees(): Observable<ApiResponse<Employee[]>> {
    return this.http.get<ApiResponse<Employee[]>>(`${this.API_URL}/employees`);
  }

  getActiveEmployees(): Observable<ApiResponse<Employee[]>> {
    return this.http.get<ApiResponse<Employee[]>>(`${this.API_URL}/employees/active`);
  }

  getEmployeeById(id: number): Observable<ApiResponse<Employee>> {
    return this.http.get<ApiResponse<Employee>>(`${this.API_URL}/employees/${id}`);
  }

  createEmployee(data: Partial<Employee> & { password?: string }): Observable<ApiResponse<Employee>> {
    return this.http.post<ApiResponse<Employee>>(`${this.API_URL}/employees`, data);
  }

  updateEmployee(id: number, data: Partial<Employee>): Observable<ApiResponse<Employee>> {
    return this.http.put<ApiResponse<Employee>>(`${this.API_URL}/employees/${id}`, data);
  }

  deactivateEmployee(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/employees/${id}`);
  }

  searchEmployees(name: string): Observable<ApiResponse<Employee[]>> {
    const params = new HttpParams().set('name', name);
    return this.http.get<ApiResponse<Employee[]>>(`${this.API_URL}/employees/search`, { params });
  }

  // Attendance Management
  getAttendanceByDate(date: string): Observable<ApiResponse<Attendance[]>> {
    const params = new HttpParams().set('date', date);
    return this.http.get<ApiResponse<Attendance[]>>(`${this.API_URL}/attendance`, { params });
  }

  getEmployeeAttendance(employeeId: number, startDate: string, endDate: string): Observable<ApiResponse<Attendance[]>> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<ApiResponse<Attendance[]>>(`${this.API_URL}/attendance/employee/${employeeId}`, { params });
  }

  createAttendanceRecord(data: Partial<Attendance>): Observable<ApiResponse<Attendance>> {
    return this.http.post<ApiResponse<Attendance>>(`${this.API_URL}/attendance`, data);
  }

  updateAttendance(id: number, data: Partial<Attendance>): Observable<ApiResponse<Attendance>> {
    return this.http.put<ApiResponse<Attendance>>(`${this.API_URL}/attendance/${id}`, data);
  }

  // Leave Approval
  getPendingLeaveRequests(): Observable<ApiResponse<EmployeeRequest[]>> {
    return this.http.get<ApiResponse<EmployeeRequest[]>>(`${this.API_URL}/requests/leave/pending`);
  }

  getPendingLateRequests(): Observable<ApiResponse<EmployeeRequest[]>> {
    return this.http.get<ApiResponse<EmployeeRequest[]>>(`${this.API_URL}/requests/late/pending`);
  }

  getPendingOvertimeRequests(): Observable<ApiResponse<EmployeeRequest[]>> {
    return this.http.get<ApiResponse<EmployeeRequest[]>>(`${this.API_URL}/requests/overtime/pending`);
  }

  approveRequest(id: number): Observable<ApiResponse<EmployeeRequest>> {
    return this.http.post<ApiResponse<EmployeeRequest>>(`${this.API_URL}/requests/${id}/approve`, {});
  }

  rejectRequest(id: number, reason: string): Observable<ApiResponse<EmployeeRequest>> {
    const params = new HttpParams().set('reason', reason);
    return this.http.post<ApiResponse<EmployeeRequest>>(`${this.API_URL}/requests/${id}/reject`, {}, { params });
  }

  // Payroll
  computePayroll(month: number, year: number): Observable<ApiResponse<PayrollRun>> {
    const params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString());
    return this.http.post<ApiResponse<PayrollRun>>(`${this.API_URL}/payroll/compute`, {}, { params });
  }

  getPayrollRuns(): Observable<ApiResponse<PayrollRun[]>> {
    return this.http.get<ApiResponse<PayrollRun[]>>(`${this.API_URL}/payroll/runs`);
  }

  getPayrollRunDetails(id: number): Observable<ApiResponse<PayrollRun>> {
    return this.http.get<ApiResponse<PayrollRun>>(`${this.API_URL}/payroll/runs/${id}`);
  }
}

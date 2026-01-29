import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  ApiResponse, 
  Employee, 
  Attendance, 
  LeaveBalance, 
  EmployeeRequest, 
  PayrollDetail 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly API_URL = `${environment.apiUrl}/employee`;

  constructor(private http: HttpClient) {}

  // Profile
  getMyProfile(): Observable<ApiResponse<Employee>> {
    return this.http.get<ApiResponse<Employee>>(`${this.API_URL}/profile`);
  }

  updateMyProfile(data: Partial<Employee>): Observable<ApiResponse<Employee>> {
    return this.http.put<ApiResponse<Employee>>(`${this.API_URL}/profile`, data);
  }

  // Attendance
  getMyAttendance(): Observable<ApiResponse<Attendance[]>> {
    return this.http.get<ApiResponse<Attendance[]>>(`${this.API_URL}/attendance/my`);
  }

  getMyAttendanceByRange(startDate: string, endDate: string): Observable<ApiResponse<Attendance[]>> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<ApiResponse<Attendance[]>>(`${this.API_URL}/attendance/my/range`, { params });
  }

  checkIn(): Observable<ApiResponse<Attendance>> {
    return this.http.post<ApiResponse<Attendance>>(`${this.API_URL}/attendance/checkin`, {});
  }

  checkOut(): Observable<ApiResponse<Attendance>> {
    return this.http.post<ApiResponse<Attendance>>(`${this.API_URL}/attendance/checkout`, {});
  }

  // Leave Balance
  getMyLeaveBalances(): Observable<ApiResponse<LeaveBalance[]>> {
    return this.http.get<ApiResponse<LeaveBalance[]>>(`${this.API_URL}/leaves/balance`);
  }

  // Requests
  getMyRequests(): Observable<ApiResponse<EmployeeRequest[]>> {
    return this.http.get<ApiResponse<EmployeeRequest[]>>(`${this.API_URL}/requests/my`);
  }

  submitLeaveRequest(data: Partial<EmployeeRequest>): Observable<ApiResponse<EmployeeRequest>> {
    return this.http.post<ApiResponse<EmployeeRequest>>(`${this.API_URL}/requests/leave`, data);
  }

  submitLateComingRequest(data: Partial<EmployeeRequest>): Observable<ApiResponse<EmployeeRequest>> {
    return this.http.post<ApiResponse<EmployeeRequest>>(`${this.API_URL}/requests/late`, data);
  }

  submitOvertimeRequest(data: Partial<EmployeeRequest>): Observable<ApiResponse<EmployeeRequest>> {
    return this.http.post<ApiResponse<EmployeeRequest>>(`${this.API_URL}/requests/overtime`, data);
  }

  // Payslips
  getMyPayslips(): Observable<ApiResponse<PayrollDetail[]>> {
    return this.http.get<ApiResponse<PayrollDetail[]>>(`${this.API_URL}/payslip/my`);
  }

  getMyPayslip(month: number, year: number): Observable<ApiResponse<PayrollDetail>> {
    return this.http.get<ApiResponse<PayrollDetail>>(`${this.API_URL}/payslip/my/${month}/${year}`);
  }

  downloadPayslip(month: number, year: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}/payslip/my/${month}/${year}/download`, {
      responseType: 'blob'
    });
  }
}

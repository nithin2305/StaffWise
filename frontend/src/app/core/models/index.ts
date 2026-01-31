export interface User {
  employeeId: number;
  empCode: string;
  fullName: string;
  email: string;
  role: Role;
  department: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  employeeId: number;
  empCode: string;
  fullName: string;
  email: string;
  role: Role;
  department: string;
}

export interface Employee {
  id?: number;
  empCode: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  dateOfJoining?: string;
  departmentId?: number;
  departmentName?: string;
  department?: string;
  designation?: string;
  role?: Role;
  basicSalary?: number;
  active?: boolean;
  isActive?: boolean;
  managerId?: number;
  managerName?: string;
  reportingManagerName?: string;
  employmentType?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  bankAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  panNumber?: string;
  aadharNumber?: string;
  pfNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  lastLogin?: string;
}

export interface Attendance {
  id?: number;
  employeeId?: number;
  employeeName?: string;
  empCode?: string;
  attendanceDate: string;
  checkIn?: string;
  checkOut?: string;
  checkInTime?: string;
  checkOutTime?: string;
  status?: AttendanceStatus;
  workingHours?: number;
  workHours?: number;
  overtimeHours?: number;
  isLate?: boolean;
  lateMinutes?: number;
  remarks?: string;
  correctedBy?: string;
  correctionReason?: string;
}

export interface LeaveBalance {
  id?: number;
  employeeId?: number;
  employeeName?: string;
  leaveType: LeaveType;
  year?: number;
  totalLeaves?: number;
  usedLeaves?: number;
  pendingLeaves?: number;
  carriedForward?: number;
  availableLeaves?: number;
  balance: number;
  entitled: number;
  used: number;
}

export interface EmployeeRequest {
  id?: number;
  employeeId?: number;
  employeeName?: string;
  empCode?: string;
  requestType: RequestType;
  status: RequestStatus;
  leaveType?: LeaveType;
  startDate?: string;
  endDate?: string;
  fromDate?: string;
  toDate?: string;
  days?: number;
  totalDays?: number;
  lateDate?: string;
  lateTime?: string;
  lateMinutes?: number;
  overtimeDate?: string;
  overtimeHours?: number;
  reason: string;
  approvedById?: number;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt?: string;
}

export interface PayrollRun {
  id?: number;
  fortnight?: number;
  month?: number;
  year: number;
  period?: string;
  periodStart?: string;
  periodEnd?: string;
  status: PayrollStatus;
  runDate?: string;
  totalEmployees: number;
  totalGross: number;
  totalDeductions?: number;
  totalNetPay?: number;
  totalNet: number;
  computedBy?: string;
  computedAt?: string;
  checkedBy?: string;
  checkedAt?: string;
  checkerRemarks?: string;
  authorizedBy?: string;
  authorizedAt?: string;
  authorizationRemarks?: string;
  processedBy?: string;
  processedAt?: string;
  isLocked?: boolean;
  payrollDetails?: PayrollDetail[];
}

export interface PayrollDetail {
  id?: number;
  payrollRunId?: number;
  employeeId: number;
  employeeName: string;
  empCode: string;
  department?: string;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  transportAllowance?: number;
  medicalAllowance?: number;
  specialAllowance?: number;
  otherAllowances: number;
  overtimePay: number;
  bonus?: number;
  grossEarnings: number;
  pf: number;
  professionalTax?: number;
  tds: number;
  pfDeduction?: number;
  taxDeduction?: number;
  insuranceDeduction?: number;
  loanDeduction?: number;
  otherDeductions?: number;
  leaveDeduction?: number;
  lateDeduction?: number;
  lwpDeduction: number;
  totalDeductions: number;
  netPay: number;
  workingDays: number;
  presentDays: number;
  leaveDays: number;
  lwpDays: number;
  totalWorkingDays?: number;
  daysWorked?: number;
  leavesTaken?: number;
  approvedOvertimeHours?: number;
  lateCount?: number;
  grossSalary?: number;
  bankAccount?: string;
  remarks?: string;
  period?: string;
  status?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

export interface Dashboard {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaveRequests: number;
  pendingOvertimeRequests: number;
  pendingLateRequests: number;
  totalPayrollThisMonth: number;
  payrollsPendingApproval: number;
  payrollsProcessedThisYear: number;
}

// Enums
export type Role = 'EMPLOYEE' | 'HR' | 'PAYROLL_CHECKER' | 'PAYROLL_ADMIN' | 'SYSTEM_ADMIN';
export type RequestType = 'LEAVE' | 'LATE_COMING' | 'OVERTIME';
export type RequestStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type LeaveType = 'ANNUAL' | 'SICK' | 'CASUAL' | 'MATERNITY' | 'PATERNITY' | 'UNPAID' | 'COMPENSATORY' | 'PERSONAL';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEKEND' | 'LATE' | 'LEAVE';
export type PayrollStatus = 'COMPUTED' | 'CHECKED' | 'REJECTED' | 'AUTHORIZED' | 'PROCESSED';

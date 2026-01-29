package com.staffwise.hrms.controller;

import com.staffwise.hrms.dto.*;
import com.staffwise.hrms.entity.RequestType;
import com.staffwise.hrms.service.AttendanceService;
import com.staffwise.hrms.service.EmployeeService;
import com.staffwise.hrms.service.PayrollService;
import com.staffwise.hrms.service.RequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/hr")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('HR', 'SYSTEM_ADMIN')")
public class HRController {

    private final EmployeeService employeeService;
    private final AttendanceService attendanceService;
    private final RequestService requestService;
    private final PayrollService payrollService;

    // ============ EMPLOYEE MANAGEMENT ============

    @GetMapping("/employees")
    public ResponseEntity<ApiResponse<List<EmployeeDTO>>> getAllEmployees() {
        List<EmployeeDTO> employees = employeeService.getAllEmployees();
        return ResponseEntity.ok(ApiResponse.success(employees));
    }

    @GetMapping("/employees/active")
    public ResponseEntity<ApiResponse<List<EmployeeDTO>>> getActiveEmployees() {
        List<EmployeeDTO> employees = employeeService.getActiveEmployees();
        return ResponseEntity.ok(ApiResponse.success(employees));
    }

    @GetMapping("/employees/{id}")
    public ResponseEntity<ApiResponse<EmployeeDTO>> getEmployeeById(@PathVariable Long id) {
        EmployeeDTO employee = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(ApiResponse.success(employee));
    }

    @PostMapping("/employees")
    public ResponseEntity<ApiResponse<EmployeeDTO>> createEmployee(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody EmployeeDTO dto) {
        EmployeeDTO employee = employeeService.createEmployee(dto, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Employee created successfully", employee));
    }

    @PutMapping("/employees/{id}")
    public ResponseEntity<ApiResponse<EmployeeDTO>> updateEmployee(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody EmployeeDTO dto) {
        EmployeeDTO employee = employeeService.updateEmployee(id, dto, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Employee updated successfully", employee));
    }

    @DeleteMapping("/employees/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivateEmployee(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        employeeService.deactivateEmployee(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Employee deactivated", null));
    }

    @GetMapping("/employees/search")
    public ResponseEntity<ApiResponse<List<EmployeeDTO>>> searchEmployees(@RequestParam String name) {
        List<EmployeeDTO> employees = employeeService.searchEmployees(name);
        return ResponseEntity.ok(ApiResponse.success(employees));
    }

    // ============ ATTENDANCE MANAGEMENT ============

    @GetMapping("/attendance")
    public ResponseEntity<ApiResponse<List<AttendanceDTO>>> getAttendanceByDate(
            @RequestParam LocalDate date) {
        List<AttendanceDTO> attendance = attendanceService.getAttendanceByDate(date);
        return ResponseEntity.ok(ApiResponse.success(attendance));
    }

    @GetMapping("/attendance/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<AttendanceDTO>>> getEmployeeAttendance(
            @PathVariable Long employeeId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        List<AttendanceDTO> attendance = attendanceService.getAttendanceByEmployeeAndDateRange(
                employeeId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(attendance));
    }

    @PostMapping("/attendance")
    public ResponseEntity<ApiResponse<AttendanceDTO>> createAttendanceRecord(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody AttendanceDTO dto) {
        AttendanceDTO attendance = attendanceService.createAttendanceRecord(dto, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Attendance record created", attendance));
    }

    @PutMapping("/attendance/{id}")
    public ResponseEntity<ApiResponse<AttendanceDTO>> updateAttendance(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody AttendanceDTO dto) {
        AttendanceDTO attendance = attendanceService.updateAttendance(id, dto, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Attendance updated", attendance));
    }

    // ============ LEAVE APPROVAL ============

    @GetMapping("/requests/leave/pending")
    public ResponseEntity<ApiResponse<List<RequestDTO>>> getPendingLeaveRequests() {
        List<RequestDTO> requests = requestService.getPendingLeaveRequests();
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @GetMapping("/requests/late/pending")
    public ResponseEntity<ApiResponse<List<RequestDTO>>> getPendingLateRequests() {
        List<RequestDTO> requests = requestService.getPendingRequests(RequestType.LATE_COMING);
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @GetMapping("/requests/overtime/pending")
    public ResponseEntity<ApiResponse<List<RequestDTO>>> getPendingOvertimeRequests() {
        List<RequestDTO> requests = requestService.getPendingRequests(RequestType.OVERTIME);
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @PostMapping("/requests/{id}/approve")
    public ResponseEntity<ApiResponse<RequestDTO>> approveRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        EmployeeDTO approver = employeeService.getEmployeeByEmail(userDetails.getUsername());
        RequestDTO request = requestService.approveRequest(id, approver.getId(), userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Request approved", request));
    }

    @PostMapping("/requests/{id}/reject")
    public ResponseEntity<ApiResponse<RequestDTO>> rejectRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestParam String reason) {
        EmployeeDTO rejector = employeeService.getEmployeeByEmail(userDetails.getUsername());
        RequestDTO request = requestService.rejectRequest(id, reason, rejector.getId(), userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Request rejected", request));
    }

    // ============ PAYROLL COMPUTATION ============

    @PostMapping("/payroll/compute")
    public ResponseEntity<ApiResponse<PayrollRunDTO>> computePayroll(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam int month,
            @RequestParam int year) {
        PayrollRunDTO payrollRun = payrollService.computePayroll(month, year, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Payroll computed successfully", payrollRun));
    }

    // ============ PAYROLL VIEW (READ-ONLY) ============

    @GetMapping("/payroll/runs")
    public ResponseEntity<ApiResponse<List<PayrollRunDTO>>> getPayrollRuns() {
        List<PayrollRunDTO> runs = payrollService.getAllPayrollRuns();
        return ResponseEntity.ok(ApiResponse.success(runs));
    }

    @GetMapping("/payroll/runs/{id}")
    public ResponseEntity<ApiResponse<PayrollRunDTO>> getPayrollRunDetails(@PathVariable Long id) {
        PayrollRunDTO run = payrollService.getPayrollRunById(id);
        return ResponseEntity.ok(ApiResponse.success(run));
    }
}

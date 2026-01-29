package com.staffwise.hrms.controller;

import com.staffwise.hrms.dto.*;
import com.staffwise.hrms.service.AttendanceService;
import com.staffwise.hrms.service.EmployeeService;
import com.staffwise.hrms.service.PayrollService;
import com.staffwise.hrms.service.PayslipPdfService;
import com.staffwise.hrms.service.RequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/employee")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;
    private final AttendanceService attendanceService;
    private final RequestService requestService;
    private final PayrollService payrollService;
    private final PayslipPdfService payslipPdfService;

    // ============ PROFILE ============
    
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<EmployeeDTO>> getMyProfile(@AuthenticationPrincipal UserDetails userDetails) {
        EmployeeDTO employee = employeeService.getEmployeeByEmail(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(employee));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<EmployeeDTO>> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody EmployeeDTO dto) {
        EmployeeDTO currentEmployee = employeeService.getEmployeeByEmail(userDetails.getUsername());
        EmployeeDTO updated = employeeService.updateEmployee(currentEmployee.getId(), dto, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updated));
    }

    // ============ ATTENDANCE ============

    @GetMapping("/attendance/my")
    public ResponseEntity<ApiResponse<List<AttendanceDTO>>> getMyAttendance(
            @AuthenticationPrincipal UserDetails userDetails) {
        EmployeeDTO employee = employeeService.getEmployeeByEmail(userDetails.getUsername());
        List<AttendanceDTO> attendance = attendanceService.getAttendanceByEmployee(employee.getId());
        return ResponseEntity.ok(ApiResponse.success(attendance));
    }

    @GetMapping("/attendance/my/range")
    public ResponseEntity<ApiResponse<List<AttendanceDTO>>> getMyAttendanceByRange(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        EmployeeDTO employee = employeeService.getEmployeeByEmail(userDetails.getUsername());
        List<AttendanceDTO> attendance = attendanceService.getAttendanceByEmployeeAndDateRange(
                employee.getId(), startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(attendance));
    }

    @PostMapping("/attendance/checkin")
    public ResponseEntity<ApiResponse<AttendanceDTO>> checkIn(@AuthenticationPrincipal UserDetails userDetails) {
        EmployeeDTO employee = employeeService.getEmployeeByEmail(userDetails.getUsername());
        AttendanceDTO attendance = attendanceService.markCheckIn(employee.getId());
        return ResponseEntity.ok(ApiResponse.success("Checked in successfully", attendance));
    }

    @PostMapping("/attendance/checkout")
    public ResponseEntity<ApiResponse<AttendanceDTO>> checkOut(@AuthenticationPrincipal UserDetails userDetails) {
        EmployeeDTO employee = employeeService.getEmployeeByEmail(userDetails.getUsername());
        AttendanceDTO attendance = attendanceService.markCheckOut(employee.getId());
        return ResponseEntity.ok(ApiResponse.success("Checked out successfully", attendance));
    }

    // ============ LEAVE REQUESTS ============

    @GetMapping("/leaves/balance")
    public ResponseEntity<ApiResponse<List<LeaveBalanceDTO>>> getMyLeaveBalances(
            @AuthenticationPrincipal UserDetails userDetails) {
        EmployeeDTO employee = employeeService.getEmployeeByEmail(userDetails.getUsername());
        List<LeaveBalanceDTO> balances = requestService.getLeaveBalances(employee.getId());
        return ResponseEntity.ok(ApiResponse.success(balances));
    }

    @PostMapping("/requests/leave")
    public ResponseEntity<ApiResponse<RequestDTO>> submitLeaveRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody RequestDTO dto) {
        EmployeeDTO employee = employeeService.getEmployeeByEmail(userDetails.getUsername());
        dto.setEmployeeId(employee.getId());
        RequestDTO request = requestService.submitLeaveRequest(dto, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Leave request submitted", request));
    }

    // ============ LATE COMING REQUESTS ============

    @PostMapping("/requests/late")
    public ResponseEntity<ApiResponse<RequestDTO>> submitLateComingRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody RequestDTO dto) {
        EmployeeDTO employee = employeeService.getEmployeeByEmail(userDetails.getUsername());
        dto.setEmployeeId(employee.getId());
        RequestDTO request = requestService.submitLateComingRequest(dto, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Late coming request submitted", request));
    }

    // ============ OVERTIME REQUESTS ============

    @PostMapping("/requests/overtime")
    public ResponseEntity<ApiResponse<RequestDTO>> submitOvertimeRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody RequestDTO dto) {
        EmployeeDTO employee = employeeService.getEmployeeByEmail(userDetails.getUsername());
        dto.setEmployeeId(employee.getId());
        RequestDTO request = requestService.submitOvertimeRequest(dto, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Overtime request submitted", request));
    }

    // ============ MY REQUESTS ============

    @GetMapping("/requests/my")
    public ResponseEntity<ApiResponse<List<RequestDTO>>> getMyRequests(
            @AuthenticationPrincipal UserDetails userDetails) {
        EmployeeDTO employee = employeeService.getEmployeeByEmail(userDetails.getUsername());
        List<RequestDTO> requests = requestService.getRequestsByEmployee(employee.getId());
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    // ============ PAYSLIPS ============

    @GetMapping("/payslip/my")
    public ResponseEntity<ApiResponse<List<PayrollDetailDTO>>> getMyPayslips(
            @AuthenticationPrincipal UserDetails userDetails) {
        EmployeeDTO employee = employeeService.getEmployeeByEmail(userDetails.getUsername());
        List<PayrollDetailDTO> payslips = payrollService.getEmployeePayslips(employee.getId());
        return ResponseEntity.ok(ApiResponse.success(payslips));
    }

    @GetMapping("/payslip/my/{month}/{year}")
    public ResponseEntity<ApiResponse<PayrollDetailDTO>> getMyPayslip(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable int month,
            @PathVariable int year) {
        EmployeeDTO employee = employeeService.getEmployeeByEmail(userDetails.getUsername());
        PayrollDetailDTO payslip = payrollService.getPayslip(employee.getId(), month, year);
        return ResponseEntity.ok(ApiResponse.success(payslip));
    }

    @GetMapping("/payslip/my/{month}/{year}/download")
    public ResponseEntity<byte[]> downloadMyPayslip(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable int month,
            @PathVariable int year) {
        EmployeeDTO employee = employeeService.getEmployeeByEmail(userDetails.getUsername());
        PayrollDetailDTO payslip = payrollService.getPayslip(employee.getId(), month, year);
        byte[] pdf = payslipPdfService.generatePayslip(payslip);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                        "attachment; filename=payslip_" + month + "_" + year + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}

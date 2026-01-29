package com.staffwise.hrms.controller;

import com.staffwise.hrms.dto.ApiResponse;
import com.staffwise.hrms.dto.DashboardDTO;
import com.staffwise.hrms.dto.EmployeeDTO;
import com.staffwise.hrms.entity.AuditLog;
import com.staffwise.hrms.entity.PayrollStatus;
import com.staffwise.hrms.entity.RequestStatus;
import com.staffwise.hrms.entity.RequestType;
import com.staffwise.hrms.entity.Role;
import com.staffwise.hrms.repository.EmployeeRepository;
import com.staffwise.hrms.repository.EmployeeRequestRepository;
import com.staffwise.hrms.repository.PayrollRunRepository;
import com.staffwise.hrms.service.AuditService;
import com.staffwise.hrms.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class AdminController {

    private final EmployeeService employeeService;
    private final EmployeeRepository employeeRepository;
    private final EmployeeRequestRepository requestRepository;
    private final PayrollRunRepository payrollRunRepository;
    private final AuditService auditService;

    // ============ DASHBOARD ============

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardDTO>> getDashboard() {
        DashboardDTO dashboard = DashboardDTO.builder()
                .totalEmployees(employeeRepository.count())
                .activeEmployees(employeeRepository.countActiveEmployees())
                .pendingLeaveRequests((long) requestRepository
                        .findByRequestTypeAndStatus(RequestType.LEAVE, RequestStatus.SUBMITTED).size())
                .pendingOvertimeRequests((long) requestRepository
                        .findByRequestTypeAndStatus(RequestType.OVERTIME, RequestStatus.SUBMITTED).size())
                .pendingLateRequests((long) requestRepository
                        .findByRequestTypeAndStatus(RequestType.LATE_COMING, RequestStatus.SUBMITTED).size())
                .payrollsPendingApproval(payrollRunRepository
                        .findByStatus(PayrollStatus.COMPUTED).size() +
                        payrollRunRepository.findByStatus(PayrollStatus.CHECKED).size())
                .payrollsProcessedThisYear(payrollRunRepository
                        .findByYear(LocalDate.now().getYear()).stream()
                        .filter(p -> p.getStatus() == PayrollStatus.PROCESSED)
                        .toList().size())
                .build();

        return ResponseEntity.ok(ApiResponse.success(dashboard));
    }

    // ============ USER MANAGEMENT ============

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<EmployeeDTO>>> getAllUsers() {
        List<EmployeeDTO> users = employeeService.getAllEmployees();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<EmployeeDTO>> createUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody EmployeeDTO dto) {
        EmployeeDTO user = employeeService.createEmployee(dto, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("User created successfully", user));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<EmployeeDTO>> updateUserRole(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestParam Role role) {
        EmployeeDTO currentDto = employeeService.getEmployeeById(id);
        currentDto.setRole(role);
        EmployeeDTO updated = employeeService.updateEmployee(id, currentDto, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("User role updated", updated));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        employeeService.deactivateEmployee(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("User deactivated", null));
    }

    // ============ AUDIT LOGS ============

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogs(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long entityId) {
        List<AuditLog> logs;
        if (entityType != null && entityId != null) {
            logs = auditService.getAuditLogsByEntity(entityType, entityId);
        } else {
            logs = auditService.getAuditLogsByDateRange(
                    LocalDateTime.now().minusDays(30), LocalDateTime.now());
        }
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/audit-logs/payroll")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getPayrollAuditLogs() {
        List<AuditLog> logs = auditService.getPayrollAuditLogs();
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/audit-logs/user/{username}")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogsByUser(@PathVariable String username) {
        List<AuditLog> logs = auditService.getAuditLogsByUser(username);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
}

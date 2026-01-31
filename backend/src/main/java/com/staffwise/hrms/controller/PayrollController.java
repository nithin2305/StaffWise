package com.staffwise.hrms.controller;

import com.staffwise.hrms.dto.*;
import com.staffwise.hrms.service.PayrollService;
import com.staffwise.hrms.service.PayslipPdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;
    private final PayslipPdfService payslipPdfService;

    // ============ VIEW ENDPOINTS (HR + PAYROLL ROLES) ============

    @GetMapping("/view/runs")
    @PreAuthorize("hasAnyRole('HR', 'PAYROLL_CHECKER', 'PAYROLL_ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<List<PayrollRunDTO>>> getAllPayrollRuns() {
        List<PayrollRunDTO> runs = payrollService.getAllPayrollRuns();
        return ResponseEntity.ok(ApiResponse.success(runs));
    }

    @GetMapping("/view/runs/{id}")
    @PreAuthorize("hasAnyRole('HR', 'PAYROLL_CHECKER', 'PAYROLL_ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<PayrollRunDTO>> getPayrollRunById(@PathVariable Long id) {
        PayrollRunDTO run = payrollService.getPayrollRunById(id);
        return ResponseEntity.ok(ApiResponse.success(run));
    }

    @GetMapping("/view/runs/{runId}/details")
    @PreAuthorize("hasAnyRole('HR', 'PAYROLL_CHECKER', 'PAYROLL_ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<List<PayrollDetailDTO>>> getPayrollDetails(@PathVariable Long runId) {
        List<PayrollDetailDTO> details = payrollService.getPayrollDetailsByRun(runId);
        return ResponseEntity.ok(ApiResponse.success(details));
    }

    // ============ PAYROLL CHECKER ENDPOINTS ============

    @GetMapping("/check/pending")
    @PreAuthorize("hasAnyRole('HR', 'PAYROLL_CHECKER', 'PAYROLL_ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<List<PayrollRunDTO>>> getPayrollsForChecking() {
        List<PayrollRunDTO> runs = payrollService.getPayrollsForChecking();
        return ResponseEntity.ok(ApiResponse.success(runs));
    }

    @PostMapping("/check/approve")
    @PreAuthorize("hasAnyRole('HR', 'PAYROLL_CHECKER', 'PAYROLL_ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<PayrollRunDTO>> checkPayroll(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PayrollActionDTO action) {
        PayrollRunDTO run = payrollService.checkPayroll(action, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Payroll checked and approved", run));
    }

    @PostMapping("/check/reject")
    @PreAuthorize("hasAnyRole('HR', 'PAYROLL_CHECKER', 'PAYROLL_ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<PayrollRunDTO>> rejectPayrollAtCheck(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PayrollActionDTO action) {
        PayrollRunDTO run = payrollService.rejectPayroll(action, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Payroll rejected", run));
    }

    // ============ PAYROLL ADMIN ENDPOINTS (Authorize & Credit - Combined) ============

    @GetMapping("/authorize/pending")
    @PreAuthorize("hasAnyRole('PAYROLL_ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<List<PayrollRunDTO>>> getPayrollsForAuthorization() {
        List<PayrollRunDTO> runs = payrollService.getPayrollsForAuthorization();
        return ResponseEntity.ok(ApiResponse.success(runs));
    }

    @PostMapping("/authorize/approve")
    @PreAuthorize("hasAnyRole('PAYROLL_ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<PayrollRunDTO>> authorizePayroll(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PayrollActionDTO action) {
        PayrollRunDTO run = payrollService.authorizePayroll(action, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Payroll authorized and credited successfully", run));
    }

    @PostMapping("/authorize/reject")
    @PreAuthorize("hasAnyRole('PAYROLL_ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<PayrollRunDTO>> rejectPayrollAtAuthorization(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PayrollActionDTO action) {
        PayrollRunDTO run = payrollService.rejectPayroll(action, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Payroll rejected", run));
    }

    // ============ PAYROLL PROCESSING ENDPOINTS ============

    @GetMapping("/process/pending")
    @PreAuthorize("hasAnyRole('PAYROLL_ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<List<PayrollRunDTO>>> getPayrollsForProcessing() {
        List<PayrollRunDTO> runs = payrollService.getPayrollsForProcessing();
        return ResponseEntity.ok(ApiResponse.success(runs));
    }

    @PostMapping("/process/execute")
    @PreAuthorize("hasAnyRole('PAYROLL_ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<PayrollRunDTO>> processPayroll(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PayrollActionDTO action) {
        PayrollRunDTO run = payrollService.processPayroll(action, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Payroll processed and locked", run));
    }

    // ============ PAYSLIP DOWNLOAD (FOR HR/PAYROLL) ============

    @GetMapping("/payslip/{employeeId}/{month}/{year}/download")
    @PreAuthorize("hasAnyRole('HR', 'PAYROLL_CHECKER', 'PAYROLL_ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<byte[]> downloadPayslip(
            @PathVariable Long employeeId,
            @PathVariable int month,
            @PathVariable int year) {
        PayrollDetailDTO payslip = payrollService.getPayslip(employeeId, month, year);
        byte[] pdf = payslipPdfService.generatePayslip(payslip);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=payslip_" + payslip.getEmpCode() + "_" + month + "_" + year + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}

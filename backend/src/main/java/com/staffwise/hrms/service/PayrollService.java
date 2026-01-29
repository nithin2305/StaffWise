package com.staffwise.hrms.service;

import com.staffwise.hrms.dto.PayrollActionDTO;
import com.staffwise.hrms.dto.PayrollDetailDTO;
import com.staffwise.hrms.dto.PayrollRunDTO;
import com.staffwise.hrms.entity.*;
import com.staffwise.hrms.exception.ResourceNotFoundException;
import com.staffwise.hrms.exception.InvalidPayrollStateException;
import com.staffwise.hrms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PayrollService {

    private final PayrollRunRepository payrollRunRepository;
    private final PayrollDetailRepository payrollDetailRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final EmployeeRequestRepository requestRepository;
    private final AuditService auditService;

    // Payroll computation constants
    private static final double HRA_PERCENTAGE = 0.40;
    private static final double TRANSPORT_ALLOWANCE = 1600.0;
    private static final double MEDICAL_ALLOWANCE = 1250.0;
    private static final double PF_PERCENTAGE = 0.12;
    private static final double TAX_PERCENTAGE = 0.10;
    private static final double OVERTIME_RATE_MULTIPLIER = 1.5;
    private static final double LATE_DEDUCTION_PER_OCCURRENCE = 200.0;

    // ============ PAYROLL COMPUTATION (HR) ============

    public PayrollRunDTO computePayroll(int month, int year, String computedBy) {
        // Check if payroll already exists
        if (payrollRunRepository.findByMonthAndYear(month, year).isPresent()) {
            throw new IllegalStateException("Payroll already exists for " + month + "/" + year);
        }

        List<Employee> activeEmployees = employeeRepository.findByIsActiveTrue();
        
        PayrollRun payrollRun = PayrollRun.builder()
                .month(month)
                .year(year)
                .status(PayrollStatus.COMPUTED)
                .runDate(LocalDateTime.now())
                .totalEmployees(activeEmployees.size())
                .computedBy(computedBy)
                .computedAt(LocalDateTime.now())
                .build();

        payrollRun = payrollRunRepository.save(payrollRun);

        double totalGross = 0;
        double totalDeductions = 0;
        double totalNetPay = 0;

        YearMonth yearMonth = YearMonth.of(year, month);
        int totalWorkingDays = calculateWorkingDays(yearMonth);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        for (Employee employee : activeEmployees) {
            PayrollDetail detail = computeEmployeePayroll(employee, payrollRun, month, year, 
                    totalWorkingDays, startDate, endDate);
            
            totalGross += detail.getGrossSalary();
            totalDeductions += detail.getTotalDeductions();
            totalNetPay += detail.getNetPay();
        }

        payrollRun.setTotalGross(totalGross);
        payrollRun.setTotalDeductions(totalDeductions);
        payrollRun.setTotalNetPay(totalNetPay);

        PayrollRun saved = payrollRunRepository.save(payrollRun);
        
        auditService.logAction("PayrollRun", saved.getId(), "COMPUTE", computedBy, 
                null, "Computed payroll for " + month + "/" + year);
        
        log.info("Payroll computed for {}/{} by {} - Total Net Pay: {}", month, year, computedBy, totalNetPay);
        return mapToDTO(saved);
    }

    private PayrollDetail computeEmployeePayroll(Employee employee, PayrollRun payrollRun, 
            int month, int year, int totalWorkingDays, LocalDate startDate, LocalDate endDate) {
        
        Double basicSalary = employee.getBasicSalary() != null ? employee.getBasicSalary() : 0.0;
        
        // Calculate attendance
        Integer daysWorked = attendanceRepository.countPresentDays(employee.getId(), month, year);
        daysWorked = daysWorked != null ? daysWorked : totalWorkingDays;
        
        Integer lateCount = attendanceRepository.countLateDays(employee.getId(), month, year);
        lateCount = lateCount != null ? lateCount : 0;

        // Get approved overtime
        List<EmployeeRequest> approvedOvertimes = requestRepository.findApprovedOvertimeNotInPayroll(
                employee.getId(), startDate, endDate);
        double approvedOvertimeHours = approvedOvertimes.stream()
                .mapToDouble(r -> r.getOvertimeHours() != null ? r.getOvertimeHours() : 0.0)
                .sum();

        // Get approved leaves
        List<EmployeeRequest> approvedLeaves = requestRepository.findApprovedLeavesInPeriod(
                employee.getId(), startDate, endDate);
        double leavesTaken = approvedLeaves.stream()
                .mapToDouble(r -> r.getTotalDays() != null ? r.getTotalDays() : 0.0)
                .sum();

        // Calculate earnings
        double dailyRate = basicSalary / totalWorkingDays;
        double proRataBasic = dailyRate * daysWorked;
        double hra = proRataBasic * HRA_PERCENTAGE;
        double overtimePay = (dailyRate / 8) * approvedOvertimeHours * OVERTIME_RATE_MULTIPLIER;

        // Calculate deductions
        double pfDeduction = proRataBasic * PF_PERCENTAGE;
        double taxDeduction = (proRataBasic + hra) * TAX_PERCENTAGE;
        double lateDeduction = lateCount * LATE_DEDUCTION_PER_OCCURRENCE;

        PayrollDetail detail = PayrollDetail.builder()
                .payrollRun(payrollRun)
                .employee(employee)
                .basicSalary(proRataBasic)
                .hra(hra)
                .transportAllowance(TRANSPORT_ALLOWANCE)
                .medicalAllowance(MEDICAL_ALLOWANCE)
                .overtimePay(overtimePay)
                .pfDeduction(pfDeduction)
                .taxDeduction(taxDeduction)
                .lateDeduction(lateDeduction)
                .totalWorkingDays(totalWorkingDays)
                .daysWorked(daysWorked)
                .leavesTaken(leavesTaken)
                .approvedOvertimeHours(approvedOvertimeHours)
                .lateCount(lateCount)
                .build();

        detail.calculateTotals();

        // Mark overtime requests as included in payroll
        for (EmployeeRequest overtime : approvedOvertimes) {
            overtime.setIncludedInPayroll(true);
            requestRepository.save(overtime);
        }

        return payrollDetailRepository.save(detail);
    }

    // ============ PAYROLL CHECK (PAYROLL CHECKER) ============

    public PayrollRunDTO checkPayroll(PayrollActionDTO action, String checkedBy) {
        PayrollRun payrollRun = payrollRunRepository.findById(action.getPayrollRunId())
                .orElseThrow(() -> new ResourceNotFoundException("Payroll run not found"));

        if (payrollRun.getStatus() != PayrollStatus.COMPUTED && 
            payrollRun.getStatus() != PayrollStatus.REJECTED) {
            throw new InvalidPayrollStateException("Payroll must be in COMPUTED or REJECTED status to check");
        }

        payrollRun.setStatus(PayrollStatus.CHECKED);
        payrollRun.setCheckedBy(checkedBy);
        payrollRun.setCheckedAt(LocalDateTime.now());
        payrollRun.setCheckerRemarks(action.getRemarks());

        PayrollRun saved = payrollRunRepository.save(payrollRun);
        
        auditService.logAction("PayrollRun", saved.getId(), "CHECK", checkedBy, 
                "status=COMPUTED", "status=CHECKED");
        
        log.info("Payroll {} checked by {}", action.getPayrollRunId(), checkedBy);
        return mapToDTO(saved);
    }

    public PayrollRunDTO rejectPayroll(PayrollActionDTO action, String rejectedBy) {
        PayrollRun payrollRun = payrollRunRepository.findById(action.getPayrollRunId())
                .orElseThrow(() -> new ResourceNotFoundException("Payroll run not found"));

        if (payrollRun.getStatus() != PayrollStatus.COMPUTED && 
            payrollRun.getStatus() != PayrollStatus.CHECKED) {
            throw new InvalidPayrollStateException("Cannot reject payroll in current status");
        }

        String oldStatus = payrollRun.getStatus().name();
        
        payrollRun.setStatus(PayrollStatus.REJECTED);
        payrollRun.setCheckerRemarks(action.getRemarks());
        payrollRun.setCheckedBy(rejectedBy);
        payrollRun.setCheckedAt(LocalDateTime.now());

        PayrollRun saved = payrollRunRepository.save(payrollRun);
        
        auditService.logAction("PayrollRun", saved.getId(), "REJECT", rejectedBy, 
                "status=" + oldStatus, "status=REJECTED");
        
        log.info("Payroll {} rejected by {}: {}", action.getPayrollRunId(), rejectedBy, action.getRemarks());
        return mapToDTO(saved);
    }

    // ============ PAYROLL AUTHORIZATION (PAYROLL ADMIN) ============

    public PayrollRunDTO authorizePayroll(PayrollActionDTO action, String authorizedBy) {
        PayrollRun payrollRun = payrollRunRepository.findById(action.getPayrollRunId())
                .orElseThrow(() -> new ResourceNotFoundException("Payroll run not found"));

        if (payrollRun.getStatus() != PayrollStatus.CHECKED) {
            throw new InvalidPayrollStateException("Payroll must be in CHECKED status to authorize");
        }

        payrollRun.setStatus(PayrollStatus.AUTHORIZED);
        payrollRun.setAuthorizedBy(authorizedBy);
        payrollRun.setAuthorizedAt(LocalDateTime.now());
        payrollRun.setAuthorizationRemarks(action.getRemarks());

        PayrollRun saved = payrollRunRepository.save(payrollRun);
        
        auditService.logAction("PayrollRun", saved.getId(), "AUTHORIZE", authorizedBy, 
                "status=CHECKED", "status=AUTHORIZED");
        
        log.info("Payroll {} authorized by {}", action.getPayrollRunId(), authorizedBy);
        return mapToDTO(saved);
    }

    // ============ PAYROLL PROCESSING (PAYROLL ADMIN) ============

    public PayrollRunDTO processPayroll(PayrollActionDTO action, String processedBy) {
        PayrollRun payrollRun = payrollRunRepository.findById(action.getPayrollRunId())
                .orElseThrow(() -> new ResourceNotFoundException("Payroll run not found"));

        if (payrollRun.getStatus() != PayrollStatus.AUTHORIZED) {
            throw new InvalidPayrollStateException("Payroll must be in AUTHORIZED status to process");
        }

        // Idempotency check
        if (payrollRunRepository.isPayrollProcessed(payrollRun.getMonth(), payrollRun.getYear())) {
            throw new InvalidPayrollStateException("Payroll for this period is already processed");
        }

        payrollRun.setStatus(PayrollStatus.PROCESSED);
        payrollRun.setProcessedBy(processedBy);
        payrollRun.setProcessedAt(LocalDateTime.now());
        payrollRun.setIsLocked(true);

        PayrollRun saved = payrollRunRepository.save(payrollRun);
        
        auditService.logAction("PayrollRun", saved.getId(), "PROCESS", processedBy, 
                "status=AUTHORIZED", "status=PROCESSED");
        
        log.info("Payroll {} processed and locked by {}", action.getPayrollRunId(), processedBy);
        return mapToDTO(saved);
    }

    // ============ QUERY METHODS ============

    public List<PayrollRunDTO> getAllPayrollRuns() {
        return payrollRunRepository.findAllOrderByPeriodDesc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<PayrollRunDTO> getPayrollsForChecking() {
        return payrollRunRepository.findPayrollsForChecking().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<PayrollRunDTO> getPayrollsForAuthorization() {
        return payrollRunRepository.findPayrollsForAuthorization().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<PayrollRunDTO> getPayrollsForProcessing() {
        return payrollRunRepository.findPayrollsForProcessing().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public PayrollRunDTO getPayrollRunById(Long id) {
        PayrollRun payrollRun = payrollRunRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll run not found"));
        return mapToDTOWithDetails(payrollRun);
    }

    public List<PayrollDetailDTO> getPayrollDetailsByRun(Long runId) {
        return payrollDetailRepository.findByPayrollRunId(runId).stream()
                .map(this::mapDetailToDTO)
                .collect(Collectors.toList());
    }

    public List<PayrollDetailDTO> getEmployeePayslips(Long employeeId) {
        return payrollDetailRepository.findProcessedPayslips(employeeId).stream()
                .map(this::mapDetailToDTO)
                .collect(Collectors.toList());
    }

    public PayrollDetailDTO getPayslip(Long employeeId, int month, int year) {
        // Check if payroll is processed
        PayrollRun payrollRun = payrollRunRepository.findByMonthAndYear(month, year)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll not found for this period"));
        
        if (payrollRun.getStatus() != PayrollStatus.PROCESSED) {
            throw new InvalidPayrollStateException("Payslip is only available after payroll is processed");
        }

        PayrollDetail detail = payrollDetailRepository.findByEmployeeAndPeriod(employeeId, month, year)
                .orElseThrow(() -> new ResourceNotFoundException("Payslip not found"));
        
        return mapDetailToDTO(detail);
    }

    // ============ HELPER METHODS ============

    private int calculateWorkingDays(YearMonth yearMonth) {
        int totalDays = yearMonth.lengthOfMonth();
        int workingDays = 0;
        
        for (int day = 1; day <= totalDays; day++) {
            LocalDate date = yearMonth.atDay(day);
            if (date.getDayOfWeek().getValue() < 6) { // Monday to Friday
                workingDays++;
            }
        }
        return workingDays;
    }

    private PayrollRunDTO mapToDTO(PayrollRun payrollRun) {
        return PayrollRunDTO.builder()
                .id(payrollRun.getId())
                .month(payrollRun.getMonth())
                .year(payrollRun.getYear())
                .period(payrollRun.getPeriod())
                .status(payrollRun.getStatus())
                .runDate(payrollRun.getRunDate())
                .totalEmployees(payrollRun.getTotalEmployees())
                .totalGross(payrollRun.getTotalGross())
                .totalDeductions(payrollRun.getTotalDeductions())
                .totalNetPay(payrollRun.getTotalNetPay())
                .computedBy(payrollRun.getComputedBy())
                .computedAt(payrollRun.getComputedAt())
                .checkedBy(payrollRun.getCheckedBy())
                .checkedAt(payrollRun.getCheckedAt())
                .checkerRemarks(payrollRun.getCheckerRemarks())
                .authorizedBy(payrollRun.getAuthorizedBy())
                .authorizedAt(payrollRun.getAuthorizedAt())
                .authorizationRemarks(payrollRun.getAuthorizationRemarks())
                .processedBy(payrollRun.getProcessedBy())
                .processedAt(payrollRun.getProcessedAt())
                .isLocked(payrollRun.getIsLocked())
                .build();
    }

    private PayrollRunDTO mapToDTOWithDetails(PayrollRun payrollRun) {
        PayrollRunDTO dto = mapToDTO(payrollRun);
        dto.setPayrollDetails(payrollRun.getPayrollDetails().stream()
                .map(this::mapDetailToDTO)
                .collect(Collectors.toList()));
        return dto;
    }

    private PayrollDetailDTO mapDetailToDTO(PayrollDetail detail) {
        return PayrollDetailDTO.builder()
                .id(detail.getId())
                .payrollRunId(detail.getPayrollRun().getId())
                .employeeId(detail.getEmployee().getId())
                .employeeName(detail.getEmployee().getFullName())
                .empCode(detail.getEmployee().getEmpCode())
                .department(detail.getEmployee().getDepartment() != null ? 
                        detail.getEmployee().getDepartment().getName() : null)
                .basicSalary(detail.getBasicSalary())
                .hra(detail.getHra())
                .transportAllowance(detail.getTransportAllowance())
                .medicalAllowance(detail.getMedicalAllowance())
                .specialAllowance(detail.getSpecialAllowance())
                .overtimePay(detail.getOvertimePay())
                .bonus(detail.getBonus())
                .pfDeduction(detail.getPfDeduction())
                .taxDeduction(detail.getTaxDeduction())
                .insuranceDeduction(detail.getInsuranceDeduction())
                .loanDeduction(detail.getLoanDeduction())
                .otherDeductions(detail.getOtherDeductions())
                .leaveDeduction(detail.getLeaveDeduction())
                .lateDeduction(detail.getLateDeduction())
                .totalWorkingDays(detail.getTotalWorkingDays())
                .daysWorked(detail.getDaysWorked())
                .leavesTaken(detail.getLeavesTaken())
                .approvedOvertimeHours(detail.getApprovedOvertimeHours())
                .lateCount(detail.getLateCount())
                .grossSalary(detail.getGrossSalary())
                .totalDeductions(detail.getTotalDeductions())
                .netPay(detail.getNetPay())
                .remarks(detail.getRemarks())
                .period(detail.getPayrollRun().getPeriod())
                .status(detail.getPayrollRun().getStatus().name())
                .build();
    }
}

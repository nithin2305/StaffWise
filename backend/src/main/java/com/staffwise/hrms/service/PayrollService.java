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

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
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

    // Payroll computation constants - adjusted for fortnightly pay
    private static final double HRA_PERCENTAGE = 0.40;
    private static final double TRANSPORT_ALLOWANCE = 800.0;  // Fortnightly (half of monthly)
    private static final double MEDICAL_ALLOWANCE = 625.0;    // Fortnightly (half of monthly)
    private static final double PF_PERCENTAGE = 0.12;
    private static final double TAX_PERCENTAGE = 0.10;
    private static final double OVERTIME_RATE_MULTIPLIER = 1.5;
    private static final double LATE_DEDUCTION_PER_OCCURRENCE = 100.0;  // Fortnightly rate
    private static final int DAYS_IN_FORTNIGHT = 14;
    private static final int FORTNIGHTS_PER_YEAR = 26;

    // ============ PAYROLL COMPUTATION (HR) - FORTNIGHTLY ============

    /**
     * Compute fortnightly payroll.
     * @param fortnight The fortnight number (1-26)
     * @param year The year
     * @param computedBy The user who computed the payroll
     */
    public PayrollRunDTO computePayroll(int fortnight, int year, String computedBy) {
        // Validate fortnight
        if (fortnight < 1 || fortnight > FORTNIGHTS_PER_YEAR) {
            throw new IllegalArgumentException("Fortnight must be between 1 and " + FORTNIGHTS_PER_YEAR);
        }

        // Check if payroll already exists for this fortnight
        if (payrollRunRepository.findByFortnightAndYear(fortnight, year).isPresent()) {
            throw new IllegalStateException("Payroll already exists for Fortnight " + fortnight + ", " + year);
        }

        // Calculate period dates
        LocalDate[] periodDates = calculateFortnightDates(fortnight, year);
        LocalDate periodStart = periodDates[0];
        LocalDate periodEnd = periodDates[1];

        List<Employee> activeEmployees = employeeRepository.findByIsActiveTrue();
        
        PayrollRun payrollRun = PayrollRun.builder()
                .fortnight(fortnight)
                .year(year)
                .periodStart(periodStart)
                .periodEnd(periodEnd)
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

        int totalWorkingDays = calculateWorkingDaysInPeriod(periodStart, periodEnd);

        for (Employee employee : activeEmployees) {
            PayrollDetail detail = computeEmployeePayroll(employee, payrollRun, fortnight, year, 
                    totalWorkingDays, periodStart, periodEnd);
            
            totalGross += detail.getGrossSalary();
            totalDeductions += detail.getTotalDeductions();
            totalNetPay += detail.getNetPay();
        }

        payrollRun.setTotalGross(totalGross);
        payrollRun.setTotalDeductions(totalDeductions);
        payrollRun.setTotalNetPay(totalNetPay);

        PayrollRun saved = payrollRunRepository.save(payrollRun);
        
        auditService.logAction("PayrollRun", saved.getId(), "COMPUTE", computedBy, 
                null, "Computed fortnightly payroll for Fortnight " + fortnight + ", " + year);
        
        log.info("Fortnightly payroll computed for Fortnight {}/{} by {} - Total Net Pay: {}", 
                fortnight, year, computedBy, totalNetPay);
        return mapToDTO(saved);
    }

    /**
     * Calculate the start and end dates for a given fortnight.
     * Fortnight 1 starts on Jan 1 of the year.
     */
    private LocalDate[] calculateFortnightDates(int fortnight, int year) {
        LocalDate yearStart = LocalDate.of(year, 1, 1);
        LocalDate periodStart = yearStart.plusDays((long) (fortnight - 1) * DAYS_IN_FORTNIGHT);
        LocalDate periodEnd = periodStart.plusDays(DAYS_IN_FORTNIGHT - 1);
        
        // Ensure period end doesn't exceed year boundary
        LocalDate yearEnd = LocalDate.of(year, 12, 31);
        if (periodEnd.isAfter(yearEnd)) {
            periodEnd = yearEnd;
        }
        
        return new LocalDate[] { periodStart, periodEnd };
    }

    /**
     * Calculate working days (Mon-Fri) in a date range.
     */
    private int calculateWorkingDaysInPeriod(LocalDate start, LocalDate end) {
        int workingDays = 0;
        LocalDate current = start;
        while (!current.isAfter(end)) {
            DayOfWeek day = current.getDayOfWeek();
            if (day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY) {
                workingDays++;
            }
            current = current.plusDays(1);
        }
        return workingDays;
    }

    private PayrollDetail computeEmployeePayroll(Employee employee, PayrollRun payrollRun, 
            int fortnight, int year, int totalWorkingDays, LocalDate startDate, LocalDate endDate) {
        
        // Get monthly basic salary and convert to fortnightly
        Double monthlyBasicSalary = employee.getBasicSalary() != null ? employee.getBasicSalary() : 0.0;
        Double fortnightlyBasicSalary = monthlyBasicSalary / 2; // Monthly / 2 for fortnightly
        
        // Calculate attendance using date range (fortnightly)
        Integer daysWorked = attendanceRepository.countPresentDaysInPeriod(employee.getId(), startDate, endDate);
        daysWorked = daysWorked != null ? daysWorked : totalWorkingDays;
        
        Integer lateCount = attendanceRepository.countLateDaysInPeriod(employee.getId(), startDate, endDate);
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

        // Calculate earnings based on fortnightly rates
        double dailyRate = fortnightlyBasicSalary / totalWorkingDays;
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
    // Authorization now directly processes the payroll (combined authorize + process)

    public PayrollRunDTO authorizePayroll(PayrollActionDTO action, String authorizedBy) {
        PayrollRun payrollRun = payrollRunRepository.findById(action.getPayrollRunId())
                .orElseThrow(() -> new ResourceNotFoundException("Payroll run not found"));

        if (payrollRun.getStatus() != PayrollStatus.CHECKED) {
            throw new InvalidPayrollStateException("Payroll must be in CHECKED status to authorize");
        }

        // Idempotency check
        if (payrollRunRepository.isPayrollProcessed(payrollRun.getFortnight(), payrollRun.getYear())) {
            throw new InvalidPayrollStateException("Payroll for this period is already processed");
        }

        LocalDateTime now = LocalDateTime.now();
        
        // Set authorization details
        payrollRun.setAuthorizedBy(authorizedBy);
        payrollRun.setAuthorizedAt(now);
        payrollRun.setAuthorizationRemarks(action.getRemarks());
        
        // Directly process the payroll (combined step)
        payrollRun.setStatus(PayrollStatus.PROCESSED);
        payrollRun.setProcessedBy(authorizedBy);
        payrollRun.setProcessedAt(now);
        payrollRun.setIsLocked(true);

        PayrollRun saved = payrollRunRepository.save(payrollRun);
        
        auditService.logAction("PayrollRun", saved.getId(), "AUTHORIZE_AND_PROCESS", authorizedBy, 
                "status=CHECKED", "status=PROCESSED");
        
        log.info("Payroll {} authorized and processed by {}", action.getPayrollRunId(), authorizedBy);
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
        if (payrollRunRepository.isPayrollProcessed(payrollRun.getFortnight(), payrollRun.getYear())) {
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

    public PayrollDetailDTO getPayslip(Long employeeId, int fortnight, int year) {
        // Check if payroll is processed
        PayrollRun payrollRun = payrollRunRepository.findByFortnightAndYear(fortnight, year)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll not found for this period"));
        
        if (payrollRun.getStatus() != PayrollStatus.PROCESSED) {
            throw new InvalidPayrollStateException("Payslip is only available after payroll is processed");
        }

        PayrollDetail detail = payrollDetailRepository.findByEmployeeAndPeriod(employeeId, fortnight, year)
                .orElseThrow(() -> new ResourceNotFoundException("Payslip not found"));
        
        return mapDetailToDTO(detail);
    }

    // ============ HELPER METHODS ============

    private PayrollRunDTO mapToDTO(PayrollRun payrollRun) {
        return PayrollRunDTO.builder()
                .id(payrollRun.getId())
                .fortnight(payrollRun.getFortnight())
                .year(payrollRun.getYear())
                .periodStart(payrollRun.getPeriodStart())
                .periodEnd(payrollRun.getPeriodEnd())
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
                .month(detail.getPayrollRun().getMonth())
                .year(detail.getPayrollRun().getYear())
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

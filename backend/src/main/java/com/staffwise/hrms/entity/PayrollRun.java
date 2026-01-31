package com.staffwise.hrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * PayrollRun entity for Papua New Guinea fortnightly payroll.
 * Tracks payroll runs with SWT and Superannuation totals for government remittance.
 */
@Entity
@Table(name = "payroll_runs")
@SequenceGenerator(name = "seq_generator", sequenceName = "payroll_run_seq", allocationSize = 1)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class PayrollRun extends BaseEntity {

    // Fortnight number (1-26 for 26 fortnights per year)
    @Column(name = "fortnight", nullable = false)
    private Integer fortnight;

    @Column(name = "\"YEAR\"", nullable = false)
    private Integer year;

    // Pay period start date
    @Column(name = "period_start")
    private LocalDate periodStart;

    // Pay period end date
    @Column(name = "period_end")
    private LocalDate periodEnd;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PayrollStatus status = PayrollStatus.COMPUTED;

    @Column(name = "run_date")
    private LocalDateTime runDate;

    @Column(name = "total_employees")
    private Integer totalEmployees;

    @Column(name = "total_gross")
    private Double totalGross;

    @Column(name = "total_deductions")
    private Double totalDeductions;

    @Column(name = "total_net_pay")
    private Double totalNetPay;

    // ============ TAX SUMMARY FOR IRC REMITTANCE (Salary and Wages Tax) ============
    
    @Column(name = "total_swt")
    @Builder.Default
    private Double totalSwt = 0.0; // Total Salary and Wages Tax

    // ============ SUPERANNUATION SUMMARY FOR FUND REMITTANCE ============
    
    @Column(name = "total_super_employee")
    @Builder.Default
    private Double totalSuperEmployee = 0.0;

    @Column(name = "total_super_employer")
    @Builder.Default
    private Double totalSuperEmployer = 0.0;

    @Column(name = "total_super")
    @Builder.Default
    private Double totalSuper = 0.0; // Total superannuation (employee + employer)

    // ============ REMITTANCE TRACKING ============
    
    // SWT remittance to IRC (Internal Revenue Commission)
    @Column(name = "swt_remitted")
    @Builder.Default
    private Boolean swtRemitted = false;

    @Column(name = "swt_remittance_date")
    private LocalDate swtRemittanceDate;

    @Column(name = "swt_reference_number")
    private String swtReferenceNumber;

    // Superannuation remittance (NASFUND/Nambawan Super)
    @Column(name = "super_remitted")
    @Builder.Default
    private Boolean superRemitted = false;

    @Column(name = "super_remittance_date")
    private LocalDate superRemittanceDate;

    @Column(name = "super_reference_number")
    private String superReferenceNumber;

    // Superannuation fund name (e.g., "NASFUND", "Nambawan Super")
    @Column(name = "super_fund_name")
    private String superFundName;

    // ============ LEGACY FIELDS (for backwards compatibility) ============
    
    @Column(name = "total_income_tax")
    @Builder.Default
    private Double totalIncomeTax = 0.0;

    @Column(name = "total_pf_employee")
    @Builder.Default
    private Double totalPfEmployee = 0.0;

    @Column(name = "total_pf_employer")
    @Builder.Default
    private Double totalPfEmployer = 0.0;

    // ============ END TAX SUMMARY ============

    @OneToMany(mappedBy = "payrollRun", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PayrollDetail> payrollDetails = new ArrayList<>();

    // Computed by
    @Column(name = "computed_by")
    private String computedBy;

    @Column(name = "computed_at")
    private LocalDateTime computedAt;

    // Checked by Payroll Checker
    @Column(name = "checked_by")
    private String checkedBy;

    @Column(name = "checked_at")
    private LocalDateTime checkedAt;

    @Column(name = "checker_remarks", length = 1000)
    private String checkerRemarks;

    // Authorized by Payroll Admin
    @Column(name = "authorized_by")
    private String authorizedBy;

    @Column(name = "authorized_at")
    private LocalDateTime authorizedAt;

    @Column(name = "authorization_remarks", length = 1000)
    private String authorizationRemarks;

    // Processed
    @Column(name = "processed_by")
    private String processedBy;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "is_locked")
    @Builder.Default
    private Boolean isLocked = false;

    /**
     * Returns the period string for display (e.g., "Fortnight 5, 2025" or "Jan 1-14, 2025")
     */
    public String getPeriod() {
        if (periodStart != null && periodEnd != null) {
            return String.format("%s %d - %s %d, %d", 
                periodStart.getMonth().toString().substring(0, 3), periodStart.getDayOfMonth(),
                periodEnd.getMonth().toString().substring(0, 3), periodEnd.getDayOfMonth(),
                year);
        }
        return String.format("Fortnight %d, %d", fortnight, year);
    }

    /**
     * For backwards compatibility - returns fortnight as "month" equivalent
     * Maps fortnights 1-2 to month 1, 3-4 to month 2, etc.
     */
    public Integer getMonth() {
        return (fortnight + 1) / 2;
    }
}

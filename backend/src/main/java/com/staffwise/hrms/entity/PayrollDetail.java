package com.staffwise.hrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;

/**
 * PayrollDetail entity for Papua New Guinea payroll.
 * Tracks earnings, Salary and Wages Tax (SWT), and Superannuation.
 */
@Entity
@Table(name = "payroll_details")
@SequenceGenerator(name = "seq_generator", sequenceName = "payroll_detail_seq", allocationSize = 1)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class PayrollDetail extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_run_id", nullable = false)
    private PayrollRun payrollRun;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    // ============ EARNINGS (in Kina) ============
    
    @Column(name = "basic_salary", nullable = false)
    private Double basicSalary;

    @Column(name = "housing_allowance")
    @Builder.Default
    private Double housingAllowance = 0.0;

    @Column(name = "transport_allowance")
    @Builder.Default
    private Double transportAllowance = 0.0;

    @Column(name = "meal_allowance")
    @Builder.Default
    private Double mealAllowance = 0.0;

    @Column(name = "special_allowance")
    @Builder.Default
    private Double specialAllowance = 0.0;

    @Column(name = "overtime_pay")
    @Builder.Default
    private Double overtimePay = 0.0;

    @Column(name = "bonus")
    @Builder.Default
    private Double bonus = 0.0;

    // Leave loading (typically 17.5% of annual leave pay in PNG)
    @Column(name = "leave_loading")
    @Builder.Default
    private Double leaveLoading = 0.0;

    // ============ STATUTORY DEDUCTIONS ============
    
    // Salary and Wages Tax (SWT) - withheld for IRC
    @Column(name = "salary_wages_tax")
    @Builder.Default
    private Double salaryWagesTax = 0.0;

    // Superannuation - Employee contribution (typically 6%)
    @Column(name = "super_employee")
    @Builder.Default
    private Double superEmployee = 0.0;

    // Superannuation - Employer contribution (typically 8.4%)
    @Column(name = "super_employer")
    @Builder.Default
    private Double superEmployer = 0.0;

    // Total superannuation (employee + employer)
    @Column(name = "super_total")
    @Builder.Default
    private Double superTotal = 0.0;

    // Legacy field for backwards compatibility
    @Column(name = "tax_deduction")
    @Builder.Default
    private Double taxDeduction = 0.0;

    // Legacy PF field (maps to superannuation)
    @Column(name = "pf_deduction")
    @Builder.Default
    private Double pfDeduction = 0.0;

    // ============ OTHER DEDUCTIONS ============
    
    @Column(name = "loan_deduction")
    @Builder.Default
    private Double loanDeduction = 0.0;

    @Column(name = "advance_deduction")
    @Builder.Default
    private Double advanceDeduction = 0.0;

    @Column(name = "other_deductions")
    @Builder.Default
    private Double otherDeductions = 0.0;

    @Column(name = "leave_deduction")
    @Builder.Default
    private Double leaveDeduction = 0.0;

    @Column(name = "late_deduction")
    @Builder.Default
    private Double lateDeduction = 0.0;

    // ============ TAX COMPUTATION DETAILS ============
    
    // Gross taxable income (fortnightly)
    @Column(name = "taxable_income")
    @Builder.Default
    private Double taxableIncome = 0.0;

    // Projected annual income for tax calculation
    @Column(name = "projected_annual_income")
    @Builder.Default
    private Double projectedAnnualIncome = 0.0;

    // Whether employee is tax resident
    @Column(name = "is_tax_resident")
    @Builder.Default
    private Boolean isTaxResident = true;

    // ============ ATTENDANCE DATA ============
    
    @Column(name = "total_working_days")
    private Integer totalWorkingDays;

    @Column(name = "days_worked")
    private Integer daysWorked;

    @Column(name = "leaves_taken")
    @Builder.Default
    private Double leavesTaken = 0.0;

    @Column(name = "approved_overtime_hours")
    @Builder.Default
    private Double approvedOvertimeHours = 0.0;

    @Column(name = "late_count")
    @Builder.Default
    private Integer lateCount = 0;

    // ============ COMPUTED FIELDS ============
    
    @Column(name = "gross_salary", nullable = false)
    private Double grossSalary;

    @Column(name = "total_deductions", nullable = false)
    private Double totalDeductions;

    @Column(name = "net_pay", nullable = false)
    private Double netPay;

    // Cost to Company (gross + employer super)
    @Column(name = "ctc")
    @Builder.Default
    private Double ctc = 0.0;

    @Column(length = 500)
    private String remarks;

    // Legacy fields for compatibility
    @Column(name = "hra")
    @Builder.Default
    private Double hra = 0.0;

    @Column(name = "medical_allowance")
    @Builder.Default
    private Double medicalAllowance = 0.0;

    @Column(name = "insurance_deduction")
    @Builder.Default
    private Double insuranceDeduction = 0.0;

    /**
     * Calculate all totals for PNG payroll
     */
    public void calculateTotals() {
        // Calculate gross salary (all earnings) - use housingAllowance, ignore legacy hra
        this.grossSalary = basicSalary + housingAllowance + transportAllowance + mealAllowance 
                         + specialAllowance + overtimePay + bonus + leaveLoading;
        
        // For backwards compatibility
        this.taxDeduction = salaryWagesTax;
        this.pfDeduction = superEmployee;
        
        // Calculate total superannuation
        this.superTotal = superEmployee + superEmployer;
        
        // Calculate total deductions (employee portion only for net pay)
        this.totalDeductions = salaryWagesTax + superEmployee + loanDeduction 
                             + advanceDeduction + otherDeductions + leaveDeduction + lateDeduction;
        
        // Calculate net pay (what employee receives)
        this.netPay = grossSalary - totalDeductions;
        
        // Calculate CTC (Cost to Company)
        this.ctc = grossSalary + superEmployer;
    }
}


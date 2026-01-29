package com.staffwise.hrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;

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

    // Earnings
    @Column(name = "basic_salary", nullable = false)
    private Double basicSalary;

    @Column(name = "hra")
    @Builder.Default
    private Double hra = 0.0;

    @Column(name = "transport_allowance")
    @Builder.Default
    private Double transportAllowance = 0.0;

    @Column(name = "medical_allowance")
    @Builder.Default
    private Double medicalAllowance = 0.0;

    @Column(name = "special_allowance")
    @Builder.Default
    private Double specialAllowance = 0.0;

    @Column(name = "overtime_pay")
    @Builder.Default
    private Double overtimePay = 0.0;

    @Column(name = "bonus")
    @Builder.Default
    private Double bonus = 0.0;

    // Deductions
    @Column(name = "pf_deduction")
    @Builder.Default
    private Double pfDeduction = 0.0;

    @Column(name = "tax_deduction")
    @Builder.Default
    private Double taxDeduction = 0.0;

    @Column(name = "insurance_deduction")
    @Builder.Default
    private Double insuranceDeduction = 0.0;

    @Column(name = "loan_deduction")
    @Builder.Default
    private Double loanDeduction = 0.0;

    @Column(name = "other_deductions")
    @Builder.Default
    private Double otherDeductions = 0.0;

    @Column(name = "leave_deduction")
    @Builder.Default
    private Double leaveDeduction = 0.0;

    @Column(name = "late_deduction")
    @Builder.Default
    private Double lateDeduction = 0.0;

    // Attendance Data
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

    // Computed Fields
    @Column(name = "gross_salary", nullable = false)
    private Double grossSalary;

    @Column(name = "total_deductions", nullable = false)
    private Double totalDeductions;

    @Column(name = "net_pay", nullable = false)
    private Double netPay;

    @Column(length = 500)
    private String remarks;

    public void calculateTotals() {
        this.grossSalary = basicSalary + hra + transportAllowance + medicalAllowance 
                         + specialAllowance + overtimePay + bonus;
        
        this.totalDeductions = pfDeduction + taxDeduction + insuranceDeduction 
                             + loanDeduction + otherDeductions + leaveDeduction + lateDeduction;
        
        this.netPay = grossSalary - totalDeductions;
    }
}

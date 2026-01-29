package com.staffwise.hrms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollDetailDTO {
    private Long id;
    private Long payrollRunId;
    private Long employeeId;
    private String employeeName;
    private String empCode;
    private String department;
    
    // Earnings
    private Double basicSalary;
    private Double hra;
    private Double transportAllowance;
    private Double medicalAllowance;
    private Double specialAllowance;
    private Double overtimePay;
    private Double bonus;
    
    // Deductions
    private Double pfDeduction;
    private Double taxDeduction;
    private Double insuranceDeduction;
    private Double loanDeduction;
    private Double otherDeductions;
    private Double leaveDeduction;
    private Double lateDeduction;
    
    // Attendance
    private Integer totalWorkingDays;
    private Integer daysWorked;
    private Double leavesTaken;
    private Double approvedOvertimeHours;
    private Integer lateCount;
    
    // Totals
    private Double grossSalary;
    private Double totalDeductions;
    private Double netPay;
    
    private String remarks;
    private String period;
    private String status;
}

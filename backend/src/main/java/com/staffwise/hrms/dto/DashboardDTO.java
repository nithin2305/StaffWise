package com.staffwise.hrms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardDTO {
    private Long totalEmployees;
    private Long activeEmployees;
    private Long pendingLeaveRequests;
    private Long pendingOvertimeRequests;
    private Long pendingLateRequests;
    private Double totalPayrollThisMonth;
    private Integer payrollsPendingApproval;
    private Integer payrollsProcessedThisYear;
}

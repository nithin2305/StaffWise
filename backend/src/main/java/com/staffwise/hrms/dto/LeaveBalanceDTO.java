package com.staffwise.hrms.dto;

import com.staffwise.hrms.entity.LeaveType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveBalanceDTO {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private LeaveType leaveType;
    private Integer year;
    private Double totalLeaves;
    private Double usedLeaves;
    private Double pendingLeaves;
    private Double carriedForward;
    private Double availableLeaves;
}

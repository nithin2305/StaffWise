package com.staffwise.hrms.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    
    // Alias fields for frontend compatibility
    @JsonProperty("balance")
    public Double getBalance() {
        return availableLeaves != null ? availableLeaves : 0.0;
    }
    
    @JsonProperty("entitled")
    public Double getEntitled() {
        return totalLeaves != null ? totalLeaves : 0.0;
    }
    
    @JsonProperty("used")
    public Double getUsed() {
        return usedLeaves != null ? usedLeaves : 0.0;
    }
}

package com.staffwise.hrms.dto;

import com.staffwise.hrms.entity.LeaveType;
import com.staffwise.hrms.entity.RequestStatus;
import com.staffwise.hrms.entity.RequestType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestDTO {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String empCode;
    
    @NotNull(message = "Request type is required")
    private RequestType requestType;
    
    private RequestStatus status;
    
    // Leave fields
    private LeaveType leaveType;
    private LocalDate fromDate;
    private LocalDate toDate;
    private Double totalDays;
    
    // Late coming fields
    private LocalDate lateDate;
    private String lateTime;
    
    // Overtime fields
    private LocalDate overtimeDate;
    private Double overtimeHours;
    
    @NotNull(message = "Reason is required")
    private String reason;
    
    private Long approvedById;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private String rejectionReason;
    private LocalDateTime createdAt;
}

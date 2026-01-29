package com.staffwise.hrms.dto;

import com.staffwise.hrms.entity.PayrollStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollRunDTO {
    private Long id;
    private Integer month;
    private Integer year;
    private String period;
    private PayrollStatus status;
    private LocalDateTime runDate;
    private Integer totalEmployees;
    private Double totalGross;
    private Double totalDeductions;
    private Double totalNetPay;
    
    private String computedBy;
    private LocalDateTime computedAt;
    private String checkedBy;
    private LocalDateTime checkedAt;
    private String checkerRemarks;
    private String authorizedBy;
    private LocalDateTime authorizedAt;
    private String authorizationRemarks;
    private String processedBy;
    private LocalDateTime processedAt;
    private Boolean isLocked;
    
    private List<PayrollDetailDTO> payrollDetails;
}

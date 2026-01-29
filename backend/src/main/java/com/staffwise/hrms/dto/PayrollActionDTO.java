package com.staffwise.hrms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollActionDTO {
    private Long payrollRunId;
    private String remarks;
    private String action; // CHECK, REJECT, AUTHORIZE, PROCESS
}

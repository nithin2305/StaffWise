package com.staffwise.hrms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentDTO {
    private Long id;
    private String deptCode;
    private String name;
    private String description;
    private Long headId;
    private String headName;
    private Integer employeeCount;
    private Boolean isActive;
}

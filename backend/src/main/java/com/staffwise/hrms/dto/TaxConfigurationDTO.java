package com.staffwise.hrms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for Tax Configuration (PNG)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxConfigurationDTO {
    private Long id;
    private String financialYear;
    private LocalDate startDate;
    private LocalDate endDate;
    
    // Superannuation rates
    private Double superEmployeePercentage;
    private Double superEmployerPercentage;
    private Double superMinimumSalary;
    
    // Tax settings
    private Double taxFreeThreshold;
    private Boolean defaultResidentStatus;
    
    // Other settings
    private String currencyCode;
    private Integer fortnightsPerYear;
    private Boolean isActive;
    private String description;
    
    // Tax slabs
    private List<TaxSlabDTO> taxSlabs;
}

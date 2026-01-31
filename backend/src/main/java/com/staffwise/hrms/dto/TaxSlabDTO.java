package com.staffwise.hrms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Tax Slab (PNG SWT rates)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxSlabDTO {
    private Long id;
    private Long taxConfigurationId;
    
    // Income range (in Kina)
    private Double incomeFrom;
    private Double incomeTo;  // null means unlimited
    
    // Tax rate (as decimal, e.g., 0.22 for 22%)
    private Double taxRate;
    
    // Display order
    private Integer slabOrder;
    
    // Resident or non-resident slab
    private Boolean isResident;
    
    // Description for display
    private String description;
}

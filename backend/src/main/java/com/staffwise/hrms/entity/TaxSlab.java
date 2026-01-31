package com.staffwise.hrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;

/**
 * Tax Slab entity for PNG Salary and Wages Tax (SWT) calculation.
 * Defines progressive tax rates based on income brackets.
 * 
 * PNG SWT Rates (Resident):
 * - K0 - K12,500: 0%
 * - K12,501 - K20,000: 22%
 * - K20,001 - K33,000: 30%
 * - K33,001 - K70,000: 35%
 * - K70,001 - K250,000: 40%
 * - Over K250,000: 42%
 */
@Entity
@Table(name = "tax_slabs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class TaxSlab extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tax_configuration_id", nullable = false)
    private TaxConfiguration taxConfiguration;

    // Income range start (inclusive) in Kina
    @Column(name = "income_from", nullable = false)
    private Double incomeFrom;

    // Income range end (inclusive, null means unlimited)
    @Column(name = "income_to")
    private Double incomeTo;

    // Tax rate for this slab (as decimal, e.g., 0.22 for 22%)
    @Column(name = "tax_rate", nullable = false)
    private Double taxRate;

    // Display order for the slab
    @Column(name = "slab_order")
    @Builder.Default
    private Integer slabOrder = 0;

    // Whether this is for resident (true) or non-resident (false)
    @Column(name = "is_resident")
    @Builder.Default
    private Boolean isResident = true;

    // Description (e.g., "22% on income between K12,501 to K20,000")
    @Column(name = "description", length = 200)
    private String description;
}

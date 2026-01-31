package com.staffwise.hrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Tax Configuration entity for Papua New Guinea (PNG) tax system.
 * Supports Salary and Wages Tax (SWT) and Superannuation deductions.
 */
@Entity
@Table(name = "tax_configurations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class TaxConfiguration extends BaseEntity {

    @Column(name = "financial_year", nullable = false, unique = true)
    private String financialYear; // e.g., "2025"

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    // ============ SUPERANNUATION (PNG National Superannuation Fund - NASFUND/Nambawan Super) ============
    
    // Employee Superannuation Contribution (typically 6%)
    @Column(name = "super_employee_percentage")
    @Builder.Default
    private Double superEmployeePercentage = 0.06;

    // Employer Superannuation Contribution (typically 8.4%)
    @Column(name = "super_employer_percentage")
    @Builder.Default
    private Double superEmployerPercentage = 0.084;

    // Minimum salary for superannuation deduction
    @Column(name = "super_minimum_salary")
    @Builder.Default
    private Double superMinimumSalary = 0.0;

    // ============ SALARY AND WAGES TAX (SWT) ============
    
    // Tax-free threshold (annual) - K12,500 for residents
    @Column(name = "tax_free_threshold")
    @Builder.Default
    private Double taxFreeThreshold = 12500.0;

    // Whether employee is resident for tax purposes (affects rates)
    @Column(name = "default_resident_status")
    @Builder.Default
    private Boolean defaultResidentStatus = true;

    // ============ OTHER SETTINGS ============

    @Column(name = "currency_code")
    @Builder.Default
    private String currencyCode = "PGK"; // Papua New Guinea Kina

    @Column(name = "fortnights_per_year")
    @Builder.Default
    private Integer fortnightsPerYear = 26;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "description", length = 500)
    private String description;

    // Tax slabs for this configuration (SWT rates)
    @OneToMany(mappedBy = "taxConfiguration", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TaxSlab> taxSlabs = new ArrayList<>();
}


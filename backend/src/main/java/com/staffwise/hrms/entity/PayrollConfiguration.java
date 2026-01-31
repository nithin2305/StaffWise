package com.staffwise.hrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

/**
 * Payroll Configuration entity for storing configurable payroll rates.
 * All values that affect payroll computation should be stored here - NO HARDCODING!
 */
@Entity
@Table(name = "payroll_configurations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class PayrollConfiguration extends BaseEntity {

    @Column(name = "config_name", nullable = false, unique = true)
    private String configName;  // e.g., "DEFAULT", "2025", "2026"

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    // ============ OVERTIME CONFIGURATION ============
    
    // Overtime rate multiplier (e.g., 1.5 for time-and-a-half)
    @Column(name = "overtime_rate_multiplier")
    @Builder.Default
    private Double overtimeRateMultiplier = 1.5;

    // Weekend overtime rate multiplier (e.g., 2.0 for double time)
    @Column(name = "weekend_overtime_multiplier")
    @Builder.Default
    private Double weekendOvertimeMultiplier = 2.0;

    // Public holiday overtime rate multiplier
    @Column(name = "holiday_overtime_multiplier")
    @Builder.Default
    private Double holidayOvertimeMultiplier = 2.5;

    // ============ DEDUCTION RATES ============
    
    // Late deduction per occurrence (in Kina)
    @Column(name = "late_deduction_amount")
    @Builder.Default
    private Double lateDeductionAmount = 50.0;

    // Absent deduction - whether to deduct full day salary
    @Column(name = "deduct_absent_days")
    @Builder.Default
    private Boolean deductAbsentDays = true;

    // ============ WORKING DAYS CONFIGURATION ============
    
    // Standard working hours per day
    @Column(name = "standard_hours_per_day")
    @Builder.Default
    private Double standardHoursPerDay = 8.0;

    // Working days in a fortnight (typically 10 for Mon-Fri)
    @Column(name = "working_days_per_fortnight")
    @Builder.Default
    private Integer workingDaysPerFortnight = 10;

    // Fortnights per year
    @Column(name = "fortnights_per_year")
    @Builder.Default
    private Integer fortnightsPerYear = 26;

    // ============ ROUNDING CONFIGURATION ============
    
    // Whether to round net pay
    @Column(name = "round_net_pay")
    @Builder.Default
    private Boolean roundNetPay = true;

    // Rounding precision (0 = whole number, 2 = two decimals)
    @Column(name = "rounding_precision")
    @Builder.Default
    private Integer roundingPrecision = 2;

    // ============ STATUS ============
    
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "description", length = 500)
    private String description;
}

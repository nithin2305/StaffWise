package com.staffwise.hrms.service;

import com.staffwise.hrms.entity.TaxConfiguration;
import com.staffwise.hrms.entity.TaxSlab;
import com.staffwise.hrms.repository.TaxConfigurationRepository;
import com.staffwise.hrms.repository.TaxSlabRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Service for Papua New Guinea tax calculations.
 * Handles Salary and Wages Tax (SWT) and Superannuation calculations.
 * 
 * PNG Tax System:
 * - Salary and Wages Tax (SWT) - Progressive tax on income
 * - Superannuation - Employee (6%) + Employer (8.4%) contributions
 * - Tax is paid fortnightly (26 pay periods per year)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TaxService {

    private final TaxConfigurationRepository taxConfigurationRepository;
    private final TaxSlabRepository taxSlabRepository;

    // PNG Default values
    private static final double DEFAULT_SUPER_EMPLOYEE_RATE = 0.06;  // 6%
    private static final double DEFAULT_SUPER_EMPLOYER_RATE = 0.084; // 8.4%
    private static final double DEFAULT_TAX_FREE_THRESHOLD = 12500.0; // K12,500 annual
    private static final int FORTNIGHTS_PER_YEAR = 26;

    /**
     * Tax calculation result for PNG payroll
     */
    public static class TaxResult {
        public double salaryWagesTax;    // SWT deducted
        public double superEmployee;      // Employee superannuation
        public double superEmployer;      // Employer superannuation
        public double superTotal;         // Total super contribution
        public double taxableIncome;      // Fortnightly taxable income
        public double projectedAnnualIncome; // Projected annual for tax calc
        public boolean isResident;        // Tax residency status
    }

    /**
     * Get active tax configuration for a given date
     */
    public Optional<TaxConfiguration> getActiveConfiguration(LocalDate date) {
        return taxConfigurationRepository.findActiveConfigurationForDate(date);
    }

    /**
     * Get current active tax configuration
     */
    public Optional<TaxConfiguration> getCurrentConfiguration() {
        return taxConfigurationRepository.findCurrentActiveConfiguration();
    }

    /**
     * Calculate PNG taxes for fortnightly payroll
     * 
     * @param fortnightlyGross Fortnightly gross salary in Kina
     * @param isResident Whether employee is a PNG tax resident
     * @param payDate The date of payment for configuration lookup
     * @return TaxResult with SWT and Superannuation amounts
     */
    public TaxResult calculateFortnightlyTax(double fortnightlyGross, boolean isResident, LocalDate payDate) {
        TaxResult result = new TaxResult();
        result.isResident = isResident;
        result.taxableIncome = fortnightlyGross;

        // Get tax configuration
        TaxConfiguration config = getActiveConfiguration(payDate)
                .orElse(getDefaultConfiguration());

        // Project annual income for tax calculation
        double annualGross = fortnightlyGross * FORTNIGHTS_PER_YEAR;
        result.projectedAnnualIncome = annualGross;

        // Calculate annual SWT using progressive tax slabs
        double annualSwt = calculateSwtFromSlabs(annualGross, config, isResident);

        // Convert to fortnightly SWT
        result.salaryWagesTax = annualSwt / FORTNIGHTS_PER_YEAR;

        // Calculate Superannuation
        double superEmployeeRate = config.getSuperEmployeePercentage();
        double superEmployerRate = config.getSuperEmployerPercentage();

        result.superEmployee = fortnightlyGross * superEmployeeRate;
        result.superEmployer = fortnightlyGross * superEmployerRate;
        result.superTotal = result.superEmployee + result.superEmployer;

        log.debug("PNG Tax calculated for fortnightly gross K{}: SWT = K{}, Super Employee = K{}, Super Employer = K{}", 
                fortnightlyGross, result.salaryWagesTax, result.superEmployee, result.superEmployer);

        return result;
    }

    /**
     * Calculate Salary and Wages Tax using progressive slabs
     * 
     * PNG SWT Rates (Resident) 2024:
     * - K0 - K12,500: 0%
     * - K12,501 - K20,000: 22%
     * - K20,001 - K33,000: 30%
     * - K33,001 - K70,000: 35%
     * - K70,001 - K250,000: 40%
     * - Over K250,000: 42%
     * 
     * Non-resident: Flat 22% on all income
     */
    private double calculateSwtFromSlabs(double annualIncome, TaxConfiguration config, boolean isResident) {
        // Non-residents pay flat 22% on all income
        if (!isResident) {
            return annualIncome * 0.22;
        }

        // Get tax slabs from configuration
        List<TaxSlab> slabs = taxSlabRepository.findByConfigurationAndRegime(config.getId(), isResident);
        
        if (slabs.isEmpty()) {
            // Use default PNG resident slabs
            return calculateSwtWithDefaultSlabs(annualIncome);
        }

        double totalTax = 0;
        
        for (TaxSlab slab : slabs) {
            double slabLower = slab.getIncomeFrom();
            double slabUpper = slab.getIncomeTo() != null ? slab.getIncomeTo() : Double.MAX_VALUE;
            
            if (annualIncome > slabLower) {
                double taxableInSlab;
                if (annualIncome >= slabUpper) {
                    taxableInSlab = slabUpper - slabLower;
                } else {
                    taxableInSlab = annualIncome - slabLower;
                }
                totalTax += taxableInSlab * slab.getTaxRate();
            }
        }

        return totalTax;
    }

    /**
     * Default PNG SWT slabs for residents (2024 rates)
     */
    private double calculateSwtWithDefaultSlabs(double annualIncome) {
        double tax = 0;
        
        // K0 - K12,500: 0%
        // No tax on first K12,500
        
        // K12,501 - K20,000: 22%
        if (annualIncome > 12500) {
            tax += Math.min(annualIncome - 12500, 7500) * 0.22;
        }
        
        // K20,001 - K33,000: 30%
        if (annualIncome > 20000) {
            tax += Math.min(annualIncome - 20000, 13000) * 0.30;
        }
        
        // K33,001 - K70,000: 35%
        if (annualIncome > 33000) {
            tax += Math.min(annualIncome - 33000, 37000) * 0.35;
        }
        
        // K70,001 - K250,000: 40%
        if (annualIncome > 70000) {
            tax += Math.min(annualIncome - 70000, 180000) * 0.40;
        }
        
        // Over K250,000: 42%
        if (annualIncome > 250000) {
            tax += (annualIncome - 250000) * 0.42;
        }

        return tax;
    }

    /**
     * Get default configuration if none exists in DB
     */
    private TaxConfiguration getDefaultConfiguration() {
        return TaxConfiguration.builder()
                .financialYear("DEFAULT")
                .startDate(LocalDate.of(2024, 1, 1))
                .endDate(LocalDate.of(2024, 12, 31))
                .superEmployeePercentage(DEFAULT_SUPER_EMPLOYEE_RATE)
                .superEmployerPercentage(DEFAULT_SUPER_EMPLOYER_RATE)
                .taxFreeThreshold(DEFAULT_TAX_FREE_THRESHOLD)
                .defaultResidentStatus(true)
                .currencyCode("PGK")
                .fortnightsPerYear(FORTNIGHTS_PER_YEAR)
                .isActive(true)
                .build();
    }

    /**
     * Create or update tax configuration
     */
    public TaxConfiguration saveTaxConfiguration(TaxConfiguration config) {
        return taxConfigurationRepository.save(config);
    }

    /**
     * Initialize default PNG tax slabs for a configuration
     */
    public void initializeDefaultTaxSlabs(TaxConfiguration config) {
        // Resident slabs
        List<TaxSlab> residentSlabs = List.of(
            TaxSlab.builder()
                .taxConfiguration(config)
                .incomeFrom(0.0)
                .incomeTo(12500.0)
                .taxRate(0.0)
                .slabOrder(1)
                .isResident(true)
                .description("Tax-free threshold: K0 - K12,500")
                .build(),
            TaxSlab.builder()
                .taxConfiguration(config)
                .incomeFrom(12500.0)
                .incomeTo(20000.0)
                .taxRate(0.22)
                .slabOrder(2)
                .isResident(true)
                .description("22% on K12,501 - K20,000")
                .build(),
            TaxSlab.builder()
                .taxConfiguration(config)
                .incomeFrom(20000.0)
                .incomeTo(33000.0)
                .taxRate(0.30)
                .slabOrder(3)
                .isResident(true)
                .description("30% on K20,001 - K33,000")
                .build(),
            TaxSlab.builder()
                .taxConfiguration(config)
                .incomeFrom(33000.0)
                .incomeTo(70000.0)
                .taxRate(0.35)
                .slabOrder(4)
                .isResident(true)
                .description("35% on K33,001 - K70,000")
                .build(),
            TaxSlab.builder()
                .taxConfiguration(config)
                .incomeFrom(70000.0)
                .incomeTo(250000.0)
                .taxRate(0.40)
                .slabOrder(5)
                .isResident(true)
                .description("40% on K70,001 - K250,000")
                .build(),
            TaxSlab.builder()
                .taxConfiguration(config)
                .incomeFrom(250000.0)
                .incomeTo(null) // No upper limit
                .taxRate(0.42)
                .slabOrder(6)
                .isResident(true)
                .description("42% on income over K250,000")
                .build()
        );

        // Non-resident slab (flat 22%)
        TaxSlab nonResidentSlab = TaxSlab.builder()
                .taxConfiguration(config)
                .incomeFrom(0.0)
                .incomeTo(null)
                .taxRate(0.22)
                .slabOrder(1)
                .isResident(false)
                .description("Non-resident: Flat 22% on all income")
                .build();

        // Save all slabs
        for (TaxSlab slab : residentSlabs) {
            taxSlabRepository.save(slab);
        }
        taxSlabRepository.save(nonResidentSlab);

        log.info("Initialized default PNG tax slabs for configuration: {}", config.getFinancialYear());
    }

    /**
     * Calculate tax summary for a payroll run (for reporting)
     */
    public TaxSummary calculatePayrollTaxSummary(List<Double> employeeGrosses, LocalDate payDate) {
        TaxSummary summary = new TaxSummary();
        
        for (Double gross : employeeGrosses) {
            TaxResult result = calculateFortnightlyTax(gross, true, payDate);
            summary.totalSwt += result.salaryWagesTax;
            summary.totalSuperEmployee += result.superEmployee;
            summary.totalSuperEmployer += result.superEmployer;
        }
        
        summary.totalSuper = summary.totalSuperEmployee + summary.totalSuperEmployer;
        return summary;
    }

    /**
     * Tax summary for payroll run
     */
    public static class TaxSummary {
        public double totalSwt = 0;
        public double totalSuperEmployee = 0;
        public double totalSuperEmployer = 0;
        public double totalSuper = 0;
    }
}

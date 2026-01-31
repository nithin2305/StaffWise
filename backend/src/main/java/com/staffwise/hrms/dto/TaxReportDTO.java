package com.staffwise.hrms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for Tax Report generation - used for government remittance
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxReportDTO {

    // Report period
    private String period;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private Integer fortnight;
    private Integer year;

    // Summary totals for government remittance
    private Double totalIncomeTax;
    private Double totalEducationCess;
    private Double totalSurcharge;
    private Double totalTds;
    private Double totalProfessionalTax;
    private Double totalPfEmployee;
    private Double totalPfEmployer;
    private Double totalPfContribution; // Employee + Employer
    private Double totalEsiEmployee;
    private Double totalEsiEmployer;
    private Double totalEsiContribution; // Employee + Employer

    // Gross totals
    private Double totalGrossSalary;
    private Double totalNetPay;
    private Integer totalEmployees;

    // Remittance status
    private Boolean tdsRemitted;
    private LocalDate tdsRemittanceDate;
    private String tdsChallanNumber;
    private Boolean pfRemitted;
    private LocalDate pfRemittanceDate;
    private String pfChallanNumber;

    // Employee-wise breakdown
    private List<EmployeeTaxDetailDTO> employeeTaxDetails;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmployeeTaxDetailDTO {
        private Long employeeId;
        private String employeeName;
        private String empCode;
        private String panNumber;
        private String department;
        
        private Double grossSalary;
        private Double basicSalary;
        private Double hra;
        
        private Double incomeTax;
        private Double educationCess;
        private Double surcharge;
        private Double totalTds;
        private Double professionalTax;
        
        private Double pfEmployee;
        private Double pfEmployer;
        private Double esiEmployee;
        private Double esiEmployer;
        
        private Double taxableIncome;
        private Double projectedAnnualIncome;
        private Boolean newTaxRegime;
        
        private Double netPay;
    }
}

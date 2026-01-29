package com.staffwise.hrms.service;

import com.staffwise.hrms.dto.PayrollDetailDTO;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayslipPdfService {

    public byte[] generatePayslip(PayrollDetailDTO payroll) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // Title
            Paragraph title = new Paragraph("PAYSLIP")
                    .setFontSize(20)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER);
            document.add(title);

            // Company name
            Paragraph company = new Paragraph("StaffWise HRMS")
                    .setFontSize(14)
                    .setTextAlignment(TextAlignment.CENTER);
            document.add(company);

            // Period
            Paragraph period = new Paragraph("Pay Period: " + payroll.getPeriod())
                    .setFontSize(12)
                    .setTextAlignment(TextAlignment.CENTER);
            document.add(period);

            document.add(new Paragraph("\n"));

            // Employee Details
            Table empTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}));
            empTable.setWidth(UnitValue.createPercentValue(100));
            
            addTableRow(empTable, "Employee Name:", payroll.getEmployeeName());
            addTableRow(empTable, "Employee Code:", payroll.getEmpCode());
            addTableRow(empTable, "Department:", payroll.getDepartment() != null ? payroll.getDepartment() : "N/A");
            addTableRow(empTable, "Days Worked:", String.valueOf(payroll.getDaysWorked()));
            addTableRow(empTable, "Total Working Days:", String.valueOf(payroll.getTotalWorkingDays()));
            
            document.add(empTable);
            document.add(new Paragraph("\n"));

            // Earnings Section
            document.add(new Paragraph("EARNINGS").setBold().setFontSize(12));
            Table earningsTable = new Table(UnitValue.createPercentArray(new float[]{3, 1}));
            earningsTable.setWidth(UnitValue.createPercentValue(100));
            
            addAmountRow(earningsTable, "Basic Salary", payroll.getBasicSalary());
            addAmountRow(earningsTable, "HRA", payroll.getHra());
            addAmountRow(earningsTable, "Transport Allowance", payroll.getTransportAllowance());
            addAmountRow(earningsTable, "Medical Allowance", payroll.getMedicalAllowance());
            addAmountRow(earningsTable, "Special Allowance", payroll.getSpecialAllowance());
            addAmountRow(earningsTable, "Overtime Pay", payroll.getOvertimePay());
            addAmountRow(earningsTable, "Bonus", payroll.getBonus());
            
            Cell grossCell = new Cell().add(new Paragraph("Gross Salary").setBold());
            Cell grossAmtCell = new Cell().add(new Paragraph(formatAmount(payroll.getGrossSalary())).setBold())
                    .setTextAlignment(TextAlignment.RIGHT);
            earningsTable.addCell(grossCell);
            earningsTable.addCell(grossAmtCell);
            
            document.add(earningsTable);
            document.add(new Paragraph("\n"));

            // Deductions Section
            document.add(new Paragraph("DEDUCTIONS").setBold().setFontSize(12));
            Table deductionsTable = new Table(UnitValue.createPercentArray(new float[]{3, 1}));
            deductionsTable.setWidth(UnitValue.createPercentValue(100));
            
            addAmountRow(deductionsTable, "PF Deduction", payroll.getPfDeduction());
            addAmountRow(deductionsTable, "Tax Deduction", payroll.getTaxDeduction());
            addAmountRow(deductionsTable, "Insurance Deduction", payroll.getInsuranceDeduction());
            addAmountRow(deductionsTable, "Loan Deduction", payroll.getLoanDeduction());
            addAmountRow(deductionsTable, "Leave Deduction", payroll.getLeaveDeduction());
            addAmountRow(deductionsTable, "Late Deduction", payroll.getLateDeduction());
            addAmountRow(deductionsTable, "Other Deductions", payroll.getOtherDeductions());
            
            Cell totalDedCell = new Cell().add(new Paragraph("Total Deductions").setBold());
            Cell totalDedAmtCell = new Cell().add(new Paragraph(formatAmount(payroll.getTotalDeductions())).setBold())
                    .setTextAlignment(TextAlignment.RIGHT);
            deductionsTable.addCell(totalDedCell);
            deductionsTable.addCell(totalDedAmtCell);
            
            document.add(deductionsTable);
            document.add(new Paragraph("\n"));

            // Net Pay
            Table netPayTable = new Table(UnitValue.createPercentArray(new float[]{3, 1}));
            netPayTable.setWidth(UnitValue.createPercentValue(100));
            
            Cell netPayLabelCell = new Cell()
                    .add(new Paragraph("NET PAY").setBold().setFontSize(14))
                    .setBackgroundColor(ColorConstants.LIGHT_GRAY);
            Cell netPayAmtCell = new Cell()
                    .add(new Paragraph(formatAmount(payroll.getNetPay())).setBold().setFontSize(14))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setBackgroundColor(ColorConstants.LIGHT_GRAY);
            netPayTable.addCell(netPayLabelCell);
            netPayTable.addCell(netPayAmtCell);
            
            document.add(netPayTable);

            // Footer
            document.add(new Paragraph("\n\n"));
            document.add(new Paragraph("This is a computer-generated payslip and does not require a signature.")
                    .setFontSize(8)
                    .setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("Generated on: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss")))
                    .setFontSize(8)
                    .setTextAlignment(TextAlignment.CENTER));

            document.close();
            
            log.info("Payslip PDF generated for employee: {}", payroll.getEmpCode());
            return baos.toByteArray();
            
        } catch (Exception e) {
            log.error("Error generating payslip PDF", e);
            throw new RuntimeException("Failed to generate payslip PDF", e);
        }
    }

    private void addTableRow(Table table, String label, String value) {
        table.addCell(new Cell().add(new Paragraph(label).setBold()));
        table.addCell(new Cell().add(new Paragraph(value != null ? value : "")));
    }

    private void addAmountRow(Table table, String label, Double amount) {
        table.addCell(new Cell().add(new Paragraph(label)));
        table.addCell(new Cell().add(new Paragraph(formatAmount(amount))).setTextAlignment(TextAlignment.RIGHT));
    }

    private String formatAmount(Double amount) {
        if (amount == null) return "0.00";
        return String.format("%.2f", amount);
    }
}

package com.staffwise.hrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "payroll_runs")
@SequenceGenerator(name = "seq_generator", sequenceName = "payroll_run_seq", allocationSize = 1)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class PayrollRun extends BaseEntity {

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer year;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PayrollStatus status = PayrollStatus.COMPUTED;

    @Column(name = "run_date")
    private LocalDateTime runDate;

    @Column(name = "total_employees")
    private Integer totalEmployees;

    @Column(name = "total_gross")
    private Double totalGross;

    @Column(name = "total_deductions")
    private Double totalDeductions;

    @Column(name = "total_net_pay")
    private Double totalNetPay;

    @OneToMany(mappedBy = "payrollRun", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PayrollDetail> payrollDetails = new ArrayList<>();

    // Computed by
    @Column(name = "computed_by")
    private String computedBy;

    @Column(name = "computed_at")
    private LocalDateTime computedAt;

    // Checked by Payroll Checker
    @Column(name = "checked_by")
    private String checkedBy;

    @Column(name = "checked_at")
    private LocalDateTime checkedAt;

    @Column(name = "checker_remarks", length = 1000)
    private String checkerRemarks;

    // Authorized by Payroll Admin
    @Column(name = "authorized_by")
    private String authorizedBy;

    @Column(name = "authorized_at")
    private LocalDateTime authorizedAt;

    @Column(name = "authorization_remarks", length = 1000)
    private String authorizationRemarks;

    // Processed
    @Column(name = "processed_by")
    private String processedBy;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "is_locked")
    @Builder.Default
    private Boolean isLocked = false;

    public String getPeriod() {
        return String.format("%02d/%d", month, year);
    }
}

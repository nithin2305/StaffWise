package com.staffwise.hrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "leave_balances")
@SequenceGenerator(name = "seq_generator", sequenceName = "leave_balance_seq", allocationSize = 1)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class LeaveBalance extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(name = "leave_type", nullable = false)
    private LeaveType leaveType;

    @Column(name = "\"YEAR\"", nullable = false)
    private Integer year;

    @Column(name = "total_leaves", nullable = false)
    private Double totalLeaves;

    @Column(name = "used_leaves", nullable = false)
    @Builder.Default
    private Double usedLeaves = 0.0;

    @Column(name = "pending_leaves", nullable = false)
    @Builder.Default
    private Double pendingLeaves = 0.0;

    @Column(name = "carried_forward")
    @Builder.Default
    private Double carriedForward = 0.0;

    public Double getAvailableLeaves() {
        return totalLeaves + carriedForward - usedLeaves - pendingLeaves;
    }
}

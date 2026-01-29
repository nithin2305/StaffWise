package com.staffwise.hrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "departments")
@SequenceGenerator(name = "seq_generator", sequenceName = "department_seq", allocationSize = 1)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class Department extends BaseEntity {

    @Column(name = "dept_code", unique = true, nullable = false)
    private String deptCode;

    @Column(nullable = false)
    private String name;

    @Column(length = 500)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "head_id")
    private Employee head;

    @OneToMany(mappedBy = "department")
    @Builder.Default
    private Set<Employee> employees = new HashSet<>();

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}

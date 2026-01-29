package com.staffwise.hrms.repository;

import com.staffwise.hrms.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    Optional<Department> findByDeptCode(String deptCode);

    Optional<Department> findByName(String name);

    boolean existsByDeptCode(String deptCode);

    boolean existsByName(String name);

    List<Department> findByIsActiveTrue();
}

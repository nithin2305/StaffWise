package com.staffwise.hrms.repository;

import com.staffwise.hrms.entity.Employee;
import com.staffwise.hrms.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByEmail(String email);

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.department WHERE e.email = :email")
    Optional<Employee> findByEmailWithDepartment(@Param("email") String email);

    Optional<Employee> findByEmpCode(String empCode);

    boolean existsByEmail(String email);

    boolean existsByEmpCode(String empCode);

    List<Employee> findByDepartmentId(Long departmentId);

    List<Employee> findByRole(Role role);

    List<Employee> findByIsActiveTrue();

    List<Employee> findByManagerId(Long managerId);

    @Query("SELECT e FROM Employee e WHERE e.department.id = :deptId AND e.isActive = true")
    List<Employee> findActiveByDepartment(@Param("deptId") Long departmentId);

    @Query("SELECT e FROM Employee e WHERE LOWER(e.firstName) LIKE LOWER(CONCAT('%', :name, '%')) " +
           "OR LOWER(e.lastName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Employee> searchByName(@Param("name") String name);

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.isActive = true")
    Long countActiveEmployees();
}

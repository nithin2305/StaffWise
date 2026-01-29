package com.staffwise.hrms.repository;

import com.staffwise.hrms.entity.EmployeeRequest;
import com.staffwise.hrms.entity.RequestStatus;
import com.staffwise.hrms.entity.RequestType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EmployeeRequestRepository extends JpaRepository<EmployeeRequest, Long> {

    List<EmployeeRequest> findByEmployeeId(Long employeeId);

    List<EmployeeRequest> findByEmployeeIdAndRequestType(Long employeeId, RequestType requestType);

    List<EmployeeRequest> findByRequestType(RequestType requestType);

    List<EmployeeRequest> findByStatus(RequestStatus status);

    List<EmployeeRequest> findByRequestTypeAndStatus(RequestType requestType, RequestStatus status);

    @Query("SELECT r FROM EmployeeRequest r WHERE r.requestType = 'LEAVE' AND r.status = 'SUBMITTED'")
    List<EmployeeRequest> findPendingLeaveRequests();

    @Query("SELECT r FROM EmployeeRequest r WHERE r.employee.id = :empId " +
           "AND r.requestType = 'LEAVE' AND r.status = 'APPROVED' " +
           "AND ((r.fromDate BETWEEN :startDate AND :endDate) OR (r.toDate BETWEEN :startDate AND :endDate))")
    List<EmployeeRequest> findApprovedLeavesInPeriod(@Param("empId") Long employeeId,
                                                      @Param("startDate") LocalDate startDate,
                                                      @Param("endDate") LocalDate endDate);

    @Query("SELECT r FROM EmployeeRequest r WHERE r.employee.id = :empId " +
           "AND r.requestType = 'OVERTIME' AND r.status = 'APPROVED' " +
           "AND r.overtimeDate BETWEEN :startDate AND :endDate AND r.includedInPayroll = false")
    List<EmployeeRequest> findApprovedOvertimeNotInPayroll(@Param("empId") Long employeeId,
                                                            @Param("startDate") LocalDate startDate,
                                                            @Param("endDate") LocalDate endDate);

    @Query("SELECT r FROM EmployeeRequest r WHERE r.employee.department.id = :deptId " +
           "AND r.requestType = :type AND r.status = 'SUBMITTED'")
    List<EmployeeRequest> findPendingByDepartmentAndType(@Param("deptId") Long departmentId,
                                                          @Param("type") RequestType requestType);

    @Query("SELECT COUNT(r) FROM EmployeeRequest r WHERE r.employee.id = :empId " +
           "AND r.requestType = 'LEAVE' AND r.status = 'SUBMITTED'")
    Long countPendingLeaves(@Param("empId") Long employeeId);
}

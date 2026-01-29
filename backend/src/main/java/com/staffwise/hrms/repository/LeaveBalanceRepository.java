package com.staffwise.hrms.repository;

import com.staffwise.hrms.entity.LeaveBalance;
import com.staffwise.hrms.entity.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {

    List<LeaveBalance> findByEmployeeId(Long employeeId);

    List<LeaveBalance> findByEmployeeIdAndYear(Long employeeId, Integer year);

    Optional<LeaveBalance> findByEmployeeIdAndLeaveTypeAndYear(Long employeeId, LeaveType leaveType, Integer year);

    @Query("SELECT lb FROM LeaveBalance lb WHERE lb.employee.id = :empId AND lb.year = :year")
    List<LeaveBalance> findCurrentYearBalances(@Param("empId") Long employeeId, @Param("year") Integer year);

    @Query("SELECT SUM(lb.totalLeaves - lb.usedLeaves - lb.pendingLeaves + lb.carriedForward) " +
           "FROM LeaveBalance lb WHERE lb.employee.id = :empId AND lb.year = :year")
    Double getTotalAvailableLeaves(@Param("empId") Long employeeId, @Param("year") Integer year);
}

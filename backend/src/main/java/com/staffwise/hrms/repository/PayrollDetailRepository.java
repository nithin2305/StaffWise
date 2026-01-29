package com.staffwise.hrms.repository;

import com.staffwise.hrms.entity.PayrollDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollDetailRepository extends JpaRepository<PayrollDetail, Long> {

    List<PayrollDetail> findByPayrollRunId(Long payrollRunId);

    Optional<PayrollDetail> findByPayrollRunIdAndEmployeeId(Long payrollRunId, Long employeeId);

    @Query("SELECT pd FROM PayrollDetail pd WHERE pd.employee.id = :empId " +
           "ORDER BY pd.payrollRun.year DESC, pd.payrollRun.month DESC")
    List<PayrollDetail> findByEmployeeIdOrderByPeriodDesc(@Param("empId") Long employeeId);

    @Query("SELECT pd FROM PayrollDetail pd WHERE pd.employee.id = :empId " +
           "AND pd.payrollRun.month = :month AND pd.payrollRun.year = :year")
    Optional<PayrollDetail> findByEmployeeAndPeriod(@Param("empId") Long employeeId,
                                                     @Param("month") Integer month,
                                                     @Param("year") Integer year);

    @Query("SELECT pd FROM PayrollDetail pd WHERE pd.employee.id = :empId " +
           "AND pd.payrollRun.status = 'PROCESSED' ORDER BY pd.payrollRun.year DESC, pd.payrollRun.month DESC")
    List<PayrollDetail> findProcessedPayslips(@Param("empId") Long employeeId);

    @Query("SELECT SUM(pd.netPay) FROM PayrollDetail pd WHERE pd.payrollRun.id = :runId")
    Double sumNetPayByPayrollRun(@Param("runId") Long payrollRunId);

    @Query("SELECT pd FROM PayrollDetail pd WHERE pd.payrollRun.id = :runId " +
           "AND pd.employee.department.id = :deptId")
    List<PayrollDetail> findByPayrollRunAndDepartment(@Param("runId") Long payrollRunId,
                                                       @Param("deptId") Long departmentId);
}

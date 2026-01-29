package com.staffwise.hrms.repository;

import com.staffwise.hrms.entity.PayrollRun;
import com.staffwise.hrms.entity.PayrollStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollRunRepository extends JpaRepository<PayrollRun, Long> {

    Optional<PayrollRun> findByMonthAndYear(Integer month, Integer year);

    List<PayrollRun> findByYear(Integer year);

    List<PayrollRun> findByStatus(PayrollStatus status);

    @Query("SELECT pr FROM PayrollRun pr WHERE pr.status IN ('COMPUTED', 'REJECTED') ORDER BY pr.year DESC, pr.month DESC")
    List<PayrollRun> findPayrollsForChecking();

    @Query("SELECT pr FROM PayrollRun pr WHERE pr.status = 'CHECKED' ORDER BY pr.year DESC, pr.month DESC")
    List<PayrollRun> findPayrollsForAuthorization();

    @Query("SELECT pr FROM PayrollRun pr WHERE pr.status = 'AUTHORIZED' ORDER BY pr.year DESC, pr.month DESC")
    List<PayrollRun> findPayrollsForProcessing();

    @Query("SELECT pr FROM PayrollRun pr ORDER BY pr.year DESC, pr.month DESC")
    List<PayrollRun> findAllOrderByPeriodDesc();

    @Query("SELECT CASE WHEN COUNT(pr) > 0 THEN true ELSE false END FROM PayrollRun pr " +
           "WHERE pr.month = :month AND pr.year = :year AND pr.status = 'PROCESSED'")
    boolean isPayrollProcessed(@Param("month") Integer month, @Param("year") Integer year);
}

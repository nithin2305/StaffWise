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

    Optional<PayrollRun> findByFortnightAndYear(Integer fortnight, Integer year);

    List<PayrollRun> findByYear(Integer year);

    List<PayrollRun> findByStatus(PayrollStatus status);

    @Query("SELECT pr FROM PayrollRun pr WHERE pr.status IN ('COMPUTED', 'REJECTED') ORDER BY pr.year DESC, pr.fortnight DESC")
    List<PayrollRun> findPayrollsForChecking();

    // For simplified workflow: COMPUTED and CHECKED payrolls are ready for authorization & credit
    @Query("SELECT pr FROM PayrollRun pr WHERE pr.status IN ('COMPUTED', 'CHECKED') ORDER BY pr.year DESC, pr.fortnight DESC")
    List<PayrollRun> findPayrollsForAuthorization();

    @Query("SELECT pr FROM PayrollRun pr WHERE pr.status = 'AUTHORIZED' ORDER BY pr.year DESC, pr.fortnight DESC")
    List<PayrollRun> findPayrollsForProcessing();

    @Query("SELECT pr FROM PayrollRun pr ORDER BY pr.year DESC, pr.fortnight DESC")
    List<PayrollRun> findAllOrderByPeriodDesc();

    @Query("SELECT CASE WHEN COUNT(pr) > 0 THEN true ELSE false END FROM PayrollRun pr " +
           "WHERE pr.fortnight = :fortnight AND pr.year = :year AND pr.status = 'PROCESSED'")
    boolean isPayrollProcessed(@Param("fortnight") Integer fortnight, @Param("year") Integer year);

    // For backwards compatibility - find by month/year by mapping to fortnights
    @Query("SELECT pr FROM PayrollRun pr WHERE pr.fortnight IN (:fortnight1, :fortnight2) AND pr.year = :year")
    List<PayrollRun> findByMonthAndYear(@Param("fortnight1") Integer fortnight1, @Param("fortnight2") Integer fortnight2, @Param("year") Integer year);
}

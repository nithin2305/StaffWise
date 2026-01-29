package com.staffwise.hrms.repository;

import com.staffwise.hrms.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findByEmployeeId(Long employeeId);

    Optional<Attendance> findByEmployeeIdAndAttendanceDate(Long employeeId, LocalDate date);

    List<Attendance> findByAttendanceDate(LocalDate date);

    @Query("SELECT a FROM Attendance a WHERE a.employee.id = :empId " +
           "AND a.attendanceDate BETWEEN :startDate AND :endDate ORDER BY a.attendanceDate")
    List<Attendance> findByEmployeeAndDateRange(@Param("empId") Long employeeId,
                                                 @Param("startDate") LocalDate startDate,
                                                 @Param("endDate") LocalDate endDate);

    @Query("SELECT a FROM Attendance a WHERE a.attendanceDate BETWEEN :startDate AND :endDate")
    List<Attendance> findByDateRange(@Param("startDate") LocalDate startDate,
                                      @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.employee.id = :empId " +
           "AND a.status = 'PRESENT' AND EXTRACT(MONTH FROM a.attendanceDate) = :month " +
           "AND EXTRACT(YEAR FROM a.attendanceDate) = :year")
    Integer countPresentDays(@Param("empId") Long employeeId, @Param("month") int month, @Param("year") int year);

    @Query("SELECT SUM(a.overtimeHours) FROM Attendance a WHERE a.employee.id = :empId " +
           "AND EXTRACT(MONTH FROM a.attendanceDate) = :month " +
           "AND EXTRACT(YEAR FROM a.attendanceDate) = :year")
    Double sumOvertimeHours(@Param("empId") Long employeeId, @Param("month") int month, @Param("year") int year);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.employee.id = :empId " +
           "AND a.isLate = true AND EXTRACT(MONTH FROM a.attendanceDate) = :month " +
           "AND EXTRACT(YEAR FROM a.attendanceDate) = :year")
    Integer countLateDays(@Param("empId") Long employeeId, @Param("month") int month, @Param("year") int year);

    @Query("SELECT a FROM Attendance a WHERE a.employee.department.id = :deptId " +
           "AND a.attendanceDate = :date")
    List<Attendance> findByDepartmentAndDate(@Param("deptId") Long departmentId, @Param("date") LocalDate date);
}

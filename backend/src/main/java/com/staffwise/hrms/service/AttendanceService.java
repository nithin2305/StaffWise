package com.staffwise.hrms.service;

import com.staffwise.hrms.dto.AttendanceDTO;
import com.staffwise.hrms.entity.Attendance;
import com.staffwise.hrms.entity.Attendance.AttendanceStatus;
import com.staffwise.hrms.entity.Employee;
import com.staffwise.hrms.exception.ResourceNotFoundException;
import com.staffwise.hrms.repository.AttendanceRepository;
import com.staffwise.hrms.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditService auditService;

    private static final LocalTime STANDARD_CHECK_IN = LocalTime.of(9, 0);
    private static final LocalTime STANDARD_CHECK_OUT = LocalTime.of(18, 0);
    private static final int GRACE_PERIOD_MINUTES = 15;

    public List<AttendanceDTO> getAttendanceByEmployee(Long employeeId) {
        return attendanceRepository.findByEmployeeId(employeeId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getAttendanceByEmployeeAndDateRange(Long employeeId, LocalDate startDate, LocalDate endDate) {
        return attendanceRepository.findByEmployeeAndDateRange(employeeId, startDate, endDate).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getAttendanceByDate(LocalDate date) {
        return attendanceRepository.findByAttendanceDate(date).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public AttendanceDTO markCheckIn(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        Optional<Attendance> existing = attendanceRepository.findByEmployeeIdAndAttendanceDate(employeeId, today);
        if (existing.isPresent()) {
            throw new IllegalStateException("Already checked in for today");
        }

        Attendance attendance = Attendance.builder()
                .employee(employee)
                .attendanceDate(today)
                .checkInTime(now)
                .status(AttendanceStatus.PRESENT)
                .build();

        // Check for late arrival
        if (now.isAfter(STANDARD_CHECK_IN.plusMinutes(GRACE_PERIOD_MINUTES))) {
            attendance.setIsLate(true);
            attendance.setLateMinutes((int) ChronoUnit.MINUTES.between(STANDARD_CHECK_IN, now));
        }

        Attendance saved = attendanceRepository.save(attendance);
        log.info("Check-in recorded for employee: {} at {}", employee.getEmpCode(), now);
        return mapToDTO(saved);
    }

    public AttendanceDTO markCheckOut(Long employeeId) {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        Attendance attendance = attendanceRepository.findByEmployeeIdAndAttendanceDate(employeeId, today)
                .orElseThrow(() -> new IllegalStateException("No check-in found for today"));

        if (attendance.getCheckOutTime() != null) {
            throw new IllegalStateException("Already checked out for today");
        }

        attendance.setCheckOutTime(now);

        // Calculate work hours
        if (attendance.getCheckInTime() != null) {
            double hours = ChronoUnit.MINUTES.between(attendance.getCheckInTime(), now) / 60.0;
            attendance.setWorkHours(Math.round(hours * 100.0) / 100.0);

            // Calculate overtime
            if (now.isAfter(STANDARD_CHECK_OUT)) {
                double overtime = ChronoUnit.MINUTES.between(STANDARD_CHECK_OUT, now) / 60.0;
                attendance.setOvertimeHours(Math.max(0, Math.round(overtime * 100.0) / 100.0));
            }
        }

        Attendance saved = attendanceRepository.save(attendance);
        log.info("Check-out recorded for employee: {} at {}", attendance.getEmployee().getEmpCode(), now);
        return mapToDTO(saved);
    }

    public AttendanceDTO updateAttendance(Long attendanceId, AttendanceDTO dto, String updatedBy) {
        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found"));

        String oldValues = mapToDTO(attendance).toString();

        attendance.setCheckInTime(dto.getCheckInTime());
        attendance.setCheckOutTime(dto.getCheckOutTime());
        attendance.setStatus(dto.getStatus());
        attendance.setRemarks(dto.getRemarks());
        attendance.setCorrectedBy(updatedBy);
        attendance.setCorrectionReason(dto.getCorrectionReason());

        // Recalculate work hours
        if (dto.getCheckInTime() != null && dto.getCheckOutTime() != null) {
            double hours = ChronoUnit.MINUTES.between(dto.getCheckInTime(), dto.getCheckOutTime()) / 60.0;
            attendance.setWorkHours(Math.round(hours * 100.0) / 100.0);
        }

        Attendance saved = attendanceRepository.save(attendance);
        
        auditService.logAction("Attendance", attendanceId, "UPDATE", updatedBy, oldValues, dto.toString());
        
        log.info("Attendance corrected by {} for record {}", updatedBy, attendanceId);
        return mapToDTO(saved);
    }

    public AttendanceDTO createAttendanceRecord(AttendanceDTO dto, String createdBy) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        Optional<Attendance> existing = attendanceRepository.findByEmployeeIdAndAttendanceDate(
                dto.getEmployeeId(), dto.getAttendanceDate());
        
        if (existing.isPresent()) {
            throw new IllegalStateException("Attendance record already exists for this date");
        }

        Attendance attendance = Attendance.builder()
                .employee(employee)
                .attendanceDate(dto.getAttendanceDate())
                .checkInTime(dto.getCheckInTime())
                .checkOutTime(dto.getCheckOutTime())
                .status(dto.getStatus())
                .workHours(dto.getWorkHours())
                .overtimeHours(dto.getOvertimeHours())
                .isLate(dto.getIsLate())
                .lateMinutes(dto.getLateMinutes())
                .remarks(dto.getRemarks())
                .build();

        Attendance saved = attendanceRepository.save(attendance);
        
        auditService.logAction("Attendance", saved.getId(), "CREATE", createdBy, null, dto.toString());
        
        return mapToDTO(saved);
    }

    public Integer countPresentDays(Long employeeId, int month, int year) {
        return attendanceRepository.countPresentDays(employeeId, month, year);
    }

    public Integer countLateDays(Long employeeId, int month, int year) {
        return attendanceRepository.countLateDays(employeeId, month, year);
    }

    public Double sumOvertimeHours(Long employeeId, int month, int year) {
        Double overtime = attendanceRepository.sumOvertimeHours(employeeId, month, year);
        return overtime != null ? overtime : 0.0;
    }

    private AttendanceDTO mapToDTO(Attendance attendance) {
        return AttendanceDTO.builder()
                .id(attendance.getId())
                .employeeId(attendance.getEmployee().getId())
                .employeeName(attendance.getEmployee().getFullName())
                .empCode(attendance.getEmployee().getEmpCode())
                .attendanceDate(attendance.getAttendanceDate())
                .checkInTime(attendance.getCheckInTime())
                .checkOutTime(attendance.getCheckOutTime())
                .status(attendance.getStatus())
                .workHours(attendance.getWorkHours())
                .overtimeHours(attendance.getOvertimeHours())
                .isLate(attendance.getIsLate())
                .lateMinutes(attendance.getLateMinutes())
                .remarks(attendance.getRemarks())
                .correctedBy(attendance.getCorrectedBy())
                .correctionReason(attendance.getCorrectionReason())
                .build();
    }
}

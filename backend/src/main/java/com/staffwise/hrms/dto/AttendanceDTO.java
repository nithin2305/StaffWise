package com.staffwise.hrms.dto;

import com.staffwise.hrms.entity.Attendance.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceDTO {
    private Long id;
    
    @NotNull(message = "Employee ID is required")
    private Long employeeId;
    
    private String employeeName;
    private String empCode;
    
    @NotNull(message = "Attendance date is required")
    private LocalDate attendanceDate;
    
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    
    @NotNull(message = "Status is required")
    private AttendanceStatus status;
    
    private Double workHours;
    private Double overtimeHours;
    private Boolean isLate;
    private Integer lateMinutes;
    private String remarks;
    private String correctedBy;
    private String correctionReason;
}

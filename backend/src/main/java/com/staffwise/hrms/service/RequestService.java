package com.staffwise.hrms.service;

import com.staffwise.hrms.dto.LeaveBalanceDTO;
import com.staffwise.hrms.dto.RequestDTO;
import com.staffwise.hrms.entity.*;
import com.staffwise.hrms.exception.ResourceNotFoundException;
import com.staffwise.hrms.exception.InsufficientBalanceException;
import com.staffwise.hrms.repository.EmployeeRepository;
import com.staffwise.hrms.repository.EmployeeRequestRepository;
import com.staffwise.hrms.repository.LeaveBalanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RequestService {

    private final EmployeeRequestRepository requestRepository;
    private final EmployeeRepository employeeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final AuditService auditService;

    // ============ LEAVE REQUESTS ============

    public RequestDTO submitLeaveRequest(RequestDTO dto, String submittedBy) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        // Validate leave balance
        int currentYear = LocalDate.now().getYear();
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(
                dto.getEmployeeId(), dto.getLeaveType(), currentYear)
                .orElseThrow(() -> new ResourceNotFoundException("Leave balance not found"));

        double requestedDays = calculateLeaveDays(dto.getFromDate(), dto.getToDate());
        
        if (balance.getAvailableLeaves() < requestedDays) {
            throw new InsufficientBalanceException("Insufficient leave balance. Available: " + 
                    balance.getAvailableLeaves() + ", Requested: " + requestedDays);
        }

        EmployeeRequest request = EmployeeRequest.builder()
                .employee(employee)
                .requestType(RequestType.LEAVE)
                .leaveType(dto.getLeaveType())
                .fromDate(dto.getFromDate())
                .toDate(dto.getToDate())
                .totalDays(requestedDays)
                .reason(dto.getReason())
                .status(RequestStatus.SUBMITTED)
                .build();

        // Update pending leaves
        balance.setPendingLeaves(balance.getPendingLeaves() + requestedDays);
        leaveBalanceRepository.save(balance);

        EmployeeRequest saved = requestRepository.save(request);
        
        auditService.logAction("LeaveRequest", saved.getId(), "SUBMIT", submittedBy, null, dto.toString());
        
        log.info("Leave request submitted by {} for {} days", employee.getEmpCode(), requestedDays);
        return mapToDTO(saved);
    }

    public RequestDTO approveLeaveRequest(Long requestId, Long approvedById, String approvedBy) {
        EmployeeRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (request.getStatus() != RequestStatus.SUBMITTED) {
            throw new IllegalStateException("Request is not in SUBMITTED status");
        }

        Employee approver = employeeRepository.findById(approvedById)
                .orElseThrow(() -> new ResourceNotFoundException("Approver not found"));

        // Update leave balance
        int year = request.getFromDate().getYear();
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(
                request.getEmployee().getId(), request.getLeaveType(), year)
                .orElseThrow(() -> new ResourceNotFoundException("Leave balance not found"));

        balance.setPendingLeaves(balance.getPendingLeaves() - request.getTotalDays());
        balance.setUsedLeaves(balance.getUsedLeaves() + request.getTotalDays());
        leaveBalanceRepository.save(balance);

        request.setStatus(RequestStatus.APPROVED);
        request.setApprovedBy(approver);
        request.setApprovedAt(LocalDateTime.now());

        EmployeeRequest saved = requestRepository.save(request);
        
        auditService.logAction("LeaveRequest", requestId, "APPROVE", approvedBy, 
                "status=SUBMITTED", "status=APPROVED");
        
        log.info("Leave request {} approved by {}", requestId, approvedBy);
        return mapToDTO(saved);
    }

    public RequestDTO rejectLeaveRequest(Long requestId, String rejectionReason, Long rejectedById, String rejectedBy) {
        EmployeeRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (request.getStatus() != RequestStatus.SUBMITTED) {
            throw new IllegalStateException("Request is not in SUBMITTED status");
        }

        Employee rejector = employeeRepository.findById(rejectedById)
                .orElseThrow(() -> new ResourceNotFoundException("Rejector not found"));

        // Release pending leaves
        int year = request.getFromDate().getYear();
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(
                request.getEmployee().getId(), request.getLeaveType(), year)
                .orElseThrow(() -> new ResourceNotFoundException("Leave balance not found"));

        balance.setPendingLeaves(balance.getPendingLeaves() - request.getTotalDays());
        leaveBalanceRepository.save(balance);

        request.setStatus(RequestStatus.REJECTED);
        request.setApprovedBy(rejector);
        request.setApprovedAt(LocalDateTime.now());
        request.setRejectionReason(rejectionReason);

        EmployeeRequest saved = requestRepository.save(request);
        
        auditService.logAction("LeaveRequest", requestId, "REJECT", rejectedBy, 
                "status=SUBMITTED", "status=REJECTED");
        
        log.info("Leave request {} rejected by {}", requestId, rejectedBy);
        return mapToDTO(saved);
    }

    // ============ LATE COMING REQUESTS ============

    public RequestDTO submitLateComingRequest(RequestDTO dto, String submittedBy) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        EmployeeRequest request = EmployeeRequest.builder()
                .employee(employee)
                .requestType(RequestType.LATE_COMING)
                .lateDate(dto.getLateDate())
                .lateTime(dto.getLateTime())
                .reason(dto.getReason())
                .status(RequestStatus.SUBMITTED)
                .build();

        EmployeeRequest saved = requestRepository.save(request);
        
        auditService.logAction("LateComingRequest", saved.getId(), "SUBMIT", submittedBy, null, dto.toString());
        
        log.info("Late coming request submitted by {} for {}", employee.getEmpCode(), dto.getLateDate());
        return mapToDTO(saved);
    }

    // ============ OVERTIME REQUESTS ============

    public RequestDTO submitOvertimeRequest(RequestDTO dto, String submittedBy) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        EmployeeRequest request = EmployeeRequest.builder()
                .employee(employee)
                .requestType(RequestType.OVERTIME)
                .overtimeDate(dto.getOvertimeDate())
                .overtimeHours(dto.getOvertimeHours())
                .reason(dto.getReason())
                .status(RequestStatus.SUBMITTED)
                .build();

        EmployeeRequest saved = requestRepository.save(request);
        
        auditService.logAction("OvertimeRequest", saved.getId(), "SUBMIT", submittedBy, null, dto.toString());
        
        log.info("Overtime request submitted by {} for {} hours", employee.getEmpCode(), dto.getOvertimeHours());
        return mapToDTO(saved);
    }

    public RequestDTO approveRequest(Long requestId, Long approvedById, String approvedBy) {
        EmployeeRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (request.getRequestType() == RequestType.LEAVE) {
            return approveLeaveRequest(requestId, approvedById, approvedBy);
        }

        Employee approver = employeeRepository.findById(approvedById)
                .orElseThrow(() -> new ResourceNotFoundException("Approver not found"));

        request.setStatus(RequestStatus.APPROVED);
        request.setApprovedBy(approver);
        request.setApprovedAt(LocalDateTime.now());

        EmployeeRequest saved = requestRepository.save(request);
        
        auditService.logAction("Request", requestId, "APPROVE", approvedBy, 
                "status=SUBMITTED", "status=APPROVED");
        
        return mapToDTO(saved);
    }

    public RequestDTO rejectRequest(Long requestId, String rejectionReason, Long rejectedById, String rejectedBy) {
        EmployeeRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (request.getRequestType() == RequestType.LEAVE) {
            return rejectLeaveRequest(requestId, rejectionReason, rejectedById, rejectedBy);
        }

        Employee rejector = employeeRepository.findById(rejectedById)
                .orElseThrow(() -> new ResourceNotFoundException("Rejector not found"));

        request.setStatus(RequestStatus.REJECTED);
        request.setApprovedBy(rejector);
        request.setApprovedAt(LocalDateTime.now());
        request.setRejectionReason(rejectionReason);

        EmployeeRequest saved = requestRepository.save(request);
        
        auditService.logAction("Request", requestId, "REJECT", rejectedBy, 
                "status=SUBMITTED", "status=REJECTED");
        
        return mapToDTO(saved);
    }

    // ============ QUERY METHODS ============

    public List<RequestDTO> getRequestsByEmployee(Long employeeId) {
        return requestRepository.findByEmployeeId(employeeId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<RequestDTO> getPendingLeaveRequests() {
        return requestRepository.findPendingLeaveRequests().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<RequestDTO> getPendingRequests(RequestType type) {
        return requestRepository.findByRequestTypeAndStatus(type, RequestStatus.SUBMITTED).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public RequestDTO getRequestById(Long id) {
        EmployeeRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
        return mapToDTO(request);
    }

    public List<LeaveBalanceDTO> getLeaveBalances(Long employeeId) {
        int currentYear = LocalDate.now().getYear();
        return leaveBalanceRepository.findByEmployeeIdAndYear(employeeId, currentYear).stream()
                .map(this::mapLeaveBalanceToDTO)
                .collect(Collectors.toList());
    }

    // ============ HELPER METHODS ============

    private double calculateLeaveDays(LocalDate fromDate, LocalDate toDate) {
        return ChronoUnit.DAYS.between(fromDate, toDate) + 1;
    }

    private RequestDTO mapToDTO(EmployeeRequest request) {
        return RequestDTO.builder()
                .id(request.getId())
                .employeeId(request.getEmployee().getId())
                .employeeName(request.getEmployee().getFullName())
                .empCode(request.getEmployee().getEmpCode())
                .requestType(request.getRequestType())
                .status(request.getStatus())
                .leaveType(request.getLeaveType())
                .fromDate(request.getFromDate())
                .toDate(request.getToDate())
                .totalDays(request.getTotalDays())
                .lateDate(request.getLateDate())
                .lateTime(request.getLateTime())
                .overtimeDate(request.getOvertimeDate())
                .overtimeHours(request.getOvertimeHours())
                .reason(request.getReason())
                .approvedById(request.getApprovedBy() != null ? request.getApprovedBy().getId() : null)
                .approvedByName(request.getApprovedBy() != null ? request.getApprovedBy().getFullName() : null)
                .approvedAt(request.getApprovedAt())
                .rejectionReason(request.getRejectionReason())
                .createdAt(request.getCreatedAt())
                .build();
    }

    private LeaveBalanceDTO mapLeaveBalanceToDTO(LeaveBalance balance) {
        return LeaveBalanceDTO.builder()
                .id(balance.getId())
                .employeeId(balance.getEmployee().getId())
                .employeeName(balance.getEmployee().getFullName())
                .leaveType(balance.getLeaveType())
                .year(balance.getYear())
                .totalLeaves(balance.getTotalLeaves())
                .usedLeaves(balance.getUsedLeaves())
                .pendingLeaves(balance.getPendingLeaves())
                .carriedForward(balance.getCarriedForward())
                .availableLeaves(balance.getAvailableLeaves())
                .build();
    }
}

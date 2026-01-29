package com.staffwise.hrms.service;

import com.staffwise.hrms.dto.EmployeeDTO;
import com.staffwise.hrms.entity.Employee;
import com.staffwise.hrms.entity.LeaveBalance;
import com.staffwise.hrms.entity.LeaveType;
import com.staffwise.hrms.entity.Role;
import com.staffwise.hrms.exception.ResourceNotFoundException;
import com.staffwise.hrms.exception.DuplicateResourceException;
import com.staffwise.hrms.repository.DepartmentRepository;
import com.staffwise.hrms.repository.EmployeeRepository;
import com.staffwise.hrms.repository.LeaveBalanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public List<EmployeeDTO> getAllEmployees() {
        return employeeRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<EmployeeDTO> getActiveEmployees() {
        return employeeRepository.findByIsActiveTrue().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public EmployeeDTO getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        return mapToDTO(employee);
    }

    public EmployeeDTO getEmployeeByEmail(String email) {
        Employee employee = employeeRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with email: " + email));
        return mapToDTO(employee);
    }

    public EmployeeDTO createEmployee(EmployeeDTO dto, String createdBy) {
        if (employeeRepository.existsByEmail(dto.getEmail())) {
            throw new DuplicateResourceException("Email already exists: " + dto.getEmail());
        }
        if (employeeRepository.existsByEmpCode(dto.getEmpCode())) {
            throw new DuplicateResourceException("Employee code already exists: " + dto.getEmpCode());
        }

        Employee employee = mapToEntity(dto);
        employee.setPassword(passwordEncoder.encode(dto.getPassword() != null ? dto.getPassword() : "Welcome@123"));
        employee.setCreatedBy(createdBy);
        
        Employee savedEmployee = employeeRepository.save(employee);
        
        // Initialize leave balances for current year
        initializeLeaveBalances(savedEmployee);
        
        auditService.logAction("Employee", savedEmployee.getId(), "CREATE", createdBy, null, dto.toString());
        
        log.info("Employee created: {} by {}", savedEmployee.getEmpCode(), createdBy);
        return mapToDTO(savedEmployee);
    }

    public EmployeeDTO updateEmployee(Long id, EmployeeDTO dto, String updatedBy) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        String oldValues = mapToDTO(employee).toString();
        
        updateEntityFromDTO(employee, dto);
        employee.setUpdatedBy(updatedBy);
        
        Employee savedEmployee = employeeRepository.save(employee);
        
        auditService.logAction("Employee", id, "UPDATE", updatedBy, oldValues, dto.toString());
        
        log.info("Employee updated: {} by {}", savedEmployee.getEmpCode(), updatedBy);
        return mapToDTO(savedEmployee);
    }

    public void deactivateEmployee(Long id, String deactivatedBy) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        
        employee.setIsActive(false);
        employee.setUpdatedBy(deactivatedBy);
        employeeRepository.save(employee);
        
        auditService.logAction("Employee", id, "DEACTIVATE", deactivatedBy, "active=true", "active=false");
        
        log.info("Employee deactivated: {} by {}", employee.getEmpCode(), deactivatedBy);
    }

    public List<EmployeeDTO> getEmployeesByDepartment(Long departmentId) {
        return employeeRepository.findByDepartmentId(departmentId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<EmployeeDTO> getEmployeesByRole(Role role) {
        return employeeRepository.findByRole(role).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<EmployeeDTO> searchEmployees(String name) {
        return employeeRepository.searchByName(name).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private void initializeLeaveBalances(Employee employee) {
        int currentYear = LocalDate.now().getYear();
        
        // Initialize standard leave types
        createLeaveBalance(employee, LeaveType.ANNUAL, currentYear, 20.0);
        createLeaveBalance(employee, LeaveType.SICK, currentYear, 10.0);
        createLeaveBalance(employee, LeaveType.CASUAL, currentYear, 7.0);
    }

    private void createLeaveBalance(Employee employee, LeaveType leaveType, int year, double totalLeaves) {
        LeaveBalance balance = LeaveBalance.builder()
                .employee(employee)
                .leaveType(leaveType)
                .year(year)
                .totalLeaves(totalLeaves)
                .usedLeaves(0.0)
                .pendingLeaves(0.0)
                .build();
        leaveBalanceRepository.save(balance);
    }

    public EmployeeDTO mapToDTO(Employee employee) {
        return EmployeeDTO.builder()
                .id(employee.getId())
                .empCode(employee.getEmpCode())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .fullName(employee.getFullName())
                .email(employee.getEmail())
                .phoneNumber(employee.getPhoneNumber())
                .dateOfBirth(employee.getDateOfBirth())
                .dateOfJoining(employee.getDateOfJoining())
                .departmentId(employee.getDepartment() != null ? employee.getDepartment().getId() : null)
                .departmentName(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                .designation(employee.getDesignation())
                .role(employee.getRole())
                .basicSalary(employee.getBasicSalary())
                .isActive(employee.getIsActive())
                .active(employee.getIsActive())
                .managerId(employee.getManager() != null ? employee.getManager().getId() : null)
                .managerName(employee.getManager() != null ? employee.getManager().getFullName() : null)
                .address(employee.getAddress())
                .city(employee.getCity())
                .state(employee.getState())
                .country(employee.getCountry())
                .postalCode(employee.getPostalCode())
                .bankAccountNumber(employee.getBankAccountNumber())
                .bankName(employee.getBankName())
                .ifscCode(employee.getIfscCode())
                .panNumber(employee.getPanNumber())
                .build();
    }

    private Employee mapToEntity(EmployeeDTO dto) {
        Employee employee = Employee.builder()
                .empCode(dto.getEmpCode())
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .email(dto.getEmail())
                .phoneNumber(dto.getPhoneNumber())
                .dateOfBirth(dto.getDateOfBirth())
                .dateOfJoining(dto.getDateOfJoining())
                .designation(dto.getDesignation())
                .role(dto.getRole())
                .basicSalary(dto.getBasicSalary())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .address(dto.getAddress())
                .city(dto.getCity())
                .state(dto.getState())
                .country(dto.getCountry())
                .postalCode(dto.getPostalCode())
                .bankAccountNumber(dto.getBankAccountNumber())
                .bankName(dto.getBankName())
                .ifscCode(dto.getIfscCode())
                .panNumber(dto.getPanNumber())
                .build();

        if (dto.getDepartmentId() != null) {
            employee.setDepartment(departmentRepository.findById(dto.getDepartmentId()).orElse(null));
        }
        if (dto.getManagerId() != null) {
            employee.setManager(employeeRepository.findById(dto.getManagerId()).orElse(null));
        }

        return employee;
    }

    private void updateEntityFromDTO(Employee employee, EmployeeDTO dto) {
        // Only update fields that are provided (not null)
        if (dto.getFirstName() != null) {
            employee.setFirstName(dto.getFirstName());
        }
        if (dto.getLastName() != null) {
            employee.setLastName(dto.getLastName());
        }
        if (dto.getPhoneNumber() != null) {
            employee.setPhoneNumber(dto.getPhoneNumber());
        }
        if (dto.getDateOfBirth() != null) {
            employee.setDateOfBirth(dto.getDateOfBirth());
        }
        if (dto.getDesignation() != null) {
            employee.setDesignation(dto.getDesignation());
        }
        if (dto.getBasicSalary() != null) {
            employee.setBasicSalary(dto.getBasicSalary());
        }
        if (dto.getAddress() != null) {
            employee.setAddress(dto.getAddress());
        }
        if (dto.getCity() != null) {
            employee.setCity(dto.getCity());
        }
        if (dto.getState() != null) {
            employee.setState(dto.getState());
        }
        if (dto.getCountry() != null) {
            employee.setCountry(dto.getCountry());
        }
        if (dto.getPostalCode() != null) {
            employee.setPostalCode(dto.getPostalCode());
        }
        if (dto.getBankAccountNumber() != null) {
            employee.setBankAccountNumber(dto.getBankAccountNumber());
        }
        if (dto.getBankName() != null) {
            employee.setBankName(dto.getBankName());
        }
        if (dto.getIfscCode() != null) {
            employee.setIfscCode(dto.getIfscCode());
        }
        if (dto.getPanNumber() != null) {
            employee.setPanNumber(dto.getPanNumber());
        }
        if (dto.getDepartmentId() != null) {
            employee.setDepartment(departmentRepository.findById(dto.getDepartmentId()).orElse(null));
        }
        if (dto.getManagerId() != null) {
            employee.setManager(employeeRepository.findById(dto.getManagerId()).orElse(null));
        }
        if (dto.getRole() != null) {
            employee.setRole(dto.getRole());
        }
    }
}

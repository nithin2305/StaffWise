package com.staffwise.hrms;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.staffwise.hrms.entity.*;
import com.staffwise.hrms.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Base test class providing common test utilities and data setup.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected EmployeeRepository employeeRepository;

    @Autowired
    protected DepartmentRepository departmentRepository;

    @Autowired
    protected LeaveBalanceRepository leaveBalanceRepository;

    @Autowired
    protected PayrollRunRepository payrollRunRepository;

    @Autowired
    protected PayrollDetailRepository payrollDetailRepository;

    @Autowired
    protected EmployeeRequestRepository employeeRequestRepository;

    @Autowired
    protected AttendanceRepository attendanceRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    protected ObjectMapper objectMapper;

    // Test users
    protected Employee adminUser;
    protected Employee hrUser;
    protected Employee payrollChecker;
    protected Employee payrollAdmin;
    protected Employee regularEmployee;

    // Test department
    protected Department testDepartment;

    @BeforeEach
    public void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        // Clean up all data before each test
        cleanDatabase();

        // Create test data
        setupTestData();
    }

    protected void cleanDatabase() {
        payrollDetailRepository.deleteAll();
        payrollRunRepository.deleteAll();
        employeeRequestRepository.deleteAll();
        attendanceRepository.deleteAll();
        leaveBalanceRepository.deleteAll();
        employeeRepository.deleteAll();
        departmentRepository.deleteAll();
    }

    protected void setupTestData() {
        // Create department
        testDepartment = departmentRepository.save(Department.builder()
                .deptCode("TEST")
                .name("Test Department")
                .description("Department for testing")
                .isActive(true)
                .build());

        // Create System Admin
        adminUser = employeeRepository.save(Employee.builder()
                .empCode("TEST001")
                .firstName("Test")
                .lastName("Admin")
                .email("admin@test.com")
                .password(passwordEncoder.encode("Admin@123"))
                .role(Role.SYSTEM_ADMIN)
                .department(testDepartment)
                .designation("System Administrator")
                .basicSalary(100000.0)
                .dateOfJoining(LocalDate.of(2020, 1, 1))
                .isActive(true)
                .build());

        // Create HR User
        hrUser = employeeRepository.save(Employee.builder()
                .empCode("TEST002")
                .firstName("Test")
                .lastName("HR")
                .email("hr@test.com")
                .password(passwordEncoder.encode("Hr@123456"))
                .role(Role.HR)
                .department(testDepartment)
                .designation("HR Manager")
                .basicSalary(75000.0)
                .dateOfJoining(LocalDate.of(2021, 3, 15))
                .isActive(true)
                .build());

        // Create Payroll Checker
        payrollChecker = employeeRepository.save(Employee.builder()
                .empCode("TEST003")
                .firstName("Test")
                .lastName("Checker")
                .email("checker@test.com")
                .password(passwordEncoder.encode("Checker@123"))
                .role(Role.PAYROLL_CHECKER)
                .department(testDepartment)
                .designation("Payroll Analyst")
                .basicSalary(60000.0)
                .dateOfJoining(LocalDate.of(2022, 1, 10))
                .isActive(true)
                .build());

        // Create Payroll Admin
        payrollAdmin = employeeRepository.save(Employee.builder()
                .empCode("TEST004")
                .firstName("Test")
                .lastName("PayrollAdmin")
                .email("payrolladmin@test.com")
                .password(passwordEncoder.encode("PayrollAdmin@123"))
                .role(Role.PAYROLL_ADMIN)
                .department(testDepartment)
                .designation("Payroll Manager")
                .basicSalary(85000.0)
                .dateOfJoining(LocalDate.of(2021, 6, 1))
                .isActive(true)
                .build());

        // Create Regular Employee
        regularEmployee = employeeRepository.save(Employee.builder()
                .empCode("TEST005")
                .firstName("Test")
                .lastName("Employee")
                .email("employee@test.com")
                .password(passwordEncoder.encode("Employee@123"))
                .role(Role.EMPLOYEE)
                .department(testDepartment)
                .designation("Software Developer")
                .basicSalary(50000.0)
                .dateOfJoining(LocalDate.of(2023, 1, 1))
                .isActive(true)
                .build());

        // Create leave balances for test employees
        createLeaveBalances(regularEmployee);
        createLeaveBalances(hrUser);
    }

    protected void createLeaveBalances(Employee employee) {
        int currentYear = LocalDate.now().getYear();
        
        leaveBalanceRepository.save(LeaveBalance.builder()
                .employee(employee)
                .leaveType(LeaveType.ANNUAL)
                .year(currentYear)
                .totalLeaves(20.0)
                .usedLeaves(0.0)
                .pendingLeaves(0.0)
                .build());

        leaveBalanceRepository.save(LeaveBalance.builder()
                .employee(employee)
                .leaveType(LeaveType.SICK)
                .year(currentYear)
                .totalLeaves(10.0)
                .usedLeaves(0.0)
                .pendingLeaves(0.0)
                .build());

        leaveBalanceRepository.save(LeaveBalance.builder()
                .employee(employee)
                .leaveType(LeaveType.CASUAL)
                .year(currentYear)
                .totalLeaves(7.0)
                .usedLeaves(0.0)
                .pendingLeaves(0.0)
                .build());
    }

    protected PayrollRun createPayrollRun(int month, int year, PayrollStatus status) {
        List<Employee> employees = employeeRepository.findByIsActiveTrue();
        
        PayrollRun payrollRun = payrollRunRepository.save(PayrollRun.builder()
                .month(month)
                .year(year)
                .status(status)
                .runDate(LocalDateTime.now())
                .totalEmployees(employees.size())
                .computedBy(hrUser.getEmail())
                .computedAt(LocalDateTime.now())
                .build());

        double totalGross = 0;
        double totalDeductions = 0;
        double totalNetPay = 0;

        for (Employee emp : employees) {
            double basicSalary = emp.getBasicSalary() != null ? emp.getBasicSalary() : 50000.0;
            double hra = basicSalary * 0.4;
            double grossSalary = basicSalary + hra + 2850;
            double pfDeduction = basicSalary * 0.12;
            double taxDeduction = grossSalary * 0.1;
            double totalDeductionsForEmp = pfDeduction + taxDeduction;
            double netPay = grossSalary - totalDeductionsForEmp;

            payrollDetailRepository.save(PayrollDetail.builder()
                    .payrollRun(payrollRun)
                    .employee(emp)
                    .basicSalary(basicSalary)
                    .hra(hra)
                    .transportAllowance(1600.0)
                    .medicalAllowance(1250.0)
                    .pfDeduction(pfDeduction)
                    .taxDeduction(taxDeduction)
                    .totalWorkingDays(22)
                    .daysWorked(22)
                    .grossSalary(grossSalary)
                    .totalDeductions(totalDeductionsForEmp)
                    .netPay(netPay)
                    .build());

            totalGross += grossSalary;
            totalDeductions += totalDeductionsForEmp;
            totalNetPay += netPay;
        }

        payrollRun.setTotalGross(totalGross);
        payrollRun.setTotalDeductions(totalDeductions);
        payrollRun.setTotalNetPay(totalNetPay);
        return payrollRunRepository.save(payrollRun);
    }

    protected EmployeeRequest createLeaveRequest(Employee employee, LeaveType leaveType, 
                                                   LocalDate fromDate, LocalDate toDate) {
        double totalDays = java.time.temporal.ChronoUnit.DAYS.between(fromDate, toDate) + 1;
        
        return employeeRequestRepository.save(EmployeeRequest.builder()
                .employee(employee)
                .requestType(RequestType.LEAVE)
                .leaveType(leaveType)
                .fromDate(fromDate)
                .toDate(toDate)
                .totalDays(totalDays)
                .reason("Test leave request")
                .status(RequestStatus.SUBMITTED)
                .build());
    }

    protected EmployeeRequest createOvertimeRequest(Employee employee, LocalDate date, double hours) {
        return employeeRequestRepository.save(EmployeeRequest.builder()
                .employee(employee)
                .requestType(RequestType.OVERTIME)
                .overtimeDate(date)
                .overtimeHours(hours)
                .reason("Test overtime request")
                .status(RequestStatus.SUBMITTED)
                .build());
    }

    protected EmployeeRequest createLateComingRequest(Employee employee, LocalDate date, String time) {
        return employeeRequestRepository.save(EmployeeRequest.builder()
                .employee(employee)
                .requestType(RequestType.LATE_COMING)
                .lateDate(date)
                .lateTime(time)
                .reason("Test late coming request")
                .status(RequestStatus.SUBMITTED)
                .build());
    }

    protected String asJsonString(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}

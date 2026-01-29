package com.staffwise.hrms.config;

import com.staffwise.hrms.entity.*;
import com.staffwise.hrms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final PasswordEncoder passwordEncoder;

    @Bean
    @Transactional
    CommandLineRunner initData(
            EmployeeRepository employeeRepository,
            DepartmentRepository departmentRepository,
            LeaveBalanceRepository leaveBalanceRepository,
            PayrollRunRepository payrollRunRepository,
            PayrollDetailRepository payrollDetailRepository) {
        
        return args -> {
            // Only initialize if no data exists
            if (employeeRepository.count() > 0) {
                log.info("Data already exists, skipping initialization");
                return;
            }

            log.info("Initializing sample data...");

            // Create Departments
            Department itDept = departmentRepository.save(Department.builder()
                    .deptCode("IT")
                    .name("Information Technology")
                    .description("IT Department")
                    .isActive(true)
                    .build());

            Department hrDept = departmentRepository.save(Department.builder()
                    .deptCode("HR")
                    .name("Human Resources")
                    .description("HR Department")
                    .isActive(true)
                    .build());

            Department financeDept = departmentRepository.save(Department.builder()
                    .deptCode("FIN")
                    .name("Finance")
                    .description("Finance Department")
                    .isActive(true)
                    .build());

            // Create System Admin
            Employee admin = employeeRepository.save(Employee.builder()
                    .empCode("EMP001")
                    .firstName("System")
                    .lastName("Admin")
                    .email("admin@staffwise.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(Role.SYSTEM_ADMIN)
                    .department(itDept)
                    .designation("System Administrator")
                    .basicSalary(100000.0)
                    .dateOfJoining(LocalDate.of(2020, 1, 1))
                    .isActive(true)
                    .build());

            // Create HR User
            Employee hrUser = employeeRepository.save(Employee.builder()
                    .empCode("EMP002")
                    .firstName("Jane")
                    .lastName("HR")
                    .email("hr@staffwise.com")
                    .password(passwordEncoder.encode("Hr@123456"))
                    .role(Role.HR)
                    .department(hrDept)
                    .designation("HR Manager")
                    .basicSalary(75000.0)
                    .dateOfJoining(LocalDate.of(2021, 3, 15))
                    .isActive(true)
                    .build());

            // Create Payroll Checker
            Employee payrollChecker = employeeRepository.save(Employee.builder()
                    .empCode("EMP003")
                    .firstName("Bob")
                    .lastName("Checker")
                    .email("checker@staffwise.com")
                    .password(passwordEncoder.encode("Checker@123"))
                    .role(Role.PAYROLL_CHECKER)
                    .department(financeDept)
                    .designation("Payroll Analyst")
                    .basicSalary(60000.0)
                    .dateOfJoining(LocalDate.of(2022, 1, 10))
                    .isActive(true)
                    .build());

            // Create Payroll Admin
            Employee payrollAdmin = employeeRepository.save(Employee.builder()
                    .empCode("EMP004")
                    .firstName("Alice")
                    .lastName("Admin")
                    .email("payrolladmin@staffwise.com")
                    .password(passwordEncoder.encode("PayrollAdmin@123"))
                    .role(Role.PAYROLL_ADMIN)
                    .department(financeDept)
                    .designation("Payroll Manager")
                    .basicSalary(85000.0)
                    .dateOfJoining(LocalDate.of(2021, 6, 1))
                    .isActive(true)
                    .build());

            // Create Regular Employee
            Employee employee = employeeRepository.save(Employee.builder()
                    .empCode("EMP005")
                    .firstName("John")
                    .lastName("Doe")
                    .email("john.doe@staffwise.com")
                    .password(passwordEncoder.encode("Employee@123"))
                    .role(Role.EMPLOYEE)
                    .department(itDept)
                    .designation("Software Developer")
                    .basicSalary(50000.0)
                    .dateOfJoining(LocalDate.of(2023, 1, 1))
                    .isActive(true)
                    .build());

            // Create sample processed payroll data for demonstration
            List<Employee> allEmployees = Arrays.asList(admin, hrUser, payrollChecker, payrollAdmin, employee);
            createSamplePayroll(payrollRunRepository, payrollDetailRepository, allEmployees, 12, 2025);
            createSamplePayroll(payrollRunRepository, payrollDetailRepository, allEmployees, 1, 2026);

            // Create leave balances for all employees
            for (Employee emp : allEmployees) {
                createLeaveBalances(leaveBalanceRepository, emp, 2026);
            }

            log.info("Sample data initialization completed");
            log.info("===========================================");
            log.info("Login Credentials:");
            log.info("Admin: admin@staffwise.com / Admin@123");
            log.info("HR: hr@staffwise.com / Hr@123456");
            log.info("Payroll Checker: checker@staffwise.com / Checker@123");
            log.info("Payroll Admin: payrolladmin@staffwise.com / PayrollAdmin@123");
            log.info("Employee: john.doe@staffwise.com / Employee@123");
            log.info("===========================================");
        };
    }

    private void createSamplePayroll(PayrollRunRepository payrollRunRepository, 
                                     PayrollDetailRepository payrollDetailRepository,
                                     List<Employee> employees, int month, int year) {
        // Create a processed payroll run
        PayrollRun payrollRun = payrollRunRepository.save(PayrollRun.builder()
                .month(month)
                .year(year)
                .status(PayrollStatus.PROCESSED)
                .runDate(LocalDateTime.now())
                .totalEmployees(employees.size())
                .computedBy("System")
                .computedAt(LocalDateTime.now().minusDays(5))
                .checkedBy("Bob Checker")
                .checkedAt(LocalDateTime.now().minusDays(4))
                .authorizedBy("Alice Admin")
                .authorizedAt(LocalDateTime.now().minusDays(3))
                .processedBy("Alice Admin")
                .processedAt(LocalDateTime.now().minusDays(2))
                .isLocked(true)
                .build());

        double totalGross = 0;
        double totalDeductions = 0;
        double totalNetPay = 0;

        for (Employee emp : employees) {
            double basicSalary = emp.getBasicSalary() != null ? emp.getBasicSalary() : 50000.0;
            double hra = basicSalary * 0.4;
            double transportAllowance = 1600.0;
            double medicalAllowance = 1250.0;
            double specialAllowance = basicSalary * 0.1;
            double grossSalary = basicSalary + hra + transportAllowance + medicalAllowance + specialAllowance;
            
            double pfDeduction = basicSalary * 0.12;
            double taxDeduction = grossSalary > 50000 ? grossSalary * 0.1 : grossSalary * 0.05;
            double totalDeductionsForEmp = pfDeduction + taxDeduction;
            double netPay = grossSalary - totalDeductionsForEmp;

            payrollDetailRepository.save(PayrollDetail.builder()
                    .payrollRun(payrollRun)
                    .employee(emp)
                    .basicSalary(basicSalary)
                    .hra(hra)
                    .transportAllowance(transportAllowance)
                    .medicalAllowance(medicalAllowance)
                    .specialAllowance(specialAllowance)
                    .overtimePay(0.0)
                    .bonus(0.0)
                    .pfDeduction(pfDeduction)
                    .taxDeduction(taxDeduction)
                    .insuranceDeduction(0.0)
                    .loanDeduction(0.0)
                    .otherDeductions(0.0)
                    .leaveDeduction(0.0)
                    .lateDeduction(0.0)
                    .totalWorkingDays(22)
                    .daysWorked(22)
                    .leavesTaken(0.0)
                    .approvedOvertimeHours(0.0)
                    .lateCount(0)
                    .grossSalary(grossSalary)
                    .totalDeductions(totalDeductionsForEmp)
                    .netPay(netPay)
                    .remarks("Payroll processed")
                    .build());

            totalGross += grossSalary;
            totalDeductions += totalDeductionsForEmp;
            totalNetPay += netPay;
        }

        // Update payroll run totals
        payrollRun.setTotalGross(totalGross);
        payrollRun.setTotalDeductions(totalDeductions);
        payrollRun.setTotalNetPay(totalNetPay);
        payrollRunRepository.save(payrollRun);
    }

    private void createLeaveBalances(LeaveBalanceRepository repository, Employee employee, int year) {
        repository.save(LeaveBalance.builder()
                .employee(employee)
                .leaveType(LeaveType.ANNUAL)
                .year(year)
                .totalLeaves(20.0)
                .usedLeaves(0.0)
                .pendingLeaves(0.0)
                .build());

        repository.save(LeaveBalance.builder()
                .employee(employee)
                .leaveType(LeaveType.SICK)
                .year(year)
                .totalLeaves(10.0)
                .usedLeaves(0.0)
                .pendingLeaves(0.0)
                .build());

        repository.save(LeaveBalance.builder()
                .employee(employee)
                .leaveType(LeaveType.CASUAL)
                .year(year)
                .totalLeaves(7.0)
                .usedLeaves(0.0)
                .pendingLeaves(0.0)
                .build());
    }
}

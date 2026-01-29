package com.staffwise.hrms.controller;

import com.staffwise.hrms.BaseIntegrationTest;
import com.staffwise.hrms.dto.AuthRequest;
import com.staffwise.hrms.dto.EmployeeDTO;
import com.staffwise.hrms.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Comprehensive tests for HRController - Employee management, Leave approval, Payroll computation.
 */
class HRControllerTest extends BaseIntegrationTest {

    private String hrToken;
    private String employeeToken;
    private String adminToken;

    @BeforeEach
    @Override
    public void setUp() {
        super.setUp();
        hrToken = getAuthToken("hr@test.com", "Hr@123456");
        employeeToken = getAuthToken("employee@test.com", "Employee@123");
        adminToken = getAuthToken("admin@test.com", "Admin@123");
    }

    private String getAuthToken(String email, String password) {
        try {
            AuthRequest request = AuthRequest.builder()
                    .email(email)
                    .password(password)
                    .encrypted(false)
                    .build();

            String response = mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(request)))
                    .andReturn()
                    .getResponse()
                    .getContentAsString();

            return objectMapper.readTree(response).get("data").get("token").asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to get auth token", e);
        }
    }

    @Nested
    @DisplayName("Employee Management Tests")
    class EmployeeManagementTests {

        @Test
        @DisplayName("Should get all employees")
        void shouldGetAllEmployees() throws Exception {
            mockMvc.perform(get("/api/hr/employees")
                    .header("Authorization", "Bearer " + hrToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data", hasSize(5))); // 5 test employees
        }

        @Test
        @DisplayName("Should get active employees only")
        void shouldGetActiveEmployees() throws Exception {
            mockMvc.perform(get("/api/hr/employees/active")
                    .header("Authorization", "Bearer " + hrToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[*].isActive", everyItem(is(true))));
        }

        @Test
        @DisplayName("Should get employee by ID")
        void shouldGetEmployeeById() throws Exception {
            mockMvc.perform(get("/api/hr/employees/" + regularEmployee.getId())
                    .header("Authorization", "Bearer " + hrToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(regularEmployee.getId()))
                    .andExpect(jsonPath("$.data.email").value("employee@test.com"))
                    .andExpect(jsonPath("$.data.fullName").value("Test Employee"));
        }

        @Test
        @DisplayName("Should create new employee")
        void shouldCreateNewEmployee() throws Exception {
            EmployeeDTO newEmployee = EmployeeDTO.builder()
                    .firstName("New")
                    .lastName("Employee")
                    .email("newemployee@test.com")
                    .empCode("TEST006")
                    .role(Role.EMPLOYEE)
                    .departmentId(testDepartment.getId())
                    .designation("Junior Developer")
                    .basicSalary(40000.0)
                    .dateOfJoining(LocalDate.now().minusMonths(1))
                    .password("NewEmployee@123")
                    .build();

            mockMvc.perform(post("/api/hr/employees")
                    .header("Authorization", "Bearer " + hrToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(newEmployee)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Employee created successfully"))
                    .andExpect(jsonPath("$.data.email").value("newemployee@test.com"))
                    .andExpect(jsonPath("$.data.empCode").value("TEST006"));
        }

        @Test
        @DisplayName("Should update employee")
        void shouldUpdateEmployee() throws Exception {
            EmployeeDTO updateDto = EmployeeDTO.builder()
                    .firstName("Updated")
                    .lastName("Employee")
                    .email("employee@test.com")
                    .designation("Senior Developer")
                    .basicSalary(60000.0)
                    .build();

            mockMvc.perform(put("/api/hr/employees/" + regularEmployee.getId())
                    .header("Authorization", "Bearer " + hrToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(updateDto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Employee updated successfully"))
                    .andExpect(jsonPath("$.data.designation").value("Senior Developer"))
                    .andExpect(jsonPath("$.data.basicSalary").value(60000.0));
        }

        @Test
        @DisplayName("Should deactivate employee")
        void shouldDeactivateEmployee() throws Exception {
            mockMvc.perform(delete("/api/hr/employees/" + regularEmployee.getId())
                    .header("Authorization", "Bearer " + hrToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Employee deactivated"));
        }

        @Test
        @DisplayName("Should search employees by name")
        void shouldSearchEmployeesByName() throws Exception {
            mockMvc.perform(get("/api/hr/employees/search")
                    .header("Authorization", "Bearer " + hrToken)
                    .param("name", "Test"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
        }

        @Test
        @DisplayName("Should deny access to non-HR user")
        void shouldDenyAccessToNonHrUser() throws Exception {
            mockMvc.perform(get("/api/hr/employees")
                    .header("Authorization", "Bearer " + employeeToken))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("Attendance Management Tests")
    class AttendanceManagementTests {

        @Test
        @DisplayName("Should get attendance by date")
        void shouldGetAttendanceByDate() throws Exception {
            mockMvc.perform(get("/api/hr/attendance")
                    .header("Authorization", "Bearer " + hrToken)
                    .param("date", LocalDate.now().toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray());
        }

        @Test
        @DisplayName("Should get employee attendance by date range")
        void shouldGetEmployeeAttendanceByDateRange() throws Exception {
            LocalDate today = LocalDate.now();
            
            mockMvc.perform(get("/api/hr/attendance/employee/" + regularEmployee.getId())
                    .header("Authorization", "Bearer " + hrToken)
                    .param("startDate", today.minusDays(30).toString())
                    .param("endDate", today.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray());
        }

        @Test
        @DisplayName("Should create attendance record")
        void shouldCreateAttendanceRecord() throws Exception {
            String attendanceJson = String.format(
                "{\"employeeId\": %d, \"attendanceDate\": \"%s\", \"checkIn\": \"09:00\", \"checkOut\": \"18:00\", \"status\": \"PRESENT\"}",
                regularEmployee.getId(), LocalDate.now().minusDays(1).toString()
            );

            mockMvc.perform(post("/api/hr/attendance")
                    .header("Authorization", "Bearer " + hrToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(attendanceJson))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Attendance record created"));
        }
    }

    @Nested
    @DisplayName("Leave Approval Tests")
    class LeaveApprovalTests {

        @Test
        @DisplayName("Should get pending leave requests")
        void shouldGetPendingLeaveRequests() throws Exception {
            // Create a pending leave request
            createLeaveRequest(regularEmployee, LeaveType.ANNUAL,
                    LocalDate.now().plusDays(7), LocalDate.now().plusDays(9));

            mockMvc.perform(get("/api/hr/requests/leave/pending")
                    .header("Authorization", "Bearer " + hrToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
        }

        @Test
        @DisplayName("Should approve leave request")
        void shouldApproveLeaveRequest() throws Exception {
            // Create a pending leave request
            EmployeeRequest leaveRequest = createLeaveRequest(regularEmployee, LeaveType.ANNUAL,
                    LocalDate.now().plusDays(7), LocalDate.now().plusDays(9));

            mockMvc.perform(post("/api/hr/requests/" + leaveRequest.getId() + "/approve")
                    .header("Authorization", "Bearer " + hrToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Request approved"))
                    .andExpect(jsonPath("$.data.status").value("APPROVED"));
        }

        @Test
        @DisplayName("Should reject leave request")
        void shouldRejectLeaveRequest() throws Exception {
            // Create a pending leave request
            EmployeeRequest leaveRequest = createLeaveRequest(regularEmployee, LeaveType.ANNUAL,
                    LocalDate.now().plusDays(14), LocalDate.now().plusDays(16));

            mockMvc.perform(post("/api/hr/requests/" + leaveRequest.getId() + "/reject")
                    .header("Authorization", "Bearer " + hrToken)
                    .param("reason", "Team project deadline"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Request rejected"))
                    .andExpect(jsonPath("$.data.status").value("REJECTED"))
                    .andExpect(jsonPath("$.data.rejectionReason").value("Team project deadline"));
        }

        @Test
        @DisplayName("Should update leave balance after approval")
        void shouldUpdateLeaveBalanceAfterApproval() throws Exception {
            // Create a pending leave request for 3 days
            EmployeeRequest leaveRequest = createLeaveRequest(regularEmployee, LeaveType.ANNUAL,
                    LocalDate.now().plusDays(21), LocalDate.now().plusDays(23));

            // Approve the request
            mockMvc.perform(post("/api/hr/requests/" + leaveRequest.getId() + "/approve")
                    .header("Authorization", "Bearer " + hrToken))
                    .andExpect(status().isOk());

            // Check leave balance - used leaves should be updated
            LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(
                    regularEmployee.getId(), LeaveType.ANNUAL, LocalDate.now().getYear()).orElseThrow();
            
            assert balance.getUsedLeaves() == 3.0 : "Used leaves should be 3";
        }

        @Test
        @DisplayName("Should get pending late coming requests")
        void shouldGetPendingLateRequests() throws Exception {
            // Create a late coming request
            createLateComingRequest(regularEmployee, LocalDate.now(), "09:30");

            mockMvc.perform(get("/api/hr/requests/late/pending")
                    .header("Authorization", "Bearer " + hrToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray());
        }

        @Test
        @DisplayName("Should get pending overtime requests")
        void shouldGetPendingOvertimeRequests() throws Exception {
            // Create an overtime request
            createOvertimeRequest(regularEmployee, LocalDate.now(), 3.0);

            mockMvc.perform(get("/api/hr/requests/overtime/pending")
                    .header("Authorization", "Bearer " + hrToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray());
        }
    }

    @Nested
    @DisplayName("Payroll Computation Tests")
    class PayrollComputationTests {

        @Test
        @DisplayName("Should compute payroll successfully")
        void shouldComputePayroll() throws Exception {
            int month = 3; // Use a month that doesn't have payroll yet
            int year = 2025;

            mockMvc.perform(post("/api/hr/payroll/compute")
                    .header("Authorization", "Bearer " + hrToken)
                    .param("month", String.valueOf(month))
                    .param("year", String.valueOf(year)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Payroll computed successfully"))
                    .andExpect(jsonPath("$.data.month").value(month))
                    .andExpect(jsonPath("$.data.year").value(year))
                    .andExpect(jsonPath("$.data.status").value("COMPUTED"))
                    .andExpect(jsonPath("$.data.totalEmployees").value(5))
                    .andExpect(jsonPath("$.data.totalGross").isNumber())
                    .andExpect(jsonPath("$.data.totalNetPay").isNumber());
        }

        @Test
        @DisplayName("Should fail to compute duplicate payroll")
        void shouldFailDuplicatePayroll() throws Exception {
            int month = 4;
            int year = 2025;

            // First computation - should succeed
            mockMvc.perform(post("/api/hr/payroll/compute")
                    .header("Authorization", "Bearer " + hrToken)
                    .param("month", String.valueOf(month))
                    .param("year", String.valueOf(year)))
                    .andExpect(status().isOk());

            // Second computation - should fail
            mockMvc.perform(post("/api/hr/payroll/compute")
                    .header("Authorization", "Bearer " + hrToken)
                    .param("month", String.valueOf(month))
                    .param("year", String.valueOf(year)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should get payroll runs")
        void shouldGetPayrollRuns() throws Exception {
            // Create a payroll run
            createPayrollRun(5, 2025, PayrollStatus.COMPUTED);

            mockMvc.perform(get("/api/hr/payroll/runs")
                    .header("Authorization", "Bearer " + hrToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
        }

        @Test
        @DisplayName("Should get payroll run details")
        void shouldGetPayrollRunDetails() throws Exception {
            PayrollRun payrollRun = createPayrollRun(6, 2025, PayrollStatus.COMPUTED);

            mockMvc.perform(get("/api/hr/payroll/runs/" + payrollRun.getId())
                    .header("Authorization", "Bearer " + hrToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(payrollRun.getId()))
                    .andExpect(jsonPath("$.data.month").value(6))
                    .andExpect(jsonPath("$.data.year").value(2025));
        }

        @Test
        @DisplayName("Should include overtime in payroll computation")
        void shouldIncludeOvertimeInPayroll() throws Exception {
            int month = 7;
            int year = 2025;
            LocalDate overtimeDate = LocalDate.of(year, month, 15);

            // Create and approve overtime request
            EmployeeRequest overtimeRequest = createOvertimeRequest(regularEmployee, overtimeDate, 5.0);
            overtimeRequest.setStatus(RequestStatus.APPROVED);
            overtimeRequest.setApprovedBy(hrUser);
            employeeRequestRepository.save(overtimeRequest);

            // Compute payroll
            mockMvc.perform(post("/api/hr/payroll/compute")
                    .header("Authorization", "Bearer " + hrToken)
                    .param("month", String.valueOf(month))
                    .param("year", String.valueOf(year)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));

            // Verify overtime was marked as included
            EmployeeRequest updated = employeeRequestRepository.findById(overtimeRequest.getId()).orElseThrow();
            assert updated.getIncludedInPayroll() : "Overtime should be marked as included in payroll";
        }
    }
}

package com.staffwise.hrms.controller;

import com.staffwise.hrms.BaseIntegrationTest;
import com.staffwise.hrms.dto.AuthRequest;
import com.staffwise.hrms.dto.RequestDTO;
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
 * Comprehensive tests for EmployeeController - Profile, Attendance, Leave requests, Payslips.
 */
class EmployeeControllerTest extends BaseIntegrationTest {

    private String employeeToken;
    private String hrToken;

    @BeforeEach
    @Override
    public void setUp() {
        super.setUp();
        employeeToken = getAuthToken("employee@test.com", "Employee@123");
        hrToken = getAuthToken("hr@test.com", "Hr@123456");
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
    @DisplayName("Profile Tests")
    class ProfileTests {

        @Test
        @DisplayName("Should get employee profile successfully")
        void shouldGetProfileSuccessfully() throws Exception {
            mockMvc.perform(get("/api/employee/profile")
                    .header("Authorization", "Bearer " + employeeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.email").value("employee@test.com"))
                    .andExpect(jsonPath("$.data.fullName").value("Test Employee"))
                    .andExpect(jsonPath("$.data.empCode").value("TEST005"))
                    .andExpect(jsonPath("$.data.role").value("EMPLOYEE"))
                    .andExpect(jsonPath("$.data.designation").value("Software Developer"))
                    .andExpect(jsonPath("$.data.basicSalary").value(50000.0));
        }

        @Test
        @DisplayName("Should fail to get profile without authentication")
        void shouldFailGetProfileWithoutAuth() throws Exception {
            mockMvc.perform(get("/api/employee/profile"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Should update employee profile successfully")
        void shouldUpdateProfileSuccessfully() throws Exception {
            String updatePayload = "{\"phoneNumber\": \"1234567890\", \"address\": \"123 Test Street\"}";

            mockMvc.perform(put("/api/employee/profile")
                    .header("Authorization", "Bearer " + employeeToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(updatePayload))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }

    @Nested
    @DisplayName("Attendance Tests")
    class AttendanceTests {

        @Test
        @DisplayName("Should check in successfully")
        void shouldCheckInSuccessfully() throws Exception {
            mockMvc.perform(post("/api/employee/attendance/checkin")
                    .header("Authorization", "Bearer " + employeeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Checked in successfully"))
                    .andExpect(jsonPath("$.data.checkInTime").isNotEmpty());
        }

        @Test
        @DisplayName("Should check out successfully after check in")
        void shouldCheckOutSuccessfully() throws Exception {
            // First check in
            mockMvc.perform(post("/api/employee/attendance/checkin")
                    .header("Authorization", "Bearer " + employeeToken))
                    .andExpect(status().isOk());

            // Then check out
            mockMvc.perform(post("/api/employee/attendance/checkout")
                    .header("Authorization", "Bearer " + employeeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Checked out successfully"))
                    .andExpect(jsonPath("$.data.checkOutTime").isNotEmpty());
        }

        @Test
        @DisplayName("Should get my attendance records")
        void shouldGetMyAttendance() throws Exception {
            // Create an attendance record first
            mockMvc.perform(post("/api/employee/attendance/checkin")
                    .header("Authorization", "Bearer " + employeeToken))
                    .andExpect(status().isOk());

            // Get attendance
            mockMvc.perform(get("/api/employee/attendance/my")
                    .header("Authorization", "Bearer " + employeeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
        }

        @Test
        @DisplayName("Should get attendance by date range")
        void shouldGetAttendanceByRange() throws Exception {
            LocalDate today = LocalDate.now();
            String startDate = today.minusDays(7).toString();
            String endDate = today.toString();

            mockMvc.perform(get("/api/employee/attendance/my/range")
                    .header("Authorization", "Bearer " + employeeToken)
                    .param("startDate", startDate)
                    .param("endDate", endDate))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray());
        }
    }

    @Nested
    @DisplayName("Leave Balance Tests")
    class LeaveBalanceTests {

        @Test
        @DisplayName("Should get leave balances successfully")
        void shouldGetLeaveBalances() throws Exception {
            mockMvc.perform(get("/api/employee/leaves/balance")
                    .header("Authorization", "Bearer " + employeeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(3))))
                    .andExpect(jsonPath("$.data[?(@.leaveType == 'ANNUAL')].totalLeaves", hasItem(20.0)))
                    .andExpect(jsonPath("$.data[?(@.leaveType == 'SICK')].totalLeaves", hasItem(10.0)))
                    .andExpect(jsonPath("$.data[?(@.leaveType == 'CASUAL')].totalLeaves", hasItem(7.0)));
        }
    }

    @Nested
    @DisplayName("Leave Request Tests")
    class LeaveRequestTests {

        @Test
        @DisplayName("Should submit leave request successfully")
        void shouldSubmitLeaveRequest() throws Exception {
            LocalDate fromDate = LocalDate.now().plusDays(7);
            LocalDate toDate = LocalDate.now().plusDays(9);

            RequestDTO request = RequestDTO.builder()
                    .leaveType(LeaveType.ANNUAL)
                    .fromDate(fromDate)
                    .toDate(toDate)
                    .reason("Family vacation")
                    .build();

            mockMvc.perform(post("/api/employee/requests/leave")
                    .header("Authorization", "Bearer " + employeeToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Leave request submitted"))
                    .andExpect(jsonPath("$.data.requestType").value("LEAVE"))
                    .andExpect(jsonPath("$.data.status").value("SUBMITTED"))
                    .andExpect(jsonPath("$.data.leaveType").value("ANNUAL"))
                    .andExpect(jsonPath("$.data.totalDays").value(3.0));
        }

        @Test
        @DisplayName("Should fail to submit leave request with insufficient balance")
        void shouldFailLeaveRequestWithInsufficientBalance() throws Exception {
            LocalDate fromDate = LocalDate.now().plusDays(7);
            LocalDate toDate = LocalDate.now().plusDays(40); // 34 days - more than available

            RequestDTO request = RequestDTO.builder()
                    .leaveType(LeaveType.ANNUAL)
                    .fromDate(fromDate)
                    .toDate(toDate)
                    .reason("Extended vacation")
                    .build();

            mockMvc.perform(post("/api/employee/requests/leave")
                    .header("Authorization", "Bearer " + employeeToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should get my requests")
        void shouldGetMyRequests() throws Exception {
            // Create a leave request first
            createLeaveRequest(regularEmployee, LeaveType.ANNUAL, 
                    LocalDate.now().plusDays(14), LocalDate.now().plusDays(16));

            mockMvc.perform(get("/api/employee/requests/my")
                    .header("Authorization", "Bearer " + employeeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
        }
    }

    @Nested
    @DisplayName("Late Coming Request Tests")
    class LateComingRequestTests {

        @Test
        @DisplayName("Should submit late coming request successfully")
        void shouldSubmitLateComingRequest() throws Exception {
            RequestDTO request = RequestDTO.builder()
                    .lateDate(LocalDate.now())
                    .lateTime("09:30")
                    .reason("Traffic jam on the way")
                    .build();

            mockMvc.perform(post("/api/employee/requests/late")
                    .header("Authorization", "Bearer " + employeeToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Late coming request submitted"))
                    .andExpect(jsonPath("$.data.requestType").value("LATE_COMING"))
                    .andExpect(jsonPath("$.data.status").value("SUBMITTED"));
        }
    }

    @Nested
    @DisplayName("Overtime Request Tests")
    class OvertimeRequestTests {

        @Test
        @DisplayName("Should submit overtime request successfully")
        void shouldSubmitOvertimeRequest() throws Exception {
            RequestDTO request = RequestDTO.builder()
                    .overtimeDate(LocalDate.now())
                    .overtimeHours(3.0)
                    .reason("Urgent project delivery")
                    .build();

            mockMvc.perform(post("/api/employee/requests/overtime")
                    .header("Authorization", "Bearer " + employeeToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Overtime request submitted"))
                    .andExpect(jsonPath("$.data.requestType").value("OVERTIME"))
                    .andExpect(jsonPath("$.data.status").value("SUBMITTED"))
                    .andExpect(jsonPath("$.data.overtimeHours").value(3.0));
        }
    }

    @Nested
    @DisplayName("Payslip Tests")
    class PayslipTests {

        @Test
        @DisplayName("Should get payslips for processed payroll")
        void shouldGetPayslips() throws Exception {
            // Create a processed payroll first
            PayrollRun payrollRun = createPayrollRun(LocalDate.now().getMonthValue(), 
                    LocalDate.now().getYear(), PayrollStatus.PROCESSED);

            mockMvc.perform(get("/api/employee/payslip/my")
                    .header("Authorization", "Bearer " + employeeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
        }

        @Test
        @DisplayName("Should get specific payslip by month and year")
        void shouldGetSpecificPayslip() throws Exception {
            int month = LocalDate.now().getMonthValue();
            int year = LocalDate.now().getYear();
            
            // Create a processed payroll first
            createPayrollRun(month, year, PayrollStatus.PROCESSED);

            mockMvc.perform(get("/api/employee/payslip/my/" + month + "/" + year)
                    .header("Authorization", "Bearer " + employeeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.month").value(month))
                    .andExpect(jsonPath("$.data.year").value(year))
                    .andExpect(jsonPath("$.data.netPay").isNumber());
        }

        @Test
        @DisplayName("Should fail to get payslip for unprocessed payroll")
        void shouldFailToGetUnprocessedPayslip() throws Exception {
            int month = 6;  // Use a month that doesn't have processed payroll
            int year = 2024;
            
            // Create an unprocessed payroll
            createPayrollRun(month, year, PayrollStatus.COMPUTED);

            mockMvc.perform(get("/api/employee/payslip/my/" + month + "/" + year)
                    .header("Authorization", "Bearer " + employeeToken))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should download payslip as PDF")
        void shouldDownloadPayslipPdf() throws Exception {
            int month = LocalDate.now().getMonthValue();
            int year = LocalDate.now().getYear();
            
            // Create a processed payroll first
            createPayrollRun(month, year, PayrollStatus.PROCESSED);

            mockMvc.perform(get("/api/employee/payslip/my/" + month + "/" + year + "/download")
                    .header("Authorization", "Bearer " + employeeToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_PDF));
        }
    }
}

package com.staffwise.hrms.controller;

import com.staffwise.hrms.BaseIntegrationTest;
import com.staffwise.hrms.dto.AuthRequest;
import com.staffwise.hrms.dto.PayrollActionDTO;
import com.staffwise.hrms.entity.PayrollRun;
import com.staffwise.hrms.entity.PayrollStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Comprehensive tests for PayrollController - View, Check, Authorize, Process payroll runs.
 * Tests complete payroll workflow from computation to final processing.
 */
class PayrollControllerTest extends BaseIntegrationTest {

    private String hrToken;
    private String checkerToken;
    private String payrollAdminToken;
    private String adminToken;
    private String employeeToken;

    @BeforeEach
    @Override
    public void setUp() {
        super.setUp();
        hrToken = getAuthToken("hr@test.com", "Hr@123456");
        checkerToken = getAuthToken("checker@test.com", "Checker@123");
        payrollAdminToken = getAuthToken("payrolladmin@test.com", "PayrollAdmin@123");
        adminToken = getAuthToken("admin@test.com", "Admin@123");
        employeeToken = getAuthToken("employee@test.com", "Employee@123");
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
    @DisplayName("View Payroll Runs Tests")
    class ViewPayrollRunsTests {

        @Test
        @DisplayName("Should get all payroll runs as HR")
        void shouldGetAllPayrollRunsAsHr() throws Exception {
            createPayrollRun(8, 2025, PayrollStatus.COMPUTED);

            mockMvc.perform(get("/api/payroll/view/runs")
                    .header("Authorization", "Bearer " + hrToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
        }

        @Test
        @DisplayName("Should get all payroll runs as Payroll Checker")
        void shouldGetAllPayrollRunsAsChecker() throws Exception {
            createPayrollRun(9, 2025, PayrollStatus.COMPUTED);

            mockMvc.perform(get("/api/payroll/view/runs")
                    .header("Authorization", "Bearer " + checkerToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray());
        }

        @Test
        @DisplayName("Should get all payroll runs as Payroll Admin")
        void shouldGetAllPayrollRunsAsPayrollAdmin() throws Exception {
            mockMvc.perform(get("/api/payroll/view/runs")
                    .header("Authorization", "Bearer " + payrollAdminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("Should get payroll run by ID with details")
        void shouldGetPayrollRunById() throws Exception {
            PayrollRun payrollRun = createPayrollRun(10, 2025, PayrollStatus.COMPUTED);

            mockMvc.perform(get("/api/payroll/view/runs/" + payrollRun.getId())
                    .header("Authorization", "Bearer " + hrToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(payrollRun.getId()))
                    .andExpect(jsonPath("$.data.month").value(10))
                    .andExpect(jsonPath("$.data.year").value(2025))
                    .andExpect(jsonPath("$.data.status").value("COMPUTED"));
        }

        @Test
        @DisplayName("Should get payroll details for a run")
        void shouldGetPayrollDetails() throws Exception {
            PayrollRun payrollRun = createPayrollRun(11, 2025, PayrollStatus.COMPUTED);

            mockMvc.perform(get("/api/payroll/view/runs/" + payrollRun.getId() + "/details")
                    .header("Authorization", "Bearer " + hrToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data", hasSize(5))) // 5 employees
                    .andExpect(jsonPath("$.data[*].employeeName").isNotEmpty())
                    .andExpect(jsonPath("$.data[*].basicSalary").isNotEmpty())
                    .andExpect(jsonPath("$.data[*].netPay").isNotEmpty());
        }

        @Test
        @DisplayName("Should deny view access to regular employee")
        void shouldDenyViewToEmployee() throws Exception {
            mockMvc.perform(get("/api/payroll/view/runs")
                    .header("Authorization", "Bearer " + employeeToken))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("Payroll Check Tests")
    class PayrollCheckTests {

        @Test
        @DisplayName("Should get pending payrolls for checking")
        void shouldGetPendingForChecking() throws Exception {
            createPayrollRun(1, 2024, PayrollStatus.COMPUTED);

            mockMvc.perform(get("/api/payroll/check/pending")
                    .header("Authorization", "Bearer " + checkerToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[*].status", everyItem(anyOf(is("COMPUTED"), is("REJECTED")))));
        }

        @Test
        @DisplayName("Should check/approve payroll")
        void shouldCheckPayroll() throws Exception {
            PayrollRun payrollRun = createPayrollRun(2, 2024, PayrollStatus.COMPUTED);

            PayrollActionDTO action = PayrollActionDTO.builder()
                    .payrollRunId(payrollRun.getId())
                    .remarks("Verified and approved")
                    .build();

            mockMvc.perform(post("/api/payroll/check/approve")
                    .header("Authorization", "Bearer " + checkerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(action)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Payroll checked and approved"))
                    .andExpect(jsonPath("$.data.status").value("CHECKED"))
                    .andExpect(jsonPath("$.data.checkedBy").value("checker@test.com"));
        }

        @Test
        @DisplayName("Should reject payroll at check stage")
        void shouldRejectPayrollAtCheck() throws Exception {
            PayrollRun payrollRun = createPayrollRun(3, 2024, PayrollStatus.COMPUTED);

            PayrollActionDTO action = PayrollActionDTO.builder()
                    .payrollRunId(payrollRun.getId())
                    .remarks("Error in calculations for employee X")
                    .build();

            mockMvc.perform(post("/api/payroll/check/reject")
                    .header("Authorization", "Bearer " + checkerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(action)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Payroll rejected"))
                    .andExpect(jsonPath("$.data.status").value("REJECTED"))
                    .andExpect(jsonPath("$.data.checkerRemarks").value("Error in calculations for employee X"));
        }

        @Test
        @DisplayName("Should deny check access to HR")
        void shouldDenyCheckToHr() throws Exception {
            PayrollRun payrollRun = createPayrollRun(4, 2024, PayrollStatus.COMPUTED);

            mockMvc.perform(get("/api/payroll/check/pending")
                    .header("Authorization", "Bearer " + hrToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should allow System Admin to check payroll")
        void shouldAllowAdminToCheck() throws Exception {
            PayrollRun payrollRun = createPayrollRun(5, 2024, PayrollStatus.COMPUTED);

            PayrollActionDTO action = PayrollActionDTO.builder()
                    .payrollRunId(payrollRun.getId())
                    .remarks("Admin approved")
                    .build();

            mockMvc.perform(post("/api/payroll/check/approve")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(action)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("CHECKED"));
        }
    }

    @Nested
    @DisplayName("Payroll Authorization Tests")
    class PayrollAuthorizationTests {

        @Test
        @DisplayName("Should get pending payrolls for authorization")
        void shouldGetPendingForAuthorization() throws Exception {
            PayrollRun payrollRun = createPayrollRun(6, 2024, PayrollStatus.COMPUTED);
            // Move to CHECKED status
            payrollRun.setStatus(PayrollStatus.CHECKED);
            payrollRun.setCheckedBy(payrollChecker.getEmail());
            payrollRun.setCheckedAt(LocalDateTime.now());
            payrollRunRepository.save(payrollRun);

            mockMvc.perform(get("/api/payroll/authorize/pending")
                    .header("Authorization", "Bearer " + payrollAdminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[*].status", everyItem(is("CHECKED"))));
        }

        @Test
        @DisplayName("Should authorize and process payroll in single step")
        void shouldAuthorizeAndProcessPayroll() throws Exception {
            PayrollRun payrollRun = createPayrollRun(7, 2024, PayrollStatus.COMPUTED);
            payrollRun.setStatus(PayrollStatus.CHECKED);
            payrollRun.setCheckedBy(payrollChecker.getEmail());
            payrollRun.setCheckedAt(LocalDateTime.now());
            payrollRunRepository.save(payrollRun);

            PayrollActionDTO action = PayrollActionDTO.builder()
                    .payrollRunId(payrollRun.getId())
                    .remarks("Authorized for processing")
                    .build();

            mockMvc.perform(post("/api/payroll/authorize/approve")
                    .header("Authorization", "Bearer " + payrollAdminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(action)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Payroll authorized"))
                    .andExpect(jsonPath("$.data.status").value("PROCESSED"))
                    .andExpect(jsonPath("$.data.authorizedBy").value("payrolladmin@test.com"))
                    .andExpect(jsonPath("$.data.processedBy").value("payrolladmin@test.com"))
                    .andExpect(jsonPath("$.data.isLocked").value(true));
        }

        @Test
        @DisplayName("Should reject payroll at authorization stage")
        void shouldRejectPayrollAtAuthorization() throws Exception {
            PayrollRun payrollRun = createPayrollRun(8, 2024, PayrollStatus.COMPUTED);
            payrollRun.setStatus(PayrollStatus.CHECKED);
            payrollRun.setCheckedBy(payrollChecker.getEmail());
            payrollRun.setCheckedAt(LocalDateTime.now());
            payrollRunRepository.save(payrollRun);

            PayrollActionDTO action = PayrollActionDTO.builder()
                    .payrollRunId(payrollRun.getId())
                    .remarks("Budget constraints - rejected")
                    .build();

            mockMvc.perform(post("/api/payroll/authorize/reject")
                    .header("Authorization", "Bearer " + payrollAdminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(action)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Payroll rejected"))
                    .andExpect(jsonPath("$.data.status").value("REJECTED"));
        }

        @Test
        @DisplayName("Should fail to authorize unchecked payroll")
        void shouldFailToAuthorizeUncheckedPayroll() throws Exception {
            PayrollRun payrollRun = createPayrollRun(9, 2024, PayrollStatus.COMPUTED);

            PayrollActionDTO action = PayrollActionDTO.builder()
                    .payrollRunId(payrollRun.getId())
                    .build();

            mockMvc.perform(post("/api/payroll/authorize/approve")
                    .header("Authorization", "Bearer " + payrollAdminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(action)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should deny authorization access to Payroll Checker")
        void shouldDenyAuthorizationToChecker() throws Exception {
            mockMvc.perform(get("/api/payroll/authorize/pending")
                    .header("Authorization", "Bearer " + checkerToken))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("Payroll Processing Tests")
    class PayrollProcessingTests {

        @Test
        @DisplayName("Should get pending payrolls for processing")
        void shouldGetPendingForProcessing() throws Exception {
            PayrollRun payrollRun = createPayrollRun(10, 2024, PayrollStatus.COMPUTED);
            payrollRun.setStatus(PayrollStatus.AUTHORIZED);
            payrollRun.setCheckedBy(payrollChecker.getEmail());
            payrollRun.setCheckedAt(LocalDateTime.now());
            payrollRun.setAuthorizedBy(payrollAdmin.getEmail());
            payrollRun.setAuthorizedAt(LocalDateTime.now());
            payrollRunRepository.save(payrollRun);

            mockMvc.perform(get("/api/payroll/process/pending")
                    .header("Authorization", "Bearer " + payrollAdminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[*].status", everyItem(is("AUTHORIZED"))));
        }

        @Test
        @DisplayName("Should process payroll and lock it")
        void shouldProcessPayroll() throws Exception {
            PayrollRun payrollRun = createPayrollRun(11, 2024, PayrollStatus.COMPUTED);
            payrollRun.setStatus(PayrollStatus.AUTHORIZED);
            payrollRun.setCheckedBy(payrollChecker.getEmail());
            payrollRun.setCheckedAt(LocalDateTime.now());
            payrollRun.setAuthorizedBy(payrollAdmin.getEmail());
            payrollRun.setAuthorizedAt(LocalDateTime.now());
            payrollRunRepository.save(payrollRun);

            PayrollActionDTO action = PayrollActionDTO.builder()
                    .payrollRunId(payrollRun.getId())
                    .build();

            mockMvc.perform(post("/api/payroll/process/execute")
                    .header("Authorization", "Bearer " + payrollAdminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(action)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Payroll processed and locked"))
                    .andExpect(jsonPath("$.data.status").value("PROCESSED"))
                    .andExpect(jsonPath("$.data.isLocked").value(true))
                    .andExpect(jsonPath("$.data.processedBy").value("payrolladmin@test.com"));
        }

        @Test
        @DisplayName("Should fail to process unauthorized payroll")
        void shouldFailToProcessUnauthorizedPayroll() throws Exception {
            PayrollRun payrollRun = createPayrollRun(12, 2024, PayrollStatus.CHECKED);

            PayrollActionDTO action = PayrollActionDTO.builder()
                    .payrollRunId(payrollRun.getId())
                    .build();

            mockMvc.perform(post("/api/payroll/process/execute")
                    .header("Authorization", "Bearer " + payrollAdminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(action)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should prevent duplicate processing")
        void shouldPreventDuplicateProcessing() throws Exception {
            PayrollRun payrollRun = createPayrollRun(1, 2023, PayrollStatus.PROCESSED);

            PayrollActionDTO action = PayrollActionDTO.builder()
                    .payrollRunId(payrollRun.getId())
                    .build();

            mockMvc.perform(post("/api/payroll/process/execute")
                    .header("Authorization", "Bearer " + payrollAdminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(action)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Complete Payroll Workflow Tests")
    class CompletePayrollWorkflowTests {

        @Test
        @DisplayName("Should complete entire payroll workflow with 2-step approval")
        void shouldCompleteEntireWorkflow() throws Exception {
            // Step 1: HR computes payroll
            String computeResponse = mockMvc.perform(post("/api/hr/payroll/compute")
                    .header("Authorization", "Bearer " + hrToken)
                    .param("month", "2")
                    .param("year", "2023"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("COMPUTED"))
                    .andReturn().getResponse().getContentAsString();

            Long payrollId = objectMapper.readTree(computeResponse).get("data").get("id").asLong();

            // Step 2: Payroll Checker checks the payroll
            PayrollActionDTO checkAction = PayrollActionDTO.builder()
                    .payrollRunId(payrollId)
                    .remarks("All calculations verified")
                    .build();

            mockMvc.perform(post("/api/payroll/check/approve")
                    .header("Authorization", "Bearer " + checkerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(checkAction)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("CHECKED"));

            // Step 3: Payroll Admin authorizes and processes in single step
            PayrollActionDTO authAction = PayrollActionDTO.builder()
                    .payrollRunId(payrollId)
                    .remarks("Approved for payment")
                    .build();

            mockMvc.perform(post("/api/payroll/authorize/approve")
                    .header("Authorization", "Bearer " + payrollAdminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(authAction)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("PROCESSED"))
                    .andExpect(jsonPath("$.data.isLocked").value(true));

            // Step 4: Verify employee can now view payslip
            mockMvc.perform(get("/api/employee/payslip/my/2/2023")
                    .header("Authorization", "Bearer " + employeeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.month").value(2))
                    .andExpect(jsonPath("$.data.year").value(2023));
        }

        @Test
        @DisplayName("Should handle rejection and re-approval workflow")
        void shouldHandleRejectionAndReapproval() throws Exception {
            // Step 1: HR computes payroll
            String computeResponse = mockMvc.perform(post("/api/hr/payroll/compute")
                    .header("Authorization", "Bearer " + hrToken)
                    .param("month", "3")
                    .param("year", "2023"))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            Long payrollId = objectMapper.readTree(computeResponse).get("data").get("id").asLong();

            // Step 2: Checker rejects
            PayrollActionDTO rejectAction = PayrollActionDTO.builder()
                    .payrollRunId(payrollId)
                    .remarks("Found discrepancy")
                    .build();

            mockMvc.perform(post("/api/payroll/check/reject")
                    .header("Authorization", "Bearer " + checkerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(rejectAction)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("REJECTED"));

            // Step 3: Checker can approve again after rejection is addressed
            PayrollActionDTO approveAction = PayrollActionDTO.builder()
                    .payrollRunId(payrollId)
                    .remarks("Issues resolved, approved now")
                    .build();

            mockMvc.perform(post("/api/payroll/check/approve")
                    .header("Authorization", "Bearer " + checkerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(approveAction)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("CHECKED"));
        }
    }

    @Nested
    @DisplayName("Payslip Download Tests")
    class PayslipDownloadTests {

        @Test
        @DisplayName("Should download payslip PDF for employee")
        void shouldDownloadPayslipPdf() throws Exception {
            PayrollRun payrollRun = createPayrollRun(4, 2023, PayrollStatus.PROCESSED);

            mockMvc.perform(get("/api/payroll/payslip/" + regularEmployee.getId() + "/4/2023/download")
                    .header("Authorization", "Bearer " + hrToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_PDF));
        }
    }
}

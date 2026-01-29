package com.staffwise.hrms.controller;

import com.staffwise.hrms.BaseIntegrationTest;
import com.staffwise.hrms.dto.AuthRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Comprehensive tests for AuthController - Login, token refresh, and logout functionality.
 */
class AuthControllerTest extends BaseIntegrationTest {

    @Nested
    @DisplayName("Login Tests")
    class LoginTests {

        @Test
        @DisplayName("Should login successfully with valid credentials")
        void shouldLoginSuccessfully() throws Exception {
            AuthRequest request = AuthRequest.builder()
                    .email("admin@test.com")
                    .password("Admin@123")
                    .encrypted(false)
                    .build();

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Login successful"))
                    .andExpect(jsonPath("$.data.token").isNotEmpty())
                    .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                    .andExpect(jsonPath("$.data.email").value("admin@test.com"))
                    .andExpect(jsonPath("$.data.role").value("SYSTEM_ADMIN"))
                    .andExpect(jsonPath("$.data.empCode").value("TEST001"))
                    .andExpect(jsonPath("$.data.fullName").value("Test Admin"));
        }

        @Test
        @DisplayName("Should login as HR user with correct role")
        void shouldLoginAsHrUser() throws Exception {
            AuthRequest request = AuthRequest.builder()
                    .email("hr@test.com")
                    .password("Hr@123456")
                    .encrypted(false)
                    .build();

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.role").value("HR"))
                    .andExpect(jsonPath("$.data.fullName").value("Test HR"));
        }

        @Test
        @DisplayName("Should login as Payroll Checker with correct role")
        void shouldLoginAsPayrollChecker() throws Exception {
            AuthRequest request = AuthRequest.builder()
                    .email("checker@test.com")
                    .password("Checker@123")
                    .encrypted(false)
                    .build();

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.role").value("PAYROLL_CHECKER"));
        }

        @Test
        @DisplayName("Should login as Payroll Admin with correct role")
        void shouldLoginAsPayrollAdmin() throws Exception {
            AuthRequest request = AuthRequest.builder()
                    .email("payrolladmin@test.com")
                    .password("PayrollAdmin@123")
                    .encrypted(false)
                    .build();

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.role").value("PAYROLL_ADMIN"));
        }

        @Test
        @DisplayName("Should login as Employee with correct role")
        void shouldLoginAsEmployee() throws Exception {
            AuthRequest request = AuthRequest.builder()
                    .email("employee@test.com")
                    .password("Employee@123")
                    .encrypted(false)
                    .build();

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.role").value("EMPLOYEE"));
        }

        @Test
        @DisplayName("Should fail login with invalid password")
        void shouldFailLoginWithInvalidPassword() throws Exception {
            AuthRequest request = AuthRequest.builder()
                    .email("admin@test.com")
                    .password("WrongPassword")
                    .encrypted(false)
                    .build();

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(request)))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Should fail login with non-existent email")
        void shouldFailLoginWithNonExistentEmail() throws Exception {
            AuthRequest request = AuthRequest.builder()
                    .email("nonexistent@test.com")
                    .password("Password@123")
                    .encrypted(false)
                    .build();

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(request)))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Should return department information in login response")
        void shouldReturnDepartmentInformation() throws Exception {
            AuthRequest request = AuthRequest.builder()
                    .email("admin@test.com")
                    .password("Admin@123")
                    .encrypted(false)
                    .build();

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.department").value("Test Department"));
        }
    }

    @Nested
    @DisplayName("Token Refresh Tests")
    class TokenRefreshTests {

        @Test
        @DisplayName("Should refresh token successfully")
        void shouldRefreshTokenSuccessfully() throws Exception {
            // First login to get tokens
            AuthRequest loginRequest = AuthRequest.builder()
                    .email("admin@test.com")
                    .password("Admin@123")
                    .encrypted(false)
                    .build();

            String loginResponse = mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(asJsonString(loginRequest)))
                    .andExpect(status().isOk())
                    .andReturn()
                    .getResponse()
                    .getContentAsString();

            // Extract refresh token from response
            String refreshToken = objectMapper.readTree(loginResponse)
                    .get("data")
                    .get("refreshToken")
                    .asText();

            // Use refresh token to get new tokens
            mockMvc.perform(post("/api/auth/refresh")
                    .header("Authorization", "Bearer " + refreshToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.token").isNotEmpty())
                    .andExpect(jsonPath("$.data.refreshToken").isNotEmpty());
        }

        @Test
        @DisplayName("Should fail refresh with invalid token")
        void shouldFailRefreshWithInvalidToken() throws Exception {
            mockMvc.perform(post("/api/auth/refresh")
                    .header("Authorization", "Bearer invalid_token"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }

    @Nested
    @DisplayName("Logout Tests")
    class LogoutTests {

        @Test
        @DisplayName("Should logout successfully")
        void shouldLogoutSuccessfully() throws Exception {
            mockMvc.perform(post("/api/auth/logout"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Logged out successfully"));
        }
    }
}

package com.staffwise.hrms.controller;

import com.staffwise.hrms.dto.ApiResponse;
import com.staffwise.hrms.dto.AuthRequest;
import com.staffwise.hrms.dto.AuthResponse;
import com.staffwise.hrms.entity.Employee;
import com.staffwise.hrms.exception.TooManyLoginAttemptsException;
import com.staffwise.hrms.repository.EmployeeRepository;
import com.staffwise.hrms.security.JwtTokenProvider;
import com.staffwise.hrms.security.LoginAttemptService;
import com.staffwise.hrms.service.AuditService;
import com.staffwise.hrms.util.CryptoUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmployeeRepository employeeRepository;
    private final AuditService auditService;
    private final LoginAttemptService loginAttemptService;

    @PostMapping("/login")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @RequestBody AuthRequest request,
            HttpServletRequest httpRequest) {
        
        String clientIp = getClientIP(httpRequest);
        
        // Check rate limiting - prevent brute force attacks
        if (loginAttemptService.isBlocked(request.getEmail(), clientIp)) {
            log.warn("Login blocked due to too many attempts: email={}, ip={}", request.getEmail(), clientIp);
            throw new TooManyLoginAttemptsException(
                    "Too many login attempts. Please try again after " + 
                    loginAttemptService.getLockoutDurationMinutes() + " minutes.",
                    loginAttemptService.getLockoutDurationMinutes()
            );
        }
        
        try {
            // Decrypt password if it was encrypted on frontend
            String password = request.isEncrypted() 
                ? CryptoUtil.decryptPassword(request.getPassword()) 
                : request.getPassword();
            
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), password)
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            String token = jwtTokenProvider.generateToken(authentication);
            String refreshToken = jwtTokenProvider.generateRefreshToken(request.getEmail());

            Employee employee = employeeRepository.findByEmailWithDepartment(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("Employee not found"));

            AuthResponse response = AuthResponse.builder()
                    .token(token)
                    .refreshToken(refreshToken)
                    .employeeId(employee.getId())
                    .empCode(employee.getEmpCode())
                    .fullName(employee.getFullName())
                    .email(employee.getEmail())
                    .role(employee.getRole())
                    .department(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                    .build();

            // Clear failed attempts on successful login
            loginAttemptService.loginSucceeded(request.getEmail(), clientIp);
            auditService.logAction("Employee", employee.getId(), "LOGIN", employee.getEmail(), null, null);
            
            log.info("User logged in: {} from IP: {}", request.getEmail(), clientIp);
            return ResponseEntity.ok(ApiResponse.success("Login successful", response));
            
        } catch (BadCredentialsException e) {
            // Record failed login attempt
            loginAttemptService.loginFailed(request.getEmail(), clientIp);
            int remaining = loginAttemptService.getRemainingAttempts(clientIp);
            log.warn("Failed login attempt for: {} from IP: {} ({} attempts remaining)", 
                    request.getEmail(), clientIp, remaining);
            throw e;
        }
    }
    
    /**
     * Extract client IP address, handling proxy headers
     */
    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @PostMapping("/refresh")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@RequestHeader("Authorization") String refreshToken) {
        if (refreshToken != null && refreshToken.startsWith("Bearer ")) {
            refreshToken = refreshToken.substring(7);
        }

        if (!jwtTokenProvider.validateToken(refreshToken)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid refresh token"));
        }

        String email = jwtTokenProvider.getEmailFromToken(refreshToken);
        String newToken = jwtTokenProvider.generateToken(email);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(email);

        Employee employee = employeeRepository.findByEmailWithDepartment(email)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        AuthResponse response = AuthResponse.builder()
                .token(newToken)
                .refreshToken(newRefreshToken)
                .employeeId(employee.getId())
                .empCode(employee.getEmpCode())
                .fullName(employee.getFullName())
                .email(employee.getEmail())
                .role(employee.getRole())
                .department(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                .build();

        return ResponseEntity.ok(ApiResponse.success("Token refreshed", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout() {
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }
}

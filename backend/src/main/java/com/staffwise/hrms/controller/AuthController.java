package com.staffwise.hrms.controller;

import com.staffwise.hrms.dto.ApiResponse;
import com.staffwise.hrms.dto.AuthRequest;
import com.staffwise.hrms.dto.AuthResponse;
import com.staffwise.hrms.entity.Employee;
import com.staffwise.hrms.repository.EmployeeRepository;
import com.staffwise.hrms.security.JwtTokenProvider;
import com.staffwise.hrms.service.AuditService;
import com.staffwise.hrms.util.CryptoUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
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

    @PostMapping("/login")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody AuthRequest request) {
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

        auditService.logAction("Employee", employee.getId(), "LOGIN", employee.getEmail(), null, null);
        
        log.info("User logged in: {}", request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
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

package com.staffwise.hrms.dto;

import com.staffwise.hrms.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private String refreshToken;
    private Long employeeId;
    private String empCode;
    private String fullName;
    private String email;
    private Role role;
    private String department;
}

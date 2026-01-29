package com.staffwise.hrms.dto;

import com.staffwise.hrms.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeDTO {
    private Long id;
    
    @NotBlank(message = "Employee code is required")
    private String empCode;
    
    @NotBlank(message = "First name is required")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    private String lastName;
    
    // Computed full name for frontend
    private String fullName;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    private String phoneNumber;
    private LocalDate dateOfBirth;
    private LocalDate dateOfJoining;
    private Long departmentId;
    private String departmentName;
    private String designation;
    
    @NotNull(message = "Role is required")
    private Role role;
    
    private Double basicSalary;
    private Boolean isActive;
    private Boolean active; // Alias for frontend compatibility
    private Long managerId;
    private String managerName;
    private String address;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private String bankAccountNumber;
    private String bankName;
    private String ifscCode;
    private String panNumber;
    
    // For creating new employee
    private String password;
}

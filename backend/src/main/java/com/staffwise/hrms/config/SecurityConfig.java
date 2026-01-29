package com.staffwise.hrms.config;

import com.staffwise.hrms.security.JwtAuthenticationEntryPoint;
import com.staffwise.hrms.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationEntryPoint authenticationEntryPoint;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configure(http))
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(authenticationEntryPoint))
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                
                // Employee endpoints - accessible by all authenticated users
                .requestMatchers("/api/employee/profile/**").authenticated()
                .requestMatchers("/api/employee/attendance/my/**").authenticated()
                .requestMatchers("/api/employee/requests/my/**").authenticated()
                .requestMatchers("/api/employee/leaves/my/**").authenticated()
                .requestMatchers("/api/employee/payslip/my/**").authenticated()
                
                // HR endpoints
                .requestMatchers("/api/hr/**").hasAnyRole("HR", "SYSTEM_ADMIN")
                
                // Payroll Checker endpoints
                .requestMatchers("/api/payroll/check/**").hasAnyRole("PAYROLL_CHECKER", "SYSTEM_ADMIN")
                
                // Payroll Admin endpoints
                .requestMatchers("/api/payroll/authorize/**").hasAnyRole("PAYROLL_ADMIN", "SYSTEM_ADMIN")
                .requestMatchers("/api/payroll/process/**").hasAnyRole("PAYROLL_ADMIN", "SYSTEM_ADMIN")
                
                // Payroll view - accessible by HR and Payroll roles
                .requestMatchers("/api/payroll/view/**").hasAnyRole("HR", "PAYROLL_CHECKER", "PAYROLL_ADMIN", "SYSTEM_ADMIN")
                
                // Admin endpoints
                .requestMatchers("/api/admin/**").hasRole("SYSTEM_ADMIN")
                
                // All other requests need authentication
                .anyRequest().authenticated()
            );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}

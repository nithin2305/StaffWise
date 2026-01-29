package com.staffwise.hrms.security;

import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

/**
 * Service to track and limit login attempts to prevent brute force attacks.
 * 
 * Features:
 * - Tracks failed login attempts per IP and email
 * - Blocks login after MAX_ATTEMPTS (5) failed attempts
 * - Auto-unblocks after 15 minutes
 * 
 * This is a security improvement to protect against:
 * - Brute force attacks
 * - Credential stuffing
 * - Dictionary attacks
 */
@Service
public class LoginAttemptService {

    // Maximum number of failed attempts before lockout
    private static final int MAX_ATTEMPTS = 5;
    
    // Lockout duration in minutes
    private static final int LOCKOUT_DURATION_MINUTES = 15;

    // Cache for tracking attempts by IP address
    private final LoadingCache<String, Integer> attemptsByIp;
    
    // Cache for tracking attempts by email
    private final LoadingCache<String, Integer> attemptsByEmail;

    public LoginAttemptService() {
        attemptsByIp = CacheBuilder.newBuilder()
                .expireAfterWrite(LOCKOUT_DURATION_MINUTES, TimeUnit.MINUTES)
                .build(new CacheLoader<String, Integer>() {
                    @Override
                    public Integer load(String key) {
                        return 0;
                    }
                });

        attemptsByEmail = CacheBuilder.newBuilder()
                .expireAfterWrite(LOCKOUT_DURATION_MINUTES, TimeUnit.MINUTES)
                .build(new CacheLoader<String, Integer>() {
                    @Override
                    public Integer load(String key) {
                        return 0;
                    }
                });
    }

    /**
     * Record a successful login - clears all failed attempts
     */
    public void loginSucceeded(String email, String ip) {
        attemptsByIp.invalidate(ip);
        attemptsByEmail.invalidate(email.toLowerCase());
    }

    /**
     * Record a failed login attempt
     */
    public void loginFailed(String email, String ip) {
        try {
            int ipAttempts = attemptsByIp.get(ip);
            attemptsByIp.put(ip, ipAttempts + 1);
            
            if (email != null && !email.isEmpty()) {
                int emailAttempts = attemptsByEmail.get(email.toLowerCase());
                attemptsByEmail.put(email.toLowerCase(), emailAttempts + 1);
            }
        } catch (ExecutionException e) {
            // Fail safe - don't block on cache error
        }
    }

    /**
     * Check if an IP address is currently blocked
     */
    public boolean isIpBlocked(String ip) {
        try {
            return attemptsByIp.get(ip) >= MAX_ATTEMPTS;
        } catch (ExecutionException e) {
            return false;
        }
    }

    /**
     * Check if an email is currently blocked
     */
    public boolean isEmailBlocked(String email) {
        try {
            return attemptsByEmail.get(email.toLowerCase()) >= MAX_ATTEMPTS;
        } catch (ExecutionException e) {
            return false;
        }
    }

    /**
     * Check if login should be blocked
     */
    public boolean isBlocked(String email, String ip) {
        return isIpBlocked(ip) || isEmailBlocked(email);
    }

    /**
     * Get remaining attempts for an IP
     */
    public int getRemainingAttempts(String ip) {
        try {
            return Math.max(0, MAX_ATTEMPTS - attemptsByIp.get(ip));
        } catch (ExecutionException e) {
            return MAX_ATTEMPTS;
        }
    }

    /**
     * Get the lockout duration in minutes
     */
    public int getLockoutDurationMinutes() {
        return LOCKOUT_DURATION_MINUTES;
    }
}

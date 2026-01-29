package com.staffwise.hrms.util;

import java.util.Base64;

public class CryptoUtil {
    
    // Same key as frontend - in production, use environment variable
    private static final String ENCRYPTION_KEY = "StaffWise2026SecureKey!";

    /**
     * Decrypts password that was encrypted on the frontend
     * Uses Base64 decoding followed by XOR decryption
     */
    public static String decryptPassword(String encryptedPassword) {
        try {
            // First Base64 decode
            byte[] decoded = Base64.getDecoder().decode(encryptedPassword);
            String obfuscated = new String(decoded);
            
            // Then XOR decode (XOR is symmetric)
            return xorDecode(obfuscated, ENCRYPTION_KEY);
        } catch (Exception e) {
            // If decryption fails, return as-is (might be plain text)
            return encryptedPassword;
        }
    }

    /**
     * XOR decoding (symmetric with encoding)
     */
    private static String xorDecode(String str, String key) {
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < str.length(); i++) {
            result.append((char) (str.charAt(i) ^ key.charAt(i % key.length())));
        }
        return result.toString();
    }
}

package com.staffwise.hrms.util;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Base64;

/**
 * Utility class for password encryption/decryption.
 * 
 * Uses AES-256-CBC encryption for secure password transmission.
 * The encryption key is derived from a secret phrase using SHA-256.
 * 
 * IMPORTANT: In production, the secret should be loaded from environment variables.
 */
public class CryptoUtil {
    
    // Secret for key derivation - in production, use environment variable
    private static final String SECRET = "StaffWise2026SecureKey!@#$%";
    
    // AES configuration
    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final String AES = "AES";
    
    // Fixed IV for consistent encryption (in production, use random IV sent with ciphertext)
    private static final byte[] IV = "StaffWiseIV12345".getBytes(StandardCharsets.UTF_8);

    /**
     * Decrypts password that was encrypted on the frontend using AES.
     * Falls back to legacy XOR decryption for backward compatibility.
     */
    public static String decryptPassword(String encryptedPassword) {
        if (encryptedPassword == null || encryptedPassword.isEmpty()) {
            return encryptedPassword;
        }
        
        try {
            // Try AES decryption first (new format)
            return decryptAES(encryptedPassword);
        } catch (Exception e) {
            try {
                // Fall back to legacy XOR decryption for backward compatibility
                return decryptLegacy(encryptedPassword);
            } catch (Exception ex) {
                // If all decryption fails, return as-is (might be plain text)
                return encryptedPassword;
            }
        }
    }
    
    /**
     * Decrypt using AES-256-CBC
     */
    private static String decryptAES(String encryptedPassword) throws Exception {
        byte[] key = deriveKey(SECRET);
        SecretKeySpec secretKey = new SecretKeySpec(key, AES);
        IvParameterSpec ivSpec = new IvParameterSpec(IV);
        
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, secretKey, ivSpec);
        
        byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(encryptedPassword));
        return new String(decrypted, StandardCharsets.UTF_8);
    }
    
    /**
     * Encrypt password using AES (for testing purposes)
     */
    public static String encryptPassword(String password) {
        try {
            byte[] key = deriveKey(SECRET);
            SecretKeySpec secretKey = new SecretKeySpec(key, AES);
            IvParameterSpec ivSpec = new IvParameterSpec(IV);
            
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, ivSpec);
            
            byte[] encrypted = cipher.doFinal(password.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }
    
    /**
     * Derive AES key from secret using SHA-256
     */
    private static byte[] deriveKey(String secret) throws Exception {
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        byte[] key = sha.digest(secret.getBytes(StandardCharsets.UTF_8));
        // Use first 32 bytes (256 bits) for AES-256
        return Arrays.copyOf(key, 32);
    }
    
    /**
     * Legacy XOR decryption for backward compatibility
     */
    private static String decryptLegacy(String encryptedPassword) {
        String legacyKey = "StaffWise2026SecureKey!";
        byte[] decoded = Base64.getDecoder().decode(encryptedPassword);
        String obfuscated = new String(decoded, StandardCharsets.UTF_8);
        return xorDecode(obfuscated, legacyKey);
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


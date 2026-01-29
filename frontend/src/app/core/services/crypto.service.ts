import { Injectable } from '@angular/core';

/**
 * CryptoService provides password encryption for secure transmission.
 * Uses AES-256-CBC encryption matching the backend implementation.
 * 
 * This service ensures passwords are not transmitted in plain text,
 * even though HTTPS should already encrypt the transport layer.
 * This is defense-in-depth security.
 */
@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  // Secret for key derivation - must match backend
  private readonly SECRET = 'StaffWise2026SecureKey!@#$%';
  
  // Fixed IV for AES - must match backend (16 bytes for AES)
  private readonly IV = 'StaffWiseIV12345';

  /**
   * Encrypts password using AES-256-CBC encryption.
   * Falls back to XOR obfuscation if Web Crypto API is not available.
   */
  async encryptPasswordAsync(password: string): Promise<string> {
    try {
      // Try to use Web Crypto API for proper AES encryption
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        return await this.encryptAES(password);
      }
    } catch (e) {
      console.warn('Web Crypto API not available, using fallback encryption');
    }
    
    // Fallback to XOR obfuscation for older browsers
    return this.encryptPasswordLegacy(password);
  }

  /**
   * Synchronous encryption method (uses legacy XOR for simplicity)
   * For async AES encryption, use encryptPasswordAsync
   */
  encryptPassword(password: string): string {
    // Use legacy XOR for synchronous encryption
    // This maintains backward compatibility
    return this.encryptPasswordLegacy(password);
  }

  /**
   * AES-256-CBC encryption using Web Crypto API
   */
  private async encryptAES(password: string): Promise<string> {
    const encoder = new TextEncoder();
    
    // Derive key from secret using SHA-256
    const keyMaterial = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(this.SECRET)
    );
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'AES-CBC' },
      false,
      ['encrypt']
    );
    
    const iv = encoder.encode(this.IV);
    const data = encoder.encode(password);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      key,
      data
    );
    
    // Convert to base64
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }

  /**
   * Legacy XOR + Base64 encryption (fallback)
   */
  private encryptPasswordLegacy(password: string): string {
    const legacyKey = 'StaffWise2026SecureKey!';
    const obfuscated = this.xorEncode(password, legacyKey);
    return btoa(obfuscated);
  }

  /**
   * XOR encoding for obfuscation
   */
  private xorEncode(str: string, key: string): string {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }
}

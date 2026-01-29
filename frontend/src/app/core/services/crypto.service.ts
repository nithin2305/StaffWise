import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  // Use a fixed key for encoding (in production, this should come from backend)
  private readonly ENCRYPTION_KEY = 'StaffWise2026SecureKey!';

  /**
   * Encrypts password using Base64 encoding with XOR obfuscation
   * This provides transport-level obfuscation so password isn't visible in plain text
   */
  encryptPassword(password: string): string {
    // XOR the password with the key
    const obfuscated = this.xorEncode(password, this.ENCRYPTION_KEY);
    // Then Base64 encode it
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

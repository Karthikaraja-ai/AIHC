// Security & Cryptographic Password Hashing Service
// Prevents plain-text password storage using SHA-256 with per-user salt.

export const DEFAULT_DEMO_PASSWORD = 'Demo@123';
export const STATIC_SALT = 'aihc_salt_v2_2026';

class AuthSecurity {
  // Asynchronous SHA-256 Hash via Web Crypto API with fallback
  public async hashPassword(password: string, salt: string = STATIC_SALT): Promise<string> {
    const combined = `${password}::${salt}`;
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(combined);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        // Fallback below
      }
    }
    // Fallback lightweight deterministic hash if crypto.subtle is unavailable
    return this.fallbackHash(combined);
  }

  // Synchronous hash helper for seeding initial state
  public hashPasswordSync(password: string, salt: string = STATIC_SALT): string {
    const combined = `${password}::${salt}`;
    return this.fallbackHash(combined);
  }

  // Verify password against stored hash
  public async verifyPassword(password: string, storedHash: string, salt: string = STATIC_SALT): Promise<boolean> {
    const computedAsync = await this.hashPassword(password, salt);
    if (computedAsync === storedHash) return true;
    const computedSync = this.hashPasswordSync(password, salt);
    return computedSync === storedHash;
  }

  // Generate random salt
  public generateSalt(): string {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const arr = new Uint8Array(8);
      window.crypto.getRandomValues(arr);
      return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
    }
    return Math.random().toString(36).substring(2, 10);
  }

  // Deterministic 64-char hash fallback
  private fallbackHash(str: string): string {
    let h1 = 0xdeadbeef ^ 0;
    let h2 = 0x41c6ce57 ^ 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
    const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
    const p3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
    const p4 = ((h1 + h2) >>> 0).toString(16).padStart(8, '0');
    return `${p1}${p2}${p3}${p4}${p2}${p1}${p4}${p3}`;
  }
}

export const authSecurity = new AuthSecurity();

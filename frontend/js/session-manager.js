/**
 * HosteLink Session Manager
 * Capacitor-like preference system for temporary session buffering
 * Stores signup data during OTP verification flow (sessionStorage based)
 * No localStorage - all data cleared on browser close
 */

class HosteLinkSession {
  constructor() {
    // Session storage prefixes
    this.sessionPrefix = 'hostel_session_';
    this.signupPrefix = 'hostel_signup_';
    
    // Session keys
    this.authSessionKey = 'hostel_auth_session';
    this.userInfoKey = 'hostel_user_info';
    this.signupDataKey = 'hostel_signup_data'; // Temporary signup buffer
    this.otpJtiKey = 'hostel_otp_jti';
    this.otpRoleKey = 'hostel_otp_role';
  }

  // ========================================
  // AUTH SESSION MANAGEMENT
  // ========================================

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const session = this.getAuthSession();
    return session && session.token && session.userId;
  }

  /**
   * Get current auth session
   */
  getAuthSession() {
    const data = sessionStorage.getItem(this.authSessionKey);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Get current user info
   */
  getUserInfo() {
    const data = sessionStorage.getItem(this.userInfoKey);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Set auth session after successful login/OTP verification
   * Only uses sessionStorage (no localStorage)
   */
  setAuthSession(token, userId, userInfo) {
    const session = {
      token,
      userId,
      loginTime: new Date().getTime(),
      role: userInfo.role || 'student'
    };

    // Store in sessionStorage
    sessionStorage.setItem(this.authSessionKey, JSON.stringify(session));
    sessionStorage.setItem(this.userInfoKey, JSON.stringify(userInfo));

    // Clear signup data after successful auth
    this.clearSignupBuffer();
  }

  /**
   * Clear auth session (logout)
   */
  clearAuthSession() {
    sessionStorage.removeItem(this.authSessionKey);
    sessionStorage.removeItem(this.userInfoKey);
    this.clearSignupBuffer();
  }

  // ========================================
  // SIGNUP BUFFER MANAGEMENT (Temporary)
  // ========================================

  /**
   * Store signup data during registration (before OTP)
   * This is temporary and cleared after auth or browser close
   */
  setSignupBuffer(jti, credentials, role) {
    const buffer = {
      jti,
      credentials, // { name, email, password, phone }
      role,
      bufferedAt: new Date().getTime()
    };

    // Store all pieces separately for redundancy
    sessionStorage.setItem(this.signupDataKey, JSON.stringify(buffer));
    sessionStorage.setItem(this.otpJtiKey, jti);
    sessionStorage.setItem(this.otpRoleKey, role);
  }

  /**
   * Get signup buffer (OTP page will read this)
   */
  getSignupBuffer() {
    const data = sessionStorage.getItem(this.signupDataKey);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Get just the OTP JTI
   */
  getOtpJti() {
    return sessionStorage.getItem(this.otpJtiKey);
  }

  /**
   * Get signup role
   */
  getSignupRole() {
    return sessionStorage.getItem(this.otpRoleKey);
  }

  /**
   * Clear signup buffer (call after auth or timeout)
   */
  clearSignupBuffer() {
    sessionStorage.removeItem(this.signupDataKey);
    sessionStorage.removeItem(this.otpJtiKey);
    sessionStorage.removeItem(this.otpRoleKey);
  }

  /**
   * Check if signup buffer exists and is valid
   */
  hasValidSignupBuffer() {
    const buffer = this.getSignupBuffer();
    if (!buffer) return false;

    // Check if buffer is not too old (shouldn't be used after 30 minutes)
    const age = Date.now() - buffer.bufferedAt;
    const thirtyMinutes = 30 * 60 * 1000;
    return age < thirtyMinutes;
  }

  // ========================================
  // PREFERENCES API (Like Capacitor)
  // ========================================

  /**
   * Get value from sessionStorage (temporary preferences)
   * @param {string} key - preference key
   * @returns {Promise} - resolves to { key, value }
   */
  async getSession(key) {
    try {
      const prefixedKey = this.sessionPrefix + key;
      const value = sessionStorage.getItem(prefixedKey);
      return Promise.resolve({
        key,
        value: value ? JSON.parse(value) : null
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Set value in sessionStorage (temporary preferences)
   * @param {string} key - preference key
   * @param {*} value - value to store
   * @returns {Promise} - resolves to { key }
   */
  async setSession(key, value) {
    try {
      const prefixedKey = this.sessionPrefix + key;
      sessionStorage.setItem(prefixedKey, JSON.stringify(value));
      return Promise.resolve({ key });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Remove value from sessionStorage
   * @param {string} key - preference key
   * @returns {Promise} - resolves to { key }
   */
  async removeSession(key) {
    try {
      const prefixedKey = this.sessionPrefix + key;
      sessionStorage.removeItem(prefixedKey);
      return Promise.resolve({ key });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * List all sessionStorage keys with our prefix
   * @returns {Promise} - resolves to array of keys
   */
  async listSessionKeys() {
    try {
      const keys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.sessionPrefix)) {
          keys.push(key.replace(this.sessionPrefix, ''));
        }
      }
      return Promise.resolve(keys);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Clear all session preferences (but keep auth session)
   * @returns {Promise}
   */
  async clearSession() {
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.sessionPrefix)) {
          sessionStorage.removeItem(key);
        }
      }
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get all session data (for debugging)
   */
  getAllSessionData() {
    return {
      authSession: this.getAuthSession(),
      userInfo: this.getUserInfo(),
      signupBuffer: this.getSignupBuffer(),
      otpJti: this.getOtpJti(),
      otpRole: this.getSignupRole()
    };
  }

  /**
   * Clear everything (emergency cleanup)
   */
  clearAll() {
    this.clearAuthSession();
    this.clearSignupBuffer();
  }
}

// Create global instance
window.hostelSession = new HosteLinkSession();

import { supabase } from './supabase';

/**
 * MFA (Multi-Factor Authentication) Service
 * Handles 2FA operations using TOTP (Time-based One-Time Password)
 */
export const mfaService = {
  /**
   * Enroll user in MFA - generates QR code and secret
   * @returns {Promise<{qr: string, secret: string, uri: string}>}
   */
  async enrollMFA() {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      });

      if (error) throw error;

      return {
        id: data.id,
        qr: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri
      };
    } catch (error) {
      console.error('MFA enrollment error:', error);
      throw error;
    }
  },

  /**
   * Verify TOTP code during enrollment
   * @param {string} factorId - The factor ID from enrollment
   * @param {string} code - The 6-digit TOTP code
   * @returns {Promise<boolean>}
   */
  async verifyEnrollment(factorId, code) {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (error) throw error;

      const challengeId = data.id;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code
      });

      if (verifyError) throw verifyError;

      return true;
    } catch (error) {
      console.error('MFA verification error:', error);
      throw error;
    }
  },

  /**
   * List all enrolled MFA factors for current user
   * @returns {Promise<Array>}
   */
  async listFactors() {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) throw error;

      return data?.totp || [];
    } catch (error) {
      console.error('Error listing MFA factors:', error);
      throw error;
    }
  },

  /**
   * Unenroll from MFA
   * @param {string} factorId - The factor ID to unenroll
   * @returns {Promise<boolean>}
   */
  async unenrollMFA(factorId) {
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId
      });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('MFA unenroll error:', error);
      throw error;
    }
  },

  /**
   * Get MFA assurance level
   * @returns {Promise<'aal1'|'aal2'>}
   */
  async getAssuranceLevel() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      return session?.aal || 'aal1';
    } catch (error) {
      console.error('Error getting assurance level:', error);
      throw error;
    }
  },

  /**
   * Challenge for MFA verification (used during login)
   * @param {string} factorId - The factor ID to challenge
   * @returns {Promise<string>} Challenge ID
   */
  async createChallenge(factorId) {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('MFA challenge error:', error);
      throw error;
    }
  },

  /**
   * Verify MFA code during login
   * @param {string} factorId - The factor ID
   * @param {string} challengeId - The challenge ID
   * @param {string} code - The 6-digit TOTP code
   * @returns {Promise<boolean>}
   */
  async verifyChallenge(factorId, challengeId, code) {
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code
      });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('MFA verify challenge error:', error);
      throw error;
    }
  }
};
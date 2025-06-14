import { describe, it, expect } from 'vitest';
import { 
  validatePassword, 
  getPasswordStrength, 
  generateSecurePassword,
  PASSWORD_POLICY 
} from '../passwordPolicy';

describe('passwordPolicy', () => {
  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      const validPasswords = [
        'Test123!@#',
        'SecureP@ssw0rd',
        'MyStr0ng!Pass',
        'C0mplex!ty123'
      ];

      validPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject passwords that are too short', () => {
      const result = validatePassword('Test1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`비밀번호는 최소 ${PASSWORD_POLICY.minLength}자 이상이어야 합니다.`);
    });

    it('should reject passwords without uppercase letters', () => {
      const result = validatePassword('test123!@#');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('대문자를 포함해야 합니다.');
    });

    it('should reject passwords without lowercase letters', () => {
      const result = validatePassword('TEST123!@#');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('소문자를 포함해야 합니다.');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('TestPass!@#');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('숫자를 포함해야 합니다.');
    });

    it('should reject passwords without special characters', () => {
      const result = validatePassword('TestPass123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('특수문자를 포함해야 합니다.');
    });

    it('should reject common passwords', () => {
      const commonPasswords = [
        'password123!',
        'Password123!',
        'Qwerty123!',
        'Admin123!'
      ];

      commonPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('일반적인 비밀번호는 사용할 수 없습니다.');
      });
    });

    it('should reject passwords with repeating characters', () => {
      const result = validatePassword('Testttt123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('같은 문자가 3번 이상 반복될 수 없습니다.');
    });

    it('should allow passwords when policy is disabled', () => {
      const customPolicy = {
        ...PASSWORD_POLICY,
        requireUppercase: false,
        requireLowercase: false,
        requireNumbers: false,
        requireSpecialChars: false
      };

      const result = validatePassword('simplepassword', customPolicy);
      expect(result.isValid).toBe(true);
    });

    it('should return all applicable errors', () => {
      const result = validatePassword('abc');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });

    it('should calculate score correctly', () => {
      const weakPassword = validatePassword('Test1!');
      expect(weakPassword.score).toBeLessThan(50);

      const strongPassword = validatePassword('MyStr0ng!PassW0rd#2024');
      expect(strongPassword.score).toBeGreaterThan(80);
    });
  });

  describe('getPasswordStrength', () => {
    it('should return correct strength levels', () => {
      expect(getPasswordStrength(20)).toBe('weak');
      expect(getPasswordStrength(40)).toBe('fair');
      expect(getPasswordStrength(60)).toBe('good');
      expect(getPasswordStrength(80)).toBe('strong');
      expect(getPasswordStrength(95)).toBe('very-strong');
    });

    it('should handle edge cases', () => {
      expect(getPasswordStrength(0)).toBe('weak');
      expect(getPasswordStrength(100)).toBe('very-strong');
      expect(getPasswordStrength(-10)).toBe('weak');
      expect(getPasswordStrength(150)).toBe('very-strong');
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate passwords of specified length', () => {
      const lengths = [8, 12, 16, 20];
      
      lengths.forEach(length => {
        const password = generateSecurePassword({ length });
        expect(password).toHaveLength(length);
      });
    });

    it('should include all character types by default', () => {
      const password = generateSecurePassword();
      
      expect(/[A-Z]/.test(password)).toBe(true); // Uppercase
      expect(/[a-z]/.test(password)).toBe(true); // Lowercase
      expect(/[0-9]/.test(password)).toBe(true); // Numbers
      expect(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)).toBe(true); // Special chars
    });

    it('should respect character type options', () => {
      const passwordNoUppercase = generateSecurePassword({
        includeUppercase: false,
        length: 20
      });
      expect(/[A-Z]/.test(passwordNoUppercase)).toBe(false);

      const passwordNoNumbers = generateSecurePassword({
        includeNumbers: false,
        length: 20
      });
      expect(/[0-9]/.test(passwordNoNumbers)).toBe(false);

      const passwordNoSpecial = generateSecurePassword({
        includeSpecialChars: false,
        length: 20
      });
      expect(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(passwordNoSpecial)).toBe(false);
    });

    it('should exclude ambiguous characters when specified', () => {
      const password = generateSecurePassword({
        excludeAmbiguous: true,
        length: 100 // Long password to increase chance of catching ambiguous chars
      });
      
      const ambiguousChars = ['0', 'O', 'o', 'l', '1', 'I'];
      ambiguousChars.forEach(char => {
        expect(password).not.toContain(char);
      });
    });

    it('should exclude sequential characters when specified', () => {
      const password = generateSecurePassword({
        excludeSequential: true,
        length: 50
      });
      
      // Check for sequential patterns
      const sequentialPatterns = ['123', '234', 'abc', 'bcd', 'ABC', 'BCD'];
      sequentialPatterns.forEach(pattern => {
        expect(password).not.toContain(pattern);
      });
    });

    it('should generate valid passwords according to policy', () => {
      // Generate multiple passwords to ensure consistency
      for (let i = 0; i < 10; i++) {
        const password = generateSecurePassword();
        const validation = validatePassword(password);
        
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
        expect(validation.score).toBeGreaterThan(60);
      }
    });

    it('should generate unique passwords', () => {
      const passwords = new Set();
      const count = 100;
      
      for (let i = 0; i < count; i++) {
        passwords.add(generateSecurePassword());
      }
      
      // All passwords should be unique
      expect(passwords.size).toBe(count);
    });

    it('should handle edge case options', () => {
      // All character types disabled should still generate something
      const password = generateSecurePassword({
        includeUppercase: false,
        includeNumbers: false,
        includeSpecialChars: false,
        length: 10
      });
      
      expect(password).toHaveLength(10);
      expect(/^[a-z]+$/.test(password)).toBe(true);
    });
  });

  describe('PASSWORD_POLICY constant', () => {
    it('should have all required properties', () => {
      expect(PASSWORD_POLICY).toHaveProperty('minLength');
      expect(PASSWORD_POLICY).toHaveProperty('requireUppercase');
      expect(PASSWORD_POLICY).toHaveProperty('requireLowercase');
      expect(PASSWORD_POLICY).toHaveProperty('requireNumbers');
      expect(PASSWORD_POLICY).toHaveProperty('requireSpecialChars');
      expect(PASSWORD_POLICY).toHaveProperty('preventCommonPasswords');
      expect(PASSWORD_POLICY).toHaveProperty('preventRepeatingChars');
    });

    it('should have valid default values', () => {
      expect(PASSWORD_POLICY.minLength).toBeGreaterThanOrEqual(8);
      expect(typeof PASSWORD_POLICY.requireUppercase).toBe('boolean');
      expect(typeof PASSWORD_POLICY.requireLowercase).toBe('boolean');
      expect(typeof PASSWORD_POLICY.requireNumbers).toBe('boolean');
      expect(typeof PASSWORD_POLICY.requireSpecialChars).toBe('boolean');
      expect(typeof PASSWORD_POLICY.preventCommonPasswords).toBe('boolean');
      expect(typeof PASSWORD_POLICY.preventRepeatingChars).toBe('boolean');
    });
  });
});
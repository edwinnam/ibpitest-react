/**
 * Password Policy Configuration and Validation
 */

export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  preventCommonPasswords: true,
  preventRepeatingChars: true,
  maxRepeatingChars: 3,
  preventSequentialChars: true,
  maxSequentialChars: 3,
  preventUserInfo: true // Prevent using email parts in password
};

// Common weak passwords to check against
const COMMON_PASSWORDS = [
  'password', 'password123', '12345678', '123456789', 'qwerty', 'qwerty123',
  'admin', 'admin123', 'welcome', 'welcome123', 'test', 'test123',
  'abc123', 'password1', 'iloveyou', 'sunshine', 'monkey', 'dragon',
  '1234567890', 'football', 'baseball', 'master', 'hello', 'freedom',
  'whatever', 'shadow', 'superman', 'michael', 'ninja', 'mustang'
];

/**
 * Validate password against policy
 * @param {string} password - Password to validate
 * @param {string} email - User email (optional, for preventing email parts in password)
 * @returns {Object} Validation result with isValid and errors array
 */
export const validatePassword = (password, email = '') => {
  const errors = [];

  if (!password) {
    errors.push('비밀번호를 입력해주세요.');
    return { isValid: false, errors };
  }

  // Length checks
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`비밀번호는 최소 ${PASSWORD_POLICY.minLength}자 이상이어야 합니다.`);
  }
  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(`비밀번호는 ${PASSWORD_POLICY.maxLength}자를 초과할 수 없습니다.`);
  }

  // Character type checks
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('대문자를 최소 1개 이상 포함해야 합니다.');
  }
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('소문자를 최소 1개 이상 포함해야 합니다.');
  }
  if (PASSWORD_POLICY.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('숫자를 최소 1개 이상 포함해야 합니다.');
  }
  if (PASSWORD_POLICY.requireSpecialChars && 
      !new RegExp(`[${PASSWORD_POLICY.specialChars.replace(/[\[\]\\]/g, '\\$&')}]`).test(password)) {
    errors.push('특수문자(!@#$%^&* 등)를 최소 1개 이상 포함해야 합니다.');
  }

  // Common passwords check
  if (PASSWORD_POLICY.preventCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.includes(lowerPassword)) {
      errors.push('너무 일반적인 비밀번호입니다. 다른 비밀번호를 선택해주세요.');
    }
  }

  // Repeating characters check
  if (PASSWORD_POLICY.preventRepeatingChars) {
    const repeatingRegex = new RegExp(`(.)\\1{${PASSWORD_POLICY.maxRepeatingChars},}`);
    if (repeatingRegex.test(password)) {
      errors.push(`동일한 문자를 ${PASSWORD_POLICY.maxRepeatingChars}번 이상 연속으로 사용할 수 없습니다.`);
    }
  }

  // Sequential characters check
  if (PASSWORD_POLICY.preventSequentialChars) {
    if (hasSequentialChars(password, PASSWORD_POLICY.maxSequentialChars)) {
      errors.push(`연속된 문자나 숫자를 ${PASSWORD_POLICY.maxSequentialChars}개 이상 사용할 수 없습니다.`);
    }
  }

  // User info check
  if (PASSWORD_POLICY.preventUserInfo && email) {
    const emailParts = email.toLowerCase().split('@')[0].split(/[._-]/);
    const lowerPassword = password.toLowerCase();
    
    for (const part of emailParts) {
      if (part.length > 3 && lowerPassword.includes(part)) {
        errors.push('비밀번호에 이메일 주소의 일부를 포함할 수 없습니다.');
        break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Check for sequential characters
 * @param {string} str - String to check
 * @param {number} maxSequential - Maximum allowed sequential characters
 * @returns {boolean} True if sequential characters exceed limit
 */
function hasSequentialChars(str, maxSequential) {
  for (let i = 0; i < str.length - maxSequential; i++) {
    let isSequential = true;
    
    // Check ascending sequence
    for (let j = 0; j < maxSequential; j++) {
      if (str.charCodeAt(i + j + 1) !== str.charCodeAt(i + j) + 1) {
        isSequential = false;
        break;
      }
    }
    if (isSequential) return true;
    
    // Check descending sequence
    isSequential = true;
    for (let j = 0; j < maxSequential; j++) {
      if (str.charCodeAt(i + j + 1) !== str.charCodeAt(i + j) - 1) {
        isSequential = false;
        break;
      }
    }
    if (isSequential) return true;
  }
  
  return false;
}

/**
 * Calculate password strength score
 * @param {string} password - Password to evaluate
 * @returns {Object} Strength score and level
 */
export const calculatePasswordStrength = (password) => {
  let score = 0;
  
  if (!password) {
    return { score: 0, level: 'none', text: '매우 약함', color: '#dc3545' };
  }
  
  // Length bonus
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  // Character variety bonus
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 20;
  
  // Pattern penalties
  if (/(.)\1{2,}/.test(password)) score -= 10; // Repeating chars
  if (hasSequentialChars(password, 3)) score -= 10; // Sequential chars
  
  // Complexity bonus
  const uniqueChars = new Set(password.split('')).size;
  if (uniqueChars >= password.length * 0.6) score += 10;
  
  // Normalize score
  score = Math.max(0, Math.min(100, score));
  
  // Determine strength level
  if (score < 20) {
    return { score, level: 'weak', text: '약함', color: '#dc3545' };
  } else if (score < 40) {
    return { score, level: 'fair', text: '보통', color: '#fd7e14' };
  } else if (score < 60) {
    return { score, level: 'good', text: '양호', color: '#ffc107' };
  } else if (score < 80) {
    return { score, level: 'strong', text: '강함', color: '#28a745' };
  } else {
    return { score, level: 'excellent', text: '매우 강함', color: '#20c997' };
  }
};

/**
 * Generate password policy text for display
 * @returns {string[]} Array of policy requirements
 */
export const getPasswordPolicyText = () => {
  const requirements = [];
  
  requirements.push(`최소 ${PASSWORD_POLICY.minLength}자 이상`);
  
  const charRequirements = [];
  if (PASSWORD_POLICY.requireUppercase) charRequirements.push('대문자');
  if (PASSWORD_POLICY.requireLowercase) charRequirements.push('소문자');
  if (PASSWORD_POLICY.requireNumbers) charRequirements.push('숫자');
  if (PASSWORD_POLICY.requireSpecialChars) charRequirements.push('특수문자');
  
  if (charRequirements.length > 0) {
    requirements.push(`${charRequirements.join(', ')} 포함`);
  }
  
  if (PASSWORD_POLICY.preventRepeatingChars) {
    requirements.push(`동일 문자 ${PASSWORD_POLICY.maxRepeatingChars}회 이상 연속 사용 금지`);
  }
  
  if (PASSWORD_POLICY.preventSequentialChars) {
    requirements.push(`연속된 문자/숫자 ${PASSWORD_POLICY.maxSequentialChars}개 이상 사용 금지`);
  }
  
  if (PASSWORD_POLICY.preventCommonPasswords) {
    requirements.push('일반적인 비밀번호 사용 금지');
  }
  
  return requirements;
};
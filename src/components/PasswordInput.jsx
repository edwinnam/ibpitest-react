import React, { useState, useEffect } from 'react';
import { validatePassword, getPasswordPolicyText } from '../utils/passwordPolicy';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import './PasswordInput.css';

const PasswordInput = ({ 
  value, 
  onChange, 
  onValidation,
  email = '',
  placeholder = '비밀번호를 입력하세요',
  showPolicy = true,
  showStrength = true,
  required = true,
  disabled = false,
  label = '비밀번호',
  id = 'password'
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [validation, setValidation] = useState({ isValid: true, errors: [] });

  useEffect(() => {
    if (value) {
      const result = validatePassword(value, email);
      setValidation(result);
      if (onValidation) {
        onValidation(result);
      }
    } else {
      setValidation({ isValid: true, errors: [] });
      if (onValidation) {
        onValidation({ isValid: !required, errors: [] });
      }
    }
  }, [value, email, required, onValidation]);

  const policyRequirements = getPasswordPolicyText();

  return (
    <div className="password-input-container">
      {label && (
        <label htmlFor={id} className="password-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      
      <div className="password-input-wrapper">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`password-input ${!validation.isValid && value ? 'invalid' : ''}`}
          autoComplete="new-password"
        />
        
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          tabIndex={-1}
          aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
        >
          <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
        </button>
      </div>

      {showStrength && value && (
        <PasswordStrengthIndicator password={value} />
      )}

      {showPolicy && isFocused && !value && (
        <div className="password-policy-tooltip">
          <p className="policy-title">비밀번호 요구사항:</p>
          <ul className="policy-list">
            {policyRequirements.map((req, index) => (
              <li key={index}>{req}</li>
            ))}
          </ul>
        </div>
      )}

      {value && !validation.isValid && (
        <div className="password-errors">
          {validation.errors.map((error, index) => (
            <p key={index} className="error-message">
              <i className="fas fa-exclamation-circle"></i> {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordInput;
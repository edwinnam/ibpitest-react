import React from 'react';
import { calculatePasswordStrength } from '../utils/passwordPolicy';
import './PasswordStrengthIndicator.css';

const PasswordStrengthIndicator = ({ password, show = true }) => {
  if (!show || !password) return null;

  const strength = calculatePasswordStrength(password);

  return (
    <div className="password-strength-indicator">
      <div className="strength-bars">
        <div 
          className={`strength-bar ${strength.score >= 20 ? 'active' : ''}`}
          style={{ backgroundColor: strength.score >= 20 ? strength.color : '#e9ecef' }}
        />
        <div 
          className={`strength-bar ${strength.score >= 40 ? 'active' : ''}`}
          style={{ backgroundColor: strength.score >= 40 ? strength.color : '#e9ecef' }}
        />
        <div 
          className={`strength-bar ${strength.score >= 60 ? 'active' : ''}`}
          style={{ backgroundColor: strength.score >= 60 ? strength.color : '#e9ecef' }}
        />
        <div 
          className={`strength-bar ${strength.score >= 80 ? 'active' : ''}`}
          style={{ backgroundColor: strength.score >= 80 ? strength.color : '#e9ecef' }}
        />
      </div>
      <span className="strength-text" style={{ color: strength.color }}>
        비밀번호 강도: {strength.text}
      </span>
    </div>
  );
};

export default PasswordStrengthIndicator;
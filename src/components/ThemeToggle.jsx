import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = ({ showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span className="theme-toggle-track">
        <span className="theme-toggle-thumb">
          {theme === 'light' ? (
            <i className="fas fa-sun"></i>
          ) : (
            <i className="fas fa-moon"></i>
          )}
        </span>
      </span>
      {showLabel && (
        <span className="theme-toggle-label">
          {theme === 'light' ? '라이트 모드' : '다크 모드'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
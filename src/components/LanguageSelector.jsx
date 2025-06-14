import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSelector.css';

const LanguageSelector = ({ showLabel = false }) => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    // Store language preference
    localStorage.setItem('i18nextLng', langCode);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <div className="language-selector">
      <button 
        className="language-selector-button"
        aria-label="Select language"
      >
        <span className="language-flag">{currentLanguage.flag}</span>
        {showLabel && <span className="language-name">{currentLanguage.name}</span>}
      </button>
      
      <div className="language-dropdown">
        {languages.map(lang => (
          <button
            key={lang.code}
            className={`language-option ${lang.code === i18n.language ? 'active' : ''}`}
            onClick={() => handleLanguageChange(lang.code)}
          >
            <span className="language-flag">{lang.flag}</span>
            <span className="language-name">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
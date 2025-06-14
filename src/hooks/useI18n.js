import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

/**
 * Custom hook for i18n with additional utilities
 */
export const useI18n = () => {
  const { t, i18n } = useTranslation();

  // Format date according to current locale
  const formatDate = useCallback((date, options = {}) => {
    const locale = i18n.language === 'ko' ? 'ko-KR' : 'en-US';
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    });
  }, [i18n.language]);

  // Format time according to current locale
  const formatTime = useCallback((date, options = {}) => {
    const locale = i18n.language === 'ko' ? 'ko-KR' : 'en-US';
    return new Date(date).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    });
  }, [i18n.language]);

  // Format number according to current locale
  const formatNumber = useCallback((number, options = {}) => {
    const locale = i18n.language === 'ko' ? 'ko-KR' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(number);
  }, [i18n.language]);

  // Format currency
  const formatCurrency = useCallback((amount, currency = 'KRW') => {
    const locale = i18n.language === 'ko' ? 'ko-KR' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }, [i18n.language]);

  // Get current language info
  const currentLanguage = {
    code: i18n.language,
    name: i18n.language === 'ko' ? '한국어' : 'English',
    isKorean: i18n.language === 'ko',
    isEnglish: i18n.language === 'en'
  };

  // Change language with callback
  const changeLanguage = useCallback(async (langCode) => {
    try {
      await i18n.changeLanguage(langCode);
      localStorage.setItem('i18nextLng', langCode);
      return true;
    } catch (error) {
      console.error('Failed to change language:', error);
      return false;
    }
  }, [i18n]);

  return {
    t,
    i18n,
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency,
    currentLanguage,
    changeLanguage
  };
};
import React, { useEffect } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';

/**
 * Global analytics provider component
 * Wraps the app to provide analytics tracking
 */
const AnalyticsProvider = ({ children }) => {
  const { trackError } = useAnalytics();

  useEffect(() => {
    // Global error handler
    const handleError = (event) => {
      trackError(event.error || event, {
        type: 'unhandled_error',
        source: 'window.onerror'
      });
    };

    const handleUnhandledRejection = (event) => {
      trackError(event.reason || event, {
        type: 'unhandled_rejection',
        source: 'unhandledrejection'
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [trackError]);

  return <>{children}</>;
};

export default AnalyticsProvider;
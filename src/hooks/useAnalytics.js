import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { useOrganization } from '../modules/organization/OrganizationContext';
import analyticsService from '../core/services/analyticsService';

/**
 * React hook for analytics tracking
 */
export const useAnalytics = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { organization } = useOrganization();

  // Initialize analytics
  useEffect(() => {
    if (user?.id) {
      analyticsService.initialize(user.id, organization?.id);
    }

    return () => {
      analyticsService.cleanup();
    };
  }, [user?.id, organization?.id]);

  // Track page views
  useEffect(() => {
    if (user?.id) {
      const pageName = getPageName(location.pathname);
      analyticsService.trackPageView(pageName, {
        path: location.pathname,
        search: location.search,
        hash: location.hash
      });
    }
  }, [location, user?.id]);

  // Track click helper
  const trackClick = useCallback((elementId, elementText, properties = {}) => {
    analyticsService.trackClick(elementId, elementText, properties);
  }, []);

  // Track form submission helper
  const trackFormSubmit = useCallback((formName, properties = {}) => {
    analyticsService.trackFormSubmit(formName, properties);
  }, []);

  // Track custom event helper
  const trackEvent = useCallback((eventName, properties = {}) => {
    analyticsService.track(eventName, properties);
  }, []);

  // Track timing helper
  const trackTiming = useCallback((category, variable, duration, label = '') => {
    analyticsService.trackTiming(category, variable, duration, label);
  }, []);

  // Track test event helper
  const trackTestEvent = useCallback((action, testData = {}) => {
    analyticsService.trackTestEvent(action, testData);
  }, []);

  // Track error helper
  const trackError = useCallback((error, context = {}) => {
    const errorMessage = error.message || String(error);
    const errorStack = error.stack || '';
    
    analyticsService.trackError(errorMessage, errorStack, {
      ...context,
      url: window.location.href,
      userAgent: navigator.userAgent
    });
  }, []);

  // Create timing tracker
  const createTimer = useCallback((category, variable, label = '') => {
    const startTime = Date.now();
    
    return {
      stop: () => {
        const duration = Date.now() - startTime;
        trackTiming(category, variable, duration, label);
        return duration;
      }
    };
  }, [trackTiming]);

  return {
    trackClick,
    trackFormSubmit,
    trackEvent,
    trackTiming,
    trackTestEvent,
    trackError,
    createTimer
  };
};

/**
 * Get page name from pathname
 */
const getPageName = (pathname) => {
  const routes = {
    '/': 'Home',
    '/dashboard': 'Dashboard',
    '/login': 'Login',
    '/test-management': 'Test Management',
    '/test-scoring': 'Test Scoring',
    '/manual-scoring': 'Manual Scoring',
    '/test-results': 'Test Results',
    '/group-test': 'Group Test',
    '/mypage': 'My Page',
    '/customer-info': 'Customer Info',
    '/biz-partner-info': 'Business Partner Info',
    '/data-management': 'Data Management',
    '/data-analysis': 'Data Analysis',
    '/notice': 'Notice',
    '/user-guide': 'User Guide',
    '/diagram': 'Organization Diagram',
    '/customer/login': 'Customer Login',
    '/customer/test-intro': 'Test Introduction',
    '/customer/test': 'Test Page',
    '/customer/test-complete': 'Test Complete'
  };

  // Check exact match
  if (routes[pathname]) {
    return routes[pathname];
  }

  // Check pattern match
  if (pathname.startsWith('/reports/')) {
    return 'Report View';
  }

  if (pathname.startsWith('/diagram/')) {
    return 'Individual Diagram';
  }

  // Default
  return 'Unknown Page';
};

export default useAnalytics;
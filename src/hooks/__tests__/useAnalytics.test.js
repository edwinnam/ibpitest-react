import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../modules/auth/AuthContext';
import { useOrganization } from '../../modules/organization/OrganizationContext';
import analyticsService from '../../core/services/analyticsService';
import { useAnalytics } from '../useAnalytics';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useLocation: vi.fn()
}));

vi.mock('../../modules/auth/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../modules/organization/OrganizationContext', () => ({
  useOrganization: vi.fn()
}));

vi.mock('../../core/services/analyticsService', () => ({
  default: {
    initialize: vi.fn(),
    cleanup: vi.fn(),
    trackPageView: vi.fn(),
    trackClick: vi.fn(),
    trackFormSubmit: vi.fn(),
    track: vi.fn(),
    trackTiming: vi.fn(),
    trackTestEvent: vi.fn(),
    trackError: vi.fn()
  }
}));

describe('useAnalytics', () => {
  const mockUser = { id: 'user123' };
  const mockOrganization = { id: 'org456' };
  const mockLocation = { 
    pathname: '/dashboard',
    search: '?test=1',
    hash: '#section'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
    useOrganization.mockReturnValue({ organization: mockOrganization });
    useLocation.mockReturnValue(mockLocation);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize analytics when user is logged in', () => {
      renderHook(() => useAnalytics());

      expect(analyticsService.initialize).toHaveBeenCalledWith(
        mockUser.id,
        mockOrganization.id
      );
    });

    it('should not initialize when user is not logged in', () => {
      useAuth.mockReturnValue({ user: null });
      
      renderHook(() => useAnalytics());

      expect(analyticsService.initialize).not.toHaveBeenCalled();
    });

    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useAnalytics());

      unmount();

      expect(analyticsService.cleanup).toHaveBeenCalled();
    });

    it('should reinitialize when user changes', () => {
      const { rerender } = renderHook(() => useAnalytics());

      expect(analyticsService.initialize).toHaveBeenCalledTimes(1);

      // Change user
      const newUser = { id: 'user789' };
      useAuth.mockReturnValue({ user: newUser });

      rerender();

      expect(analyticsService.cleanup).toHaveBeenCalled();
      expect(analyticsService.initialize).toHaveBeenCalledWith(
        newUser.id,
        mockOrganization.id
      );
    });
  });

  describe('page tracking', () => {
    it('should track page views on location change', () => {
      renderHook(() => useAnalytics());

      expect(analyticsService.trackPageView).toHaveBeenCalledWith(
        'Dashboard',
        {
          path: '/dashboard',
          search: '?test=1',
          hash: '#section'
        }
      );
    });

    it('should track new page when location changes', () => {
      const { rerender } = renderHook(() => useAnalytics());

      // Change location
      const newLocation = { 
        pathname: '/test-results',
        search: '',
        hash: ''
      };
      useLocation.mockReturnValue(newLocation);

      rerender();

      expect(analyticsService.trackPageView).toHaveBeenCalledWith(
        'Test Results',
        {
          path: '/test-results',
          search: '',
          hash: ''
        }
      );
    });

    it('should not track page views when user is not logged in', () => {
      useAuth.mockReturnValue({ user: null });
      
      renderHook(() => useAnalytics());

      expect(analyticsService.trackPageView).not.toHaveBeenCalled();
    });
  });

  describe('tracking methods', () => {
    it('should provide trackClick method', () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackClick('button-id', 'Click Me', { category: 'test' });

      expect(analyticsService.trackClick).toHaveBeenCalledWith(
        'button-id',
        'Click Me',
        { category: 'test' }
      );
    });

    it('should provide trackFormSubmit method', () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackFormSubmit('login-form', { success: true });

      expect(analyticsService.trackFormSubmit).toHaveBeenCalledWith(
        'login-form',
        { success: true }
      );
    });

    it('should provide trackEvent method', () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackEvent('custom_event', { value: 123 });

      expect(analyticsService.track).toHaveBeenCalledWith(
        'custom_event',
        { value: 123 }
      );
    });

    it('should provide trackTiming method', () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackTiming('api', 'fetch', 1500, 'users');

      expect(analyticsService.trackTiming).toHaveBeenCalledWith(
        'api',
        'fetch',
        1500,
        'users'
      );
    });

    it('should provide trackTestEvent method', () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackTestEvent('started', { testId: 'test123' });

      expect(analyticsService.trackTestEvent).toHaveBeenCalledWith(
        'started',
        { testId: 'test123' }
      );
    });

    it('should provide trackError method', () => {
      const { result } = renderHook(() => useAnalytics());
      const error = new Error('Test error');

      result.current.trackError(error, { component: 'TestComponent' });

      expect(analyticsService.trackError).toHaveBeenCalledWith(
        'Test error',
        error.stack,
        expect.objectContaining({
          component: 'TestComponent',
          url: expect.any(String),
          userAgent: expect.any(String)
        })
      );
    });
  });

  describe('createTimer', () => {
    it('should create a timer and track timing when stopped', () => {
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(2500);

      const { result } = renderHook(() => useAnalytics());

      const timer = result.current.createTimer('api', 'request', 'users');
      const duration = timer.stop();

      expect(duration).toBe(1500);
      expect(analyticsService.trackTiming).toHaveBeenCalledWith(
        'api',
        'request',
        1500,
        'users'
      );
    });

    it('should work without label', () => {
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(2000);

      const { result } = renderHook(() => useAnalytics());

      const timer = result.current.createTimer('test', 'duration');
      timer.stop();

      expect(analyticsService.trackTiming).toHaveBeenCalledWith(
        'test',
        'duration',
        1000,
        ''
      );
    });
  });

  describe('page name mapping', () => {
    const testCases = [
      { pathname: '/', expectedName: 'Home' },
      { pathname: '/dashboard', expectedName: 'Dashboard' },
      { pathname: '/login', expectedName: 'Login' },
      { pathname: '/test-management', expectedName: 'Test Management' },
      { pathname: '/test-scoring', expectedName: 'Test Scoring' },
      { pathname: '/manual-scoring', expectedName: 'Manual Scoring' },
      { pathname: '/test-results', expectedName: 'Test Results' },
      { pathname: '/group-test', expectedName: 'Group Test' },
      { pathname: '/mypage', expectedName: 'My Page' },
      { pathname: '/customer-info', expectedName: 'Customer Info' },
      { pathname: '/biz-partner-info', expectedName: 'Business Partner Info' },
      { pathname: '/data-management', expectedName: 'Data Management' },
      { pathname: '/data-analysis', expectedName: 'Data Analysis' },
      { pathname: '/notice', expectedName: 'Notice' },
      { pathname: '/user-guide', expectedName: 'User Guide' },
      { pathname: '/diagram', expectedName: 'Organization Diagram' },
      { pathname: '/customer/login', expectedName: 'Customer Login' },
      { pathname: '/customer/test-intro', expectedName: 'Test Introduction' },
      { pathname: '/customer/test', expectedName: 'Test Page' },
      { pathname: '/customer/test-complete', expectedName: 'Test Complete' },
      { pathname: '/reports/123', expectedName: 'Report View' },
      { pathname: '/diagram/456', expectedName: 'Individual Diagram' },
      { pathname: '/unknown-page', expectedName: 'Unknown Page' }
    ];

    testCases.forEach(({ pathname, expectedName }) => {
      it(`should map ${pathname} to "${expectedName}"`, () => {
        useLocation.mockReturnValue({ pathname, search: '', hash: '' });
        
        renderHook(() => useAnalytics());

        expect(analyticsService.trackPageView).toHaveBeenCalledWith(
          expectedName,
          expect.any(Object)
        );
      });
    });
  });
});
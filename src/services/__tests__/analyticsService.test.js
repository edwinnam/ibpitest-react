import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import analyticsService from '../../core/services/analyticsService';
import { supabase } from '../../core/services/supabase';

// Mock Supabase
vi.mock('../../core/services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      update: vi.fn(() => Promise.resolve({ data: [], error: null })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    }))
  }
}));

describe('AnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Reset service state
    analyticsService.isInitialized = false;
    analyticsService.eventQueue = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    analyticsService.cleanup();
  });

  describe('initialization', () => {
    it('should initialize with user and organization ID', () => {
      analyticsService.initialize('user123', 'org456');
      
      expect(analyticsService.isInitialized).toBe(true);
      expect(analyticsService.userId).toBe('user123');
      expect(analyticsService.organizationId).toBe('org456');
    });

    it('should not reinitialize if already initialized', () => {
      analyticsService.initialize('user123', 'org456');
      const firstSessionId = analyticsService.sessionId;
      
      analyticsService.initialize('user789', 'org789');
      
      expect(analyticsService.sessionId).toBe(firstSessionId);
      expect(analyticsService.userId).toBe('user123');
    });

    it('should start a session on initialization', async () => {
      analyticsService.initialize('user123', 'org456');
      
      expect(supabase.from).toHaveBeenCalledWith('analytics_sessions');
      expect(supabase.from().insert).toHaveBeenCalled();
    });
  });

  describe('event tracking', () => {
    beforeEach(() => {
      analyticsService.initialize('user123', 'org456');
    });

    it('should track custom events', () => {
      analyticsService.track('button_click', { button: 'submit' });
      
      expect(analyticsService.eventQueue).toHaveLength(1);
      expect(analyticsService.eventQueue[0]).toMatchObject({
        event_name: 'button_click',
        properties: { button: 'submit' },
        user_id: 'user123',
        organization_id: 'org456'
      });
    });

    it('should track page views', () => {
      analyticsService.trackPageView('Dashboard', { path: '/dashboard' });
      
      expect(analyticsService.eventQueue).toHaveLength(1);
      expect(analyticsService.eventQueue[0]).toMatchObject({
        event_name: 'page_view',
        properties: {
          page_name: 'Dashboard',
          path: '/dashboard'
        }
      });
    });

    it('should track clicks', () => {
      analyticsService.trackClick('btn-submit', 'Submit Form');
      
      expect(analyticsService.eventQueue).toHaveLength(1);
      expect(analyticsService.eventQueue[0]).toMatchObject({
        event_name: 'click',
        properties: {
          element_id: 'btn-submit',
          element_text: 'Submit Form'
        }
      });
    });

    it('should track form submissions', () => {
      analyticsService.trackFormSubmit('login_form', { success: true });
      
      expect(analyticsService.eventQueue).toHaveLength(1);
      expect(analyticsService.eventQueue[0]).toMatchObject({
        event_name: 'form_submit',
        properties: {
          form_name: 'login_form',
          success: true
        }
      });
    });

    it('should track errors', () => {
      const error = new Error('Test error');
      analyticsService.trackError(error.message, error.stack, { context: 'test' });
      
      expect(analyticsService.eventQueue).toHaveLength(1);
      expect(analyticsService.eventQueue[0]).toMatchObject({
        event_name: 'error',
        properties: {
          error_message: 'Test error',
          error_stack: error.stack,
          context: 'test'
        }
      });
    });

    it('should track timing events', () => {
      analyticsService.trackTiming('api', 'fetch_data', 1500, 'users');
      
      expect(analyticsService.eventQueue).toHaveLength(1);
      expect(analyticsService.eventQueue[0]).toMatchObject({
        event_name: 'timing',
        properties: {
          timing_category: 'api',
          timing_variable: 'fetch_data',
          timing_duration: 1500,
          timing_label: 'users'
        }
      });
    });

    it('should not track events when not initialized', () => {
      analyticsService.isInitialized = false;
      analyticsService.track('test_event');
      
      expect(analyticsService.eventQueue).toHaveLength(0);
    });
  });

  describe('event categorization', () => {
    it('should categorize events correctly', () => {
      expect(analyticsService.categorizeEvent('page_view')).toBe('navigation');
      expect(analyticsService.categorizeEvent('click')).toBe('interaction');
      expect(analyticsService.categorizeEvent('form_submit')).toBe('conversion');
      expect(analyticsService.categorizeEvent('error')).toBe('error');
      expect(analyticsService.categorizeEvent('test_started')).toBe('test');
      expect(analyticsService.categorizeEvent('report_generated')).toBe('report');
      expect(analyticsService.categorizeEvent('code_sent')).toBe('code');
      expect(analyticsService.categorizeEvent('user_login')).toBe('user');
      expect(analyticsService.categorizeEvent('custom_event')).toBe('other');
    });
  });

  describe('event flushing', () => {
    beforeEach(() => {
      analyticsService.initialize('user123', 'org456');
    });

    it('should flush events to database', async () => {
      analyticsService.track('event1');
      analyticsService.track('event2');
      
      await analyticsService.flushEvents();
      
      expect(supabase.from).toHaveBeenCalledWith('analytics_events');
      expect(supabase.from().insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ event_name: 'event1' }),
          expect.objectContaining({ event_name: 'event2' })
        ])
      );
      expect(analyticsService.eventQueue).toHaveLength(0);
    });

    it('should flush important events immediately', () => {
      const flushSpy = vi.spyOn(analyticsService, 'flushEvents');
      
      analyticsService.track('test_completed');
      
      expect(flushSpy).toHaveBeenCalled();
    });

    it('should re-queue events on flush failure', async () => {
      supabase.from().insert.mockRejectedValueOnce(new Error('Database error'));
      
      analyticsService.track('event1');
      const originalQueueLength = analyticsService.eventQueue.length;
      
      await analyticsService.flushEvents();
      
      expect(analyticsService.eventQueue).toHaveLength(originalQueueLength);
    });

    it('should flush events periodically', () => {
      const flushSpy = vi.spyOn(analyticsService, 'flushEvents');
      
      analyticsService.track('event1');
      
      vi.advanceTimersByTime(30000); // 30 seconds
      
      expect(flushSpy).toHaveBeenCalled();
    });
  });

  describe('session management', () => {
    it('should end session on cleanup', async () => {
      analyticsService.initialize('user123', 'org456');
      
      await analyticsService.endSession();
      
      expect(supabase.from).toHaveBeenCalledWith('analytics_sessions');
      expect(supabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          end_time: expect.any(Date),
          duration_seconds: expect.any(Number)
        })
      );
    });

    it('should handle visibility changes', () => {
      analyticsService.initialize('user123', 'org456');
      const trackSpy = vi.spyOn(analyticsService, 'track');
      
      // Simulate page hidden
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true
      });
      document.dispatchEvent(new Event('visibilitychange'));
      
      expect(trackSpy).toHaveBeenCalledWith('page_hidden');
      
      // Simulate page visible
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false
      });
      document.dispatchEvent(new Event('visibilitychange'));
      
      expect(trackSpy).toHaveBeenCalledWith('page_visible');
    });
  });

  describe('user insights', () => {
    it('should calculate insights from sessions and events', async () => {
      const mockSessions = [
        { duration_seconds: 300, user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', start_time: new Date() }
      ];
      
      const mockEvents = [
        { event_name: 'page_view', properties: { page_name: 'Dashboard' } },
        { event_name: 'click', properties: {} }
      ];
      
      supabase.from().select.mockImplementation(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => Promise.resolve({ data: mockSessions, error: null }))
          }))
        }))
      }));
      
      supabase.from().select
        .mockResolvedValueOnce({ data: mockSessions, error: null })
        .mockResolvedValueOnce({ data: mockEvents, error: null });
      
      const insights = await analyticsService.getUserInsights('user123', '30days');
      
      expect(insights).toMatchObject({
        totalSessions: 1,
        totalEvents: 2,
        avgSessionDuration: 300,
        avgEventsPerSession: 2
      });
    });

    it('should handle empty data gracefully', async () => {
      supabase.from().select.mockImplementation(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }));
      
      const insights = await analyticsService.getUserInsights('user123', '30days');
      
      expect(insights).toMatchObject({
        totalSessions: 0,
        totalEvents: 0,
        avgSessionDuration: 0,
        avgEventsPerSession: 0
      });
    });
  });

  describe('device detection', () => {
    it('should detect device type from user agent', () => {
      expect(analyticsService.getDeviceType('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')).toBe('Mobile');
      expect(analyticsService.getDeviceType('Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)')).toBe('Tablet');
      expect(analyticsService.getDeviceType('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('Desktop');
    });
  });

  describe('cleanup', () => {
    it('should clean up properly', () => {
      analyticsService.initialize('user123', 'org456');
      const flushSpy = vi.spyOn(analyticsService, 'flushEvents');
      const endSessionSpy = vi.spyOn(analyticsService, 'endSession');
      
      analyticsService.cleanup();
      
      expect(flushSpy).toHaveBeenCalled();
      expect(endSessionSpy).toHaveBeenCalled();
      expect(analyticsService.isInitialized).toBe(false);
    });
  });
});
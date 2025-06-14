import { supabase } from './supabase';

/**
 * User behavior analytics service
 * Tracks and analyzes user interactions within the application
 */
class AnalyticsService {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = new Date();
    this.eventQueue = [];
    this.flushInterval = null;
    this.isInitialized = false;
  }

  /**
   * Initialize analytics tracking
   */
  initialize(userId, organizationId) {
    if (this.isInitialized) return;

    this.userId = userId;
    this.organizationId = organizationId;
    this.isInitialized = true;

    // Start session
    this.startSession();

    // Set up event flushing
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, 30000); // Flush every 30 seconds

    // Track page visibility
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Track before unload
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start a new session
   */
  async startSession() {
    const sessionData = {
      session_id: this.sessionId,
      user_id: this.userId,
      organization_id: this.organizationId,
      start_time: this.sessionStartTime,
      user_agent: navigator.userAgent,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      platform: navigator.platform
    };

    try {
      await supabase
        .from('analytics_sessions')
        .insert(sessionData);
    } catch (error) {
      console.error('Failed to start analytics session:', error);
    }
  }

  /**
   * End current session
   */
  async endSession() {
    const duration = Math.floor((new Date() - this.sessionStartTime) / 1000);

    try {
      await supabase
        .from('analytics_sessions')
        .update({
          end_time: new Date(),
          duration_seconds: duration
        })
        .eq('session_id', this.sessionId);
    } catch (error) {
      console.error('Failed to end analytics session:', error);
    }
  }

  /**
   * Track user event
   */
  track(eventName, properties = {}) {
    if (!this.isInitialized) return;

    const event = {
      event_id: this.generateEventId(),
      session_id: this.sessionId,
      user_id: this.userId,
      organization_id: this.organizationId,
      event_name: eventName,
      event_category: this.categorizeEvent(eventName),
      properties,
      timestamp: new Date(),
      page_url: window.location.href,
      page_title: document.title
    };

    this.eventQueue.push(event);

    // Flush immediately for important events
    if (this.isImportantEvent(eventName)) {
      this.flushEvents();
    }
  }

  /**
   * Track page view
   */
  trackPageView(pageName, properties = {}) {
    this.track('page_view', {
      page_name: pageName,
      ...properties
    });
  }

  /**
   * Track click event
   */
  trackClick(elementId, elementText, properties = {}) {
    this.track('click', {
      element_id: elementId,
      element_text: elementText,
      ...properties
    });
  }

  /**
   * Track form submission
   */
  trackFormSubmit(formName, properties = {}) {
    this.track('form_submit', {
      form_name: formName,
      ...properties
    });
  }

  /**
   * Track error
   */
  trackError(errorMessage, errorStack, properties = {}) {
    this.track('error', {
      error_message: errorMessage,
      error_stack: errorStack,
      ...properties
    });
  }

  /**
   * Track custom timing
   */
  trackTiming(category, variable, duration, label = '') {
    this.track('timing', {
      timing_category: category,
      timing_variable: variable,
      timing_duration: duration,
      timing_label: label
    });
  }

  /**
   * Track test-related events
   */
  trackTestEvent(action, testData = {}) {
    this.track(`test_${action}`, {
      test_id: testData.testId,
      test_type: testData.testType,
      customer_id: testData.customerId,
      ...testData
    });
  }

  /**
   * Categorize events
   */
  categorizeEvent(eventName) {
    const categories = {
      page_view: 'navigation',
      click: 'interaction',
      form_submit: 'conversion',
      error: 'error',
      test_: 'test',
      report_: 'report',
      code_: 'code',
      user_: 'user'
    };

    for (const [prefix, category] of Object.entries(categories)) {
      if (eventName.startsWith(prefix)) {
        return category;
      }
    }

    return 'other';
  }

  /**
   * Check if event is important
   */
  isImportantEvent(eventName) {
    const importantEvents = [
      'test_completed',
      'report_generated',
      'code_sent',
      'error',
      'purchase',
      'signup'
    ];

    return importantEvents.includes(eventName);
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Flush events to database
   */
  async flushEvents() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await supabase
        .from('analytics_events')
        .insert(events);
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-add events to queue on failure
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Handle visibility change
   */
  handleVisibilityChange() {
    if (document.hidden) {
      this.flushEvents();
      this.track('page_hidden');
    } else {
      this.track('page_visible');
    }
  }

  /**
   * Handle before unload
   */
  handleBeforeUnload() {
    this.flushEvents();
    this.endSession();
  }

  /**
   * Get user behavior insights
   */
  async getUserInsights(userId, dateRange = '30days') {
    const endDate = new Date();
    const startDate = new Date();

    switch(dateRange) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
    }

    try {
      // Get sessions
      const { data: sessions } = await supabase
        .from('analytics_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString());

      // Get events
      const { data: events } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      return this.calculateInsights(sessions, events);
    } catch (error) {
      console.error('Failed to get user insights:', error);
      return null;
    }
  }

  /**
   * Calculate insights from raw data
   */
  calculateInsights(sessions, events) {
    const insights = {
      totalSessions: sessions?.length || 0,
      totalEvents: events?.length || 0,
      avgSessionDuration: 0,
      avgEventsPerSession: 0,
      topPages: [],
      topActions: [],
      deviceBreakdown: {},
      timePatterns: {},
      conversionFunnel: {}
    };

    if (!sessions || sessions.length === 0) return insights;

    // Average session duration
    const durations = sessions
      .filter(s => s.duration_seconds)
      .map(s => s.duration_seconds);
    
    if (durations.length > 0) {
      insights.avgSessionDuration = Math.round(
        durations.reduce((a, b) => a + b, 0) / durations.length
      );
    }

    // Average events per session
    insights.avgEventsPerSession = Math.round(
      insights.totalEvents / insights.totalSessions
    );

    // Top pages
    const pageViews = events?.filter(e => e.event_name === 'page_view') || [];
    const pageCounts = {};
    
    pageViews.forEach(event => {
      const pageName = event.properties?.page_name || 'Unknown';
      pageCounts[pageName] = (pageCounts[pageName] || 0) + 1;
    });

    insights.topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([page, count]) => ({ page, count }));

    // Top actions
    const actionCounts = {};
    
    events?.forEach(event => {
      if (event.event_name !== 'page_view') {
        actionCounts[event.event_name] = (actionCounts[event.event_name] || 0) + 1;
      }
    });

    insights.topActions = Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));

    // Device breakdown
    const devices = {};
    
    sessions.forEach(session => {
      const device = this.getDeviceType(session.user_agent);
      devices[device] = (devices[device] || 0) + 1;
    });

    insights.deviceBreakdown = devices;

    // Time patterns
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);
    
    sessions.forEach(session => {
      const date = new Date(session.start_time);
      hourCounts[date.getHours()]++;
      dayCounts[date.getDay()]++;
    });

    insights.timePatterns = {
      byHour: hourCounts,
      byDay: dayCounts
    };

    return insights;
  }

  /**
   * Get device type from user agent
   */
  getDeviceType(userAgent) {
    if (/mobile/i.test(userAgent)) return 'Mobile';
    if (/tablet/i.test(userAgent)) return 'Tablet';
    return 'Desktop';
  }

  /**
   * Clean up
   */
  cleanup() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    this.flushEvents();
    this.endSession();
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    
    this.isInitialized = false;
  }
}

// Export singleton instance
const analyticsService = new AnalyticsService();
export default analyticsService;
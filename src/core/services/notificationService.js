import { supabase } from './supabase';

/**
 * Notification Service for real-time notifications
 * Handles WebSocket connections, browser notifications, and in-app notifications
 */
class NotificationService {
  constructor() {
    this.subscribers = new Map();
    this.notifications = [];
    this.unreadCount = 0;
    this.channel = null;
    this.browserPermission = 'default';
    this.soundEnabled = true;
    this.isInitialized = false;
    
    // Notification types
    this.types = {
      TEST_COMPLETED: 'test_completed',
      TEST_SCORED: 'test_scored',
      CODE_GENERATED: 'code_generated',
      CODE_SENT: 'code_sent',
      REPORT_READY: 'report_ready',
      SYSTEM_ALERT: 'system_alert',
      NEW_CUSTOMER: 'new_customer',
      LOW_CODES: 'low_codes'
    };
    
    // Initialize browser notification permission
    this.checkBrowserPermission();
  }

  /**
   * Initialize notification service for a user
   */
  async initialize(userId, organizationId) {
    if (this.isInitialized) {
      await this.cleanup();
    }

    this.userId = userId;
    this.organizationId = organizationId;
    
    // Load stored notifications
    await this.loadStoredNotifications();
    
    // Setup real-time subscription
    await this.setupRealtimeSubscription();
    
    // Request browser notification permission
    await this.requestBrowserPermission();
    
    this.isInitialized = true;
  }

  /**
   * Setup Supabase real-time subscription
   */
  async setupRealtimeSubscription() {
    // Subscribe to notifications table changes
    this.channel = supabase
      .channel(`notifications:${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.userId}`
        },
        (payload) => {
          this.handleNewNotification(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.userId}`
        },
        (payload) => {
          this.handleNotificationUpdate(payload.new);
        }
      )
      .subscribe();

    // Also subscribe to organization-wide notifications
    if (this.organizationId) {
      this.orgChannel = supabase
        .channel(`org_notifications:${this.organizationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `organization_id=eq.${this.organizationId}`
          },
          (payload) => {
            if (payload.new.user_id === null) { // Organization-wide notification
              this.handleNewNotification(payload.new);
            }
          }
        )
        .subscribe();
    }
  }

  /**
   * Handle new notification from real-time subscription
   */
  handleNewNotification(notification) {
    // Add to notifications array
    this.notifications.unshift(notification);
    
    // Update unread count
    if (!notification.read) {
      this.unreadCount++;
    }
    
    // Show browser notification
    if (this.browserPermission === 'granted' && !notification.read) {
      this.showBrowserNotification(notification);
    }
    
    // Play notification sound
    if (this.soundEnabled && !notification.read) {
      this.playNotificationSound();
    }
    
    // Notify subscribers
    this.notifySubscribers('new', notification);
  }

  /**
   * Handle notification update
   */
  handleNotificationUpdate(updatedNotification) {
    const index = this.notifications.findIndex(n => n.id === updatedNotification.id);
    if (index !== -1) {
      const wasUnread = !this.notifications[index].read;
      this.notifications[index] = updatedNotification;
      
      // Update unread count
      if (wasUnread && updatedNotification.read) {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
      
      // Notify subscribers
      this.notifySubscribers('update', updatedNotification);
    }
  }

  /**
   * Load stored notifications from database
   */
  async loadStoredNotifications() {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${this.userId},and(organization_id.eq.${this.organizationId},user_id.is.null)`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      this.notifications = data || [];
      this.unreadCount = this.notifications.filter(n => !n.read).length;
      
      // Notify subscribers
      this.notifySubscribers('loaded', this.notifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  /**
   * Create a new notification
   */
  async createNotification(data) {
    try {
      const notification = {
        user_id: data.userId || this.userId,
        organization_id: data.organizationId || this.organizationId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
        priority: data.priority || 'normal',
        read: false,
        created_at: new Date().toISOString()
      };

      const { data: newNotification, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();

      if (error) throw error;

      return newNotification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        notification.read = true;
        notification.read_at = new Date().toISOString();
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.notifySubscribers('update', notification);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const unreadIds = this.notifications
        .filter(n => !n.read)
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds);

      if (error) throw error;

      // Update local state
      this.notifications.forEach(n => {
        if (!n.read) {
          n.read = true;
          n.read_at = new Date().toISOString();
        }
      });
      this.unreadCount = 0;
      this.notifySubscribers('update', this.notifications);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      const index = this.notifications.findIndex(n => n.id === notificationId);
      if (index !== -1) {
        const notification = this.notifications[index];
        if (!notification.read) {
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
        this.notifications.splice(index, 1);
        this.notifySubscribers('delete', notificationId);
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }

  /**
   * Check browser notification permission
   */
  checkBrowserPermission() {
    if ('Notification' in window) {
      this.browserPermission = Notification.permission;
    }
  }

  /**
   * Request browser notification permission
   */
  async requestBrowserPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        this.browserPermission = permission;
        return permission;
      } catch (error) {
        console.error('Failed to request notification permission:', error);
        return 'denied';
      }
    }
    return this.browserPermission;
  }

  /**
   * Show browser notification
   */
  showBrowserNotification(notification) {
    if (this.browserPermission !== 'granted') return;

    const options = {
      body: notification.message,
      icon: '/images/ibpi-logo.png',
      badge: '/images/badge.png',
      tag: notification.id,
      requireInteraction: notification.priority === 'high',
      data: notification
    };

    const browserNotification = new Notification(notification.title, options);

    browserNotification.onclick = () => {
      window.focus();
      this.handleNotificationClick(notification);
      browserNotification.close();
    };
  }

  /**
   * Handle notification click
   */
  handleNotificationClick(notification) {
    // Mark as read
    this.markAsRead(notification.id);

    // Navigate based on notification type
    if (notification.data?.url) {
      window.location.href = notification.data.url;
    } else {
      switch (notification.type) {
        case this.types.TEST_COMPLETED:
          window.location.href = '/test-results';
          break;
        case this.types.REPORT_READY:
          window.location.href = `/reports/${notification.data.customerId}/${notification.data.testId}`;
          break;
        case this.types.LOW_CODES:
          window.location.href = '/test-management';
          break;
        default:
          window.location.href = '/dashboard';
      }
    }
  }

  /**
   * Play notification sound
   */
  playNotificationSound() {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Failed to play notification sound:', e));
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  /**
   * Subscribe to notification updates
   */
  subscribe(callback) {
    const id = Date.now().toString();
    this.subscribers.set(id, callback);
    
    // Send current state
    callback({
      type: 'initial',
      notifications: this.notifications,
      unreadCount: this.unreadCount
    });
    
    return () => this.subscribers.delete(id);
  }

  /**
   * Notify all subscribers
   */
  notifySubscribers(type, data) {
    this.subscribers.forEach(callback => {
      callback({
        type,
        data,
        notifications: this.notifications,
        unreadCount: this.unreadCount
      });
    });
  }

  /**
   * Get notifications with filters
   */
  getNotifications(filters = {}) {
    let filtered = [...this.notifications];

    if (filters.unreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }

    if (filters.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    if (filters.priority) {
      filtered = filtered.filter(n => n.priority === filters.priority);
    }

    return filtered;
  }

  /**
   * Toggle sound
   */
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('notificationSound', this.soundEnabled.toString());
    return this.soundEnabled;
  }

  /**
   * Cleanup service
   */
  async cleanup() {
    if (this.channel) {
      await supabase.removeChannel(this.channel);
    }
    if (this.orgChannel) {
      await supabase.removeChannel(this.orgChannel);
    }
    this.subscribers.clear();
    this.notifications = [];
    this.unreadCount = 0;
    this.isInitialized = false;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
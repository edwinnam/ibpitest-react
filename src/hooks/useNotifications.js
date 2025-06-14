import { useState, useEffect, useCallback } from 'react';
import notificationService from '../core/services/notificationService';
import { useAuth } from '../modules/auth/AuthContext';
import { useOrganization } from '../modules/organization/OrganizationContext';

/**
 * React hook for managing notifications
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(
    localStorage.getItem('notificationSound') !== 'false'
  );
  
  const { user } = useAuth();
  const { organization } = useOrganization();

  useEffect(() => {
    if (!user?.id) return;

    // Initialize notification service
    const initNotifications = async () => {
      setLoading(true);
      try {
        await notificationService.initialize(
          user.id,
          organization?.id || user.user_metadata?.org_number
        );
        
        // Subscribe to updates
        const unsubscribe = notificationService.subscribe((update) => {
          setNotifications(update.notifications);
          setUnreadCount(update.unreadCount);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        setLoading(false);
      }
    };

    const unsubscribe = initNotifications();

    // Cleanup
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
      notificationService.cleanup();
    };
  }, [user?.id, organization?.id]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    await notificationService.markAsRead(notificationId);
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    await notificationService.markAllAsRead();
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    await notificationService.deleteNotification(notificationId);
  }, []);

  // Create notification
  const createNotification = useCallback(async (data) => {
    return await notificationService.createNotification(data);
  }, []);

  // Toggle sound
  const toggleSound = useCallback(() => {
    const newState = notificationService.toggleSound();
    setSoundEnabled(newState);
    return newState;
  }, []);

  // Request browser permission
  const requestPermission = useCallback(async () => {
    return await notificationService.requestBrowserPermission();
  }, []);

  // Get filtered notifications
  const getFilteredNotifications = useCallback((filters) => {
    return notificationService.getNotifications(filters);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    soundEnabled,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    toggleSound,
    requestPermission,
    getFilteredNotifications,
    hasPermission: notificationService.browserPermission === 'granted'
  };
};
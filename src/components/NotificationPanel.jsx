import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import './NotificationPanel.css';

const NotificationPanel = ({ onClose }) => {
  const [filter, setFilter] = useState('all'); // all, unread
  const {
    notifications,
    unreadCount,
    loading,
    soundEnabled,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    toggleSound,
    getFilteredNotifications
  } = useNotifications();

  const filteredNotifications = filter === 'unread' 
    ? getFilteredNotifications({ unreadOnly: true })
    : notifications;

  const getNotificationIcon = (type) => {
    const icons = {
      test_completed: 'fas fa-check-circle',
      test_scored: 'fas fa-chart-line',
      code_generated: 'fas fa-qrcode',
      code_sent: 'fas fa-paper-plane',
      report_ready: 'fas fa-file-alt',
      system_alert: 'fas fa-exclamation-triangle',
      new_customer: 'fas fa-user-plus',
      low_codes: 'fas fa-exclamation-circle'
    };
    return icons[type] || 'fas fa-bell';
  };

  const getNotificationColor = (type) => {
    const colors = {
      test_completed: 'success',
      test_scored: 'info',
      code_generated: 'primary',
      code_sent: 'primary',
      report_ready: 'success',
      system_alert: 'warning',
      new_customer: 'info',
      low_codes: 'danger'
    };
    return colors[type] || 'default';
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate if URL is provided
    if (notification.data?.url) {
      window.location.href = notification.data.url;
      onClose();
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <h3>알림</h3>
        <div className="notification-actions">
          <button 
            className="sound-toggle"
            onClick={toggleSound}
            title={soundEnabled ? '알림음 끄기' : '알림음 켜기'}
          >
            <i className={`fas fa-volume-${soundEnabled ? 'up' : 'mute'}`}></i>
          </button>
          {unreadCount > 0 && (
            <button 
              className="mark-all-read"
              onClick={handleMarkAllAsRead}
            >
              모두 읽음
            </button>
          )}
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div className="notification-filter">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          전체 ({notifications.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          읽지 않음 ({unreadCount})
        </button>
      </div>

      <div className="notification-list">
        {loading ? (
          <div className="notification-loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>알림을 불러오는 중...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="notification-empty">
            <i className="fas fa-bell-slash"></i>
            <p>{filter === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}</p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div 
              key={notification.id}
              className={`notification-item ${!notification.read ? 'unread' : ''} ${getNotificationColor(notification.type)}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-icon">
                <i className={getNotificationIcon(notification.type)}></i>
              </div>
              
              <div className="notification-content">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <span className="notification-time">
                  {formatDistanceToNow(new Date(notification.created_at), { 
                    addSuffix: true,
                    locale: ko 
                  })}
                </span>
              </div>

              <div className="notification-actions">
                {!notification.read && (
                  <div className="unread-dot" />
                )}
                <button 
                  className="delete-btn"
                  onClick={(e) => handleDelete(e, notification.id)}
                  title="삭제"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
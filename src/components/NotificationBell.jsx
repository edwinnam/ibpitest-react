import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationPanel from './NotificationPanel';
import './NotificationBell.css';

const NotificationBell = () => {
  const [showPanel, setShowPanel] = useState(false);
  const { unreadCount, hasPermission, requestPermission } = useNotifications();

  const handleClick = async () => {
    // Request permission if not granted
    if (!hasPermission) {
      const permission = await requestPermission();
      if (permission === 'denied') {
        alert('알림을 받으려면 브라우저 설정에서 알림을 허용해주세요.');
      }
    }
    
    setShowPanel(!showPanel);
  };

  return (
    <div className="notification-bell-container">
      <button 
        className="notification-bell"
        onClick={handleClick}
        aria-label={`알림 ${unreadCount > 0 ? `(${unreadCount}개의 읽지 않은 알림)` : ''}`}
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <>
          <div 
            className="notification-backdrop"
            onClick={() => setShowPanel(false)}
          />
          <NotificationPanel onClose={() => setShowPanel(false)} />
        </>
      )}
    </div>
  );
};

export default NotificationBell;
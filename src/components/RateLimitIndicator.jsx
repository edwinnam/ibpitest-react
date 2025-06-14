import React, { useState, useEffect } from 'react';
import { useRateLimitStatus } from '../core/services/apiInterceptor';
import './RateLimitIndicator.css';

const RateLimitIndicator = ({ endpoint, show = false }) => {
  const [status, setStatus] = useState(null);
  const stats = useRateLimitStatus();

  useEffect(() => {
    if (show && endpoint && stats[endpoint]) {
      setStatus(stats[endpoint]);
    }
  }, [show, endpoint, stats]);

  if (!show || !status) return null;

  const percentage = (status.used / status.limit) * 100;
  const isWarning = percentage >= 75;
  const isDanger = percentage >= 90;

  return (
    <div className={`rate-limit-indicator ${isDanger ? 'danger' : isWarning ? 'warning' : ''}`}>
      <div className="rate-limit-bar">
        <div 
          className="rate-limit-progress"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="rate-limit-text">
        <span className="rate-limit-label">API 사용량:</span>
        <span className="rate-limit-value">
          {status.used} / {status.limit}
        </span>
        {status.remaining <= 5 && (
          <span className="rate-limit-warning">
            (남은 요청: {status.remaining})
          </span>
        )}
      </div>
    </div>
  );
};

export default RateLimitIndicator;
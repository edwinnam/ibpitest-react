import React, { useState, useEffect } from 'react';
import Modal from '../shared/components/Modal/Modal';
import './RateLimitErrorModal.css';

const RateLimitErrorModal = ({ error, onClose }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (error?.waitTime) {
      setTimeRemaining(error.waitTime);
      
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [error]);

  if (!error) return null;

  const formatTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds}초`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}분 ${remainingSeconds}초`;
  };

  return (
    <Modal isOpen={!!error} onClose={onClose}>
      <div className="rate-limit-error-modal">
        <div className="rate-limit-icon">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        
        <h2>요청 제한 초과</h2>
        
        <p className="rate-limit-message">
          너무 많은 요청을 보내셨습니다. 잠시 후 다시 시도해주세요.
        </p>

        {timeRemaining > 0 && (
          <div className="rate-limit-timer">
            <div className="timer-circle">
              <span className="timer-text">{formatTime(timeRemaining)}</span>
            </div>
            <p className="timer-label">후에 다시 시도 가능</p>
          </div>
        )}

        <div className="rate-limit-tips">
          <h3>요청 제한 안내</h3>
          <ul>
            <li>로그인 시도: 5분당 5회</li>
            <li>비밀번호 재설정: 5분당 3회</li>
            <li>일반 API 요청: 분당 60회</li>
          </ul>
        </div>

        <button 
          className="btn btn-primary"
          onClick={onClose}
          disabled={timeRemaining > 0}
        >
          {timeRemaining > 0 ? '대기 중...' : '확인'}
        </button>
      </div>
    </Modal>
  );
};

export default RateLimitErrorModal;
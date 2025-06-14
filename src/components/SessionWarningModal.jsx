import { useEffect } from 'react'
import { Modal } from '../shared/components'
import './SessionWarningModal.css'

const SessionWarningModal = ({ isOpen, remainingTime, onExtend, onLogout }) => {
  // 남은 시간을 분:초 형식으로 변환
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 긴급도에 따른 색상 결정
  const getUrgencyClass = () => {
    const seconds = Math.floor(remainingTime / 1000)
    if (seconds <= 30) return 'danger'
    if (seconds <= 60) return 'warning'
    return 'info'
  }

  // ESC 키로 연장하기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onExtend()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onExtend])

  return (
    <Modal isOpen={isOpen} onClose={onExtend} hideCloseButton>
      <div className="session-warning-modal">
        <div className="warning-icon">
          <i className="fas fa-clock"></i>
        </div>
        
        <h2 className="warning-title">세션 만료 경고</h2>
        
        <p className="warning-message">
          보안을 위해 일정 시간 동안 활동이 없으면 자동으로 로그아웃됩니다.
        </p>
        
        <div className={`countdown-display ${getUrgencyClass()}`}>
          <span className="countdown-label">남은 시간:</span>
          <span className="countdown-time">{formatTime(remainingTime)}</span>
        </div>
        
        <div className="warning-actions">
          <button 
            className="btn btn-primary btn-lg"
            onClick={onExtend}
          >
            <i className="fas fa-sync-alt me-2"></i>
            세션 연장하기
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={onLogout}
          >
            지금 로그아웃
          </button>
        </div>
        
        <p className="warning-hint">
          <i className="fas fa-info-circle me-1"></i>
          ESC 키를 눌러도 세션을 연장할 수 있습니다.
        </p>
      </div>
    </Modal>
  )
}

export default SessionWarningModal
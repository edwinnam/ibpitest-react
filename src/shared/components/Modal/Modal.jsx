import { useEffect, useRef } from 'react'
import { createFocusTrap, focusManager, focusFirstElement } from '../../../utils/focusManagement'
import './Modal.css'

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  footer,
  closeOnOverlayClick = true,
  hideCloseButton = false,
  ariaLabel,
  ariaDescribedBy
}) => {
  const modalRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      // 현재 포커스 저장
      previousFocusRef.current = document.activeElement
      
      // body 스크롤 방지
      document.body.style.overflow = 'hidden'
      
      // 포커스 트랩 설정
      const cleanup = modalRef.current && createFocusTrap(modalRef.current)
      
      // 첫 번째 포커스 가능한 요소로 포커스 이동
      setTimeout(() => {
        if (modalRef.current) {
          focusFirstElement(modalRef.current)
        }
      }, 100)
      
      return () => {
        cleanup && cleanup()
        document.body.style.overflow = 'unset'
      }
    } else {
      // 이전 포커스로 복원
      if (previousFocusRef.current && document.body.contains(previousFocusRef.current)) {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen])

  // ESC 키 처리
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="modal-overlay" 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title}
      aria-describedby={ariaDescribedBy}
    >
      <div className={`modal-content modal-${size}`} ref={modalRef}>
        {(title || !hideCloseButton) && (
          <div className="modal-header">
            {title && <h3 className="modal-title" id="modal-title">{title}</h3>}
            {!hideCloseButton && (
              <button 
                className="modal-close" 
                onClick={onClose}
                aria-label="닫기"
              >
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            )}
          </div>
        )}
        
        <div className="modal-body" id="modal-description">
          {children}
        </div>
        
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
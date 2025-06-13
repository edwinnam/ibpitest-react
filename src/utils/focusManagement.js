/**
 * 포커스 관리 유틸리티
 */

// 포커스 가능한 요소 선택자
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]'
].join(', ')

/**
 * 컨테이너 내의 포커스 가능한 요소들을 반환
 * @param {HTMLElement} container 
 * @returns {HTMLElement[]}
 */
export const getFocusableElements = (container = document) => {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS))
    .filter(el => el.offsetParent !== null) // 보이는 요소만
}

/**
 * 첫 번째 포커스 가능한 요소로 포커스 이동
 * @param {HTMLElement} container 
 */
export const focusFirstElement = (container = document) => {
  const elements = getFocusableElements(container)
  if (elements.length > 0) {
    elements[0].focus()
  }
}

/**
 * 마지막 포커스 가능한 요소로 포커스 이동
 * @param {HTMLElement} container 
 */
export const focusLastElement = (container = document) => {
  const elements = getFocusableElements(container)
  if (elements.length > 0) {
    elements[elements.length - 1].focus()
  }
}

/**
 * 포커스 트랩 설정
 * @param {HTMLElement} container 
 * @returns {Function} cleanup 함수
 */
export const createFocusTrap = (container) => {
  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return

    const focusableElements = getFocusableElements(container)
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Shift + Tab
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
    } 
    // Tab
    else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown)
  
  // Cleanup 함수 반환
  return () => {
    container.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * 현재 포커스 저장 및 복원
 */
export const focusManager = {
  savedFocus: null,

  save() {
    this.savedFocus = document.activeElement
  },

  restore() {
    if (this.savedFocus && document.body.contains(this.savedFocus)) {
      this.savedFocus.focus()
      this.savedFocus = null
    }
  }
}

/**
 * 스크린 리더 전용 알림
 * @param {string} message 
 * @param {string} priority - 'polite' | 'assertive'
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.style.position = 'absolute'
  announcement.style.left = '-10000px'
  announcement.style.width = '1px'
  announcement.style.height = '1px'
  announcement.style.overflow = 'hidden'
  
  announcement.textContent = message
  document.body.appendChild(announcement)
  
  // 잠시 후 제거
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

export default {
  getFocusableElements,
  focusFirstElement,
  focusLastElement,
  createFocusTrap,
  focusManager,
  announceToScreenReader
}
import { useEffect, useCallback } from 'react'

/**
 * 키보드 네비게이션을 위한 커스텀 훅
 * @param {Object} options - 설정 옵션
 * @param {boolean} options.enabled - 키보드 네비게이션 활성화 여부
 * @param {Function} options.onEscape - ESC 키 핸들러
 * @param {Function} options.onEnter - Enter 키 핸들러
 * @param {Object} options.shortcuts - 커스텀 단축키 매핑
 */
export const useKeyboardNavigation = (options = {}) => {
  const { 
    enabled = true, 
    onEscape, 
    onEnter,
    shortcuts = {},
    focusTrap = false,
    initialFocus = null
  } = options

  // 포커스 가능한 요소들 찾기
  const getFocusableElements = useCallback((container = document) => {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(container.querySelectorAll(selector))
      .filter(el => el.offsetParent !== null) // 보이는 요소만
  }, [])

  // 다음/이전 포커스 요소로 이동
  const moveFocus = useCallback((direction) => {
    const focusableElements = getFocusableElements()
    const currentIndex = focusableElements.indexOf(document.activeElement)

    if (currentIndex === -1) {
      focusableElements[0]?.focus()
      return
    }

    let nextIndex
    if (direction === 'forward') {
      nextIndex = (currentIndex + 1) % focusableElements.length
    } else {
      nextIndex = currentIndex - 1
      if (nextIndex < 0) nextIndex = focusableElements.length - 1
    }

    focusableElements[nextIndex]?.focus()
  }, [getFocusableElements])

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback((e) => {
    if (!enabled) return

    // ESC 키 처리
    if (e.key === 'Escape' && onEscape) {
      e.preventDefault()
      onEscape()
      return
    }

    // Enter 키 처리
    if (e.key === 'Enter' && onEnter) {
      // 폼 요소가 아닌 경우에만 기본 동작 방지
      const tagName = e.target.tagName.toLowerCase()
      if (!['input', 'textarea', 'select'].includes(tagName)) {
        e.preventDefault()
        onEnter()
      }
      return
    }

    // Tab 키로 포커스 이동
    if (e.key === 'Tab') {
      if (focusTrap) {
        e.preventDefault()
        moveFocus(e.shiftKey ? 'backward' : 'forward')
      }
      return
    }

    // 화살표 키로 네비게이션
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      const tagName = e.target.tagName.toLowerCase()
      if (!['input', 'textarea', 'select'].includes(tagName)) {
        e.preventDefault()
        moveFocus('forward')
      }
      return
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      const tagName = e.target.tagName.toLowerCase()
      if (!['input', 'textarea', 'select'].includes(tagName)) {
        e.preventDefault()
        moveFocus('backward')
      }
      return
    }

    // 커스텀 단축키 처리
    const shortcutKey = getShortcutKey(e)
    if (shortcuts[shortcutKey]) {
      e.preventDefault()
      shortcuts[shortcutKey](e)
    }
  }, [enabled, onEscape, onEnter, shortcuts, focusTrap, moveFocus])

  // 단축키 문자열 생성
  const getShortcutKey = (e) => {
    const keys = []
    if (e.ctrlKey) keys.push('ctrl')
    if (e.altKey) keys.push('alt')
    if (e.shiftKey) keys.push('shift')
    if (e.metaKey) keys.push('meta')
    keys.push(e.key.toLowerCase())
    return keys.join('+')
  }

  // 초기 포커스 설정
  useEffect(() => {
    if (enabled && initialFocus) {
      const element = typeof initialFocus === 'string' 
        ? document.querySelector(initialFocus)
        : initialFocus

      setTimeout(() => {
        element?.focus()
      }, 100)
    }
  }, [enabled, initialFocus])

  // 이벤트 리스너 등록
  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])

  return {
    getFocusableElements,
    moveFocus
  }
}

// 글로벌 키보드 단축키 정의
export const KEYBOARD_SHORTCUTS = {
  // 네비게이션
  'alt+h': { description: '홈으로 이동', path: '/dashboard' },
  'alt+t': { description: '검사 관리', path: '/test-management' },
  'alt+s': { description: '채점하기', path: '/manual-scoring' },
  'alt+r': { description: '결과보기', path: '/test-results' },
  'alt+g': { description: '단체검사', path: '/group-test' },
  'alt+m': { description: '마이페이지', path: '/mypage' },
  
  // 액션
  'ctrl+n': { description: '새로 만들기' },
  'ctrl+s': { description: '저장하기' },
  'ctrl+p': { description: '인쇄하기' },
  'ctrl+/': { description: '단축키 도움말' },
  
  // 접근성
  'alt+1': { description: '주 콘텐츠로 이동' },
  'alt+2': { description: '사이드바로 이동' },
  'alt+3': { description: '검색으로 이동' }
}

export default useKeyboardNavigation
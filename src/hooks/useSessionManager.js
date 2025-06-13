import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../modules/auth/AuthContext'

const DEFAULT_TIMEOUT = 30 * 60 * 1000 // 30분
const WARNING_TIME = 5 * 60 * 1000 // 5분 전 경고
const COUNTDOWN_INTERVAL = 1000 // 1초

export const useSessionManager = (options = {}) => {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  
  const {
    timeout = DEFAULT_TIMEOUT,
    warningTime = WARNING_TIME,
    onTimeout,
    onWarning,
    enabled = true
  } = options

  const [isWarningVisible, setIsWarningVisible] = useState(false)
  const [remainingTime, setRemainingTime] = useState(timeout)
  const [lastActivity, setLastActivity] = useState(Date.now())
  
  const timeoutRef = useRef(null)
  const warningRef = useRef(null)
  const countdownRef = useRef(null)

  // 활동 감지 이벤트
  const activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ]

  // 세션 타임아웃 처리
  const handleTimeout = useCallback(async () => {
    if (onTimeout) {
      onTimeout()
    } else {
      // 기본 동작: 로그아웃
      await signOut()
      navigate('/login', { 
        state: { message: '세션이 만료되었습니다. 다시 로그인해주세요.' } 
      })
    }
  }, [signOut, navigate, onTimeout])

  // 경고 표시
  const showWarning = useCallback(() => {
    setIsWarningVisible(true)
    
    if (onWarning) {
      onWarning()
    }

    // 카운트다운 시작
    let timeLeft = warningTime
    countdownRef.current = setInterval(() => {
      timeLeft -= COUNTDOWN_INTERVAL
      setRemainingTime(timeLeft)
      
      if (timeLeft <= 0) {
        clearInterval(countdownRef.current)
        handleTimeout()
      }
    }, COUNTDOWN_INTERVAL)
  }, [warningTime, onWarning, handleTimeout])

  // 타이머 재설정
  const resetTimer = useCallback(() => {
    // 기존 타이머 정리
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
    }

    // 경고 숨기기
    setIsWarningVisible(false)
    setRemainingTime(timeout)
    setLastActivity(Date.now())

    if (!enabled) return

    // 경고 타이머 설정
    warningRef.current = setTimeout(() => {
      showWarning()
    }, timeout - warningTime)

    // 타임아웃 타이머 설정
    timeoutRef.current = setTimeout(() => {
      handleTimeout()
    }, timeout)
  }, [enabled, timeout, warningTime, showWarning, handleTimeout])

  // 세션 연장
  const extendSession = useCallback(() => {
    resetTimer()
  }, [resetTimer])

  // 활동 감지 핸들러
  const handleActivity = useCallback(() => {
    if (!isWarningVisible) {
      resetTimer()
    }
  }, [isWarningVisible, resetTimer])

  // 이벤트 리스너 등록/해제
  useEffect(() => {
    if (!enabled) return

    // 이벤트 리스너 등록
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity)
    })

    // 초기 타이머 시작
    resetTimer()

    // 클린업
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [enabled, handleActivity, resetTimer])

  // 페이지 visibility 변경 감지
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 페이지가 다시 활성화되면 타이머 재설정
        resetTimer()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [resetTimer])

  return {
    isWarningVisible,
    remainingTime,
    extendSession,
    lastActivity,
    resetTimer
  }
}

export default useSessionManager
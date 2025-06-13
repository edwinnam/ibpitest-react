import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../modules/auth/AuthContext'
import { useOrganization } from '../../modules/organization/OrganizationContext'
import useSessionManager from '../../hooks/useSessionManager'
import useSessionStore from '../../store/useSessionStore'
import useKeyboardNavigation, { KEYBOARD_SHORTCUTS } from '../../hooks/useKeyboardNavigation'
import SessionWarningModal from '../../components/SessionWarningModal'
import KeyboardShortcutsModal from '../../components/KeyboardShortcutsModal'
import SkipLink from '../../components/SkipLink'
import './MainLayout.css'

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const { user, signOut } = useAuth()
  const { organization, getOrgName, getAvailableCodes } = useOrganization()
  const navigate = useNavigate()
  const location = useLocation()

  // 세션 설정 가져오기
  const { sessionSettings } = useSessionStore()
  
  // 세션 관리
  const {
    isWarningVisible,
    remainingTime,
    extendSession,
    resetTimer
  } = useSessionManager({
    timeout: sessionSettings.timeout * 60 * 1000, // 분을 밀리초로 변환
    warningTime: sessionSettings.warningTime * 60 * 1000, // 분을 밀리초로 변환
    enabled: sessionSettings.autoLogout
  })

  // 키보드 네비게이션 설정
  const shortcuts = Object.entries(KEYBOARD_SHORTCUTS).reduce((acc, [key, value]) => {
    if (value.path) {
      acc[key] = () => navigate(value.path)
    } else if (key === 'ctrl+/') {
      acc[key] = () => setShowShortcuts(true)
    } else if (key === 'ctrl+p') {
      acc[key] = () => window.print()
    }
    return acc
  }, {})

  useKeyboardNavigation({
    enabled: true,
    onEscape: () => {
      if (sidebarOpen) setSidebarOpen(false)
      if (showShortcuts) setShowShortcuts(false)
    },
    shortcuts,
    initialFocus: location.pathname === '/dashboard' ? '[data-focus="main"]' : null
  })

  const handleLogout = async () => {
    const { error } = await signOut()
    if (!error) {
      navigate('/login')
    }
  }

  const menuItems = [
    { path: '/dashboard', icon: 'fas fa-home', label: '대시보드' },
    { path: '/test-management', icon: 'fas fa-clipboard-check', label: '온라인 검사' },
    { path: '/manual-scoring', icon: 'fas fa-edit', label: '채점하기' },
    { path: '/test-results', icon: 'fas fa-chart-line', label: '결과보기' },
    { path: '/diagram', icon: 'fas fa-sitemap', label: '조직도' },
    { path: '/group-test', icon: 'fas fa-users', label: '단체검사' },
    { path: '/mypage', icon: 'fas fa-user', label: '마이페이지' },
    { path: '/notice', icon: 'fas fa-bullhorn', label: '공지사항' },
    { path: '/user-guide', icon: 'fas fa-question-circle', label: '사용 가이드' },
  ]

  const isActive = (path) => location.pathname === path

  // 타이머 기능
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="main-layout">
      <SkipLink />
      
      {/* 사이드바 */}
      <nav 
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
        role="navigation"
        aria-label="주 메뉴"
      >
        <div className="sidebar-header">
          <h4>IBPI 검사시스템</h4>
          <p className="subtitle">온라인 검사</p>
          <button 
            className="close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="사이드바 닫기"
          >
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                navigate(item.path)
                setSidebarOpen(false)
              }}
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              <i className={`${item.icon} me-2`} aria-hidden="true"></i>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <a 
            href="/customer/login" 
            target="_blank"
            rel="noopener noreferrer"
            className="customer-link"
          >
            <i className="fas fa-user-check me-2"></i>
            고객 검사 페이지
          </a>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt me-2"></i>
            로그아웃
          </button>
        </div>
      </nav>

      {/* 메인 컨텐츠 영역 */}
      <div className="main-content">
        {/* 상단 네비게이션 바 */}
        <header className="top-nav" role="banner">
          <div className="nav-left">
            <button 
              className="menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="메뉴 열기"
            >
              <i className="fas fa-bars" aria-hidden="true"></i>
            </button>
            
            <div className="org-info">
              <span className="label">기관명:</span>
              <span className="value">{getOrgName() || '미지정'}</span>
            </div>
            
            <div className="code-info">
              <span className="label">보유코드수:</span>
              <span className="value">{getAvailableCodes()}</span>
            </div>
            
            <button 
              className="btn-primary-sm"
              onClick={() => navigate('/test-management')}
            >
              <i className="fas fa-plus-circle me-1"></i>
              코드 생성
            </button>
          </div>

          <div className="nav-right">
            <button className="icon-btn">
              <i className="fas fa-bell"></i>
              <span>알림</span>
            </button>
            
            <button 
              className="icon-btn"
              onClick={() => setShowShortcuts(true)}
              title="키보드 단축키 (Ctrl + /)"
            >
              <i className="fas fa-keyboard"></i>
              <span>단축키</span>
            </button>
            
            <div className="timer">
              <i className="far fa-clock me-1"></i>
              <span>{formatTime(elapsedTime)}</span>
              <button className="link-btn" onClick={extendSession}>연장</button>
            </div>
            
            <button className="icon-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>로그아웃</span>
            </button>
          </div>
        </header>

        {/* 페이지 컨텐츠 */}
        <main className="page-content" id="main-content" role="main">
          <Outlet />
        </main>
      </div>

      {/* 세션 경고 모달 */}
      <SessionWarningModal
        isOpen={isWarningVisible}
        remainingTime={remainingTime}
        onExtend={extendSession}
        onLogout={handleLogout}
      />

      {/* 키보드 단축키 모달 */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  )
}

export default MainLayout
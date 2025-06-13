import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../modules/auth/AuthContext'
import './MainLayout.css'

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    const { error } = await signOut()
    if (!error) {
      navigate('/login')
    }
  }

  const menuItems = [
    { path: '/dashboard', icon: 'fas fa-home', label: '대시보드' },
    { path: '/test-management', icon: 'fas fa-clipboard-check', label: '온라인 검사' },
    { path: '/test-scoring', icon: 'fas fa-calculator', label: '채점하기' },
    { path: '/test-results', icon: 'fas fa-chart-line', label: '결과보기' },
    { path: '/group-test', icon: 'fas fa-users', label: '단체검사' },
    { path: '/mypage', icon: 'fas fa-user', label: '마이페이지' },
    { path: '/notice', icon: 'fas fa-bullhorn', label: '공지사항' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="main-layout">
      {/* 사이드바 */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h4>IBPI 검사시스템</h4>
          <p className="subtitle">온라인 검사</p>
          <button 
            className="close-btn"
            onClick={() => setSidebarOpen(false)}
          >
            <i className="fas fa-times"></i>
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
            >
              <i className={`${item.icon} me-2`}></i>
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
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="main-content">
        {/* 상단 네비게이션 바 */}
        <header className="top-nav">
          <div className="nav-left">
            <button 
              className="menu-toggle"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="fas fa-bars"></i>
            </button>
            
            <div className="org-info">
              <span className="label">기관명:</span>
              <span className="value">{user?.user_metadata?.org_name || '미지정'}</span>
            </div>
            
            <div className="code-info">
              <span className="label">보유코드수:</span>
              <span className="value">0</span>
            </div>
            
            <button className="btn-primary-sm">
              <i className="fas fa-plus-circle me-1"></i>
              코드 생성
            </button>
          </div>

          <div className="nav-right">
            <button className="icon-btn">
              <i className="fas fa-bell"></i>
              <span>알림</span>
            </button>
            
            <div className="timer">
              <i className="far fa-clock me-1"></i>
              <span>00:00:00</span>
              <button className="link-btn">연장</button>
            </div>
            
            <button className="icon-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>로그아웃</span>
            </button>
          </div>
        </header>

        {/* 페이지 컨텐츠 */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
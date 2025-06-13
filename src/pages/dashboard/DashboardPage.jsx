import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../modules/auth/AuthContext'
import { useSupabaseQuery } from '../../core/hooks/useSupabaseQuery'
import { organizationService } from '../../core/services/organizationService'
import { supabase } from '../../core/services/supabase'
import './DashboardPage.css'

const DashboardPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [recentActivities, setRecentActivities] = useState([])
  
  // 기관 정보 가져오기
  const orgNumber = user?.user_metadata?.org_number || sessionStorage.getItem('orgNumber')

  // 통계 데이터 쿼리
  const { data: stats, isLoading: statsLoading } = useSupabaseQuery(
    ['organizationStats', orgNumber],
    () => organizationService.getOrganizationStats(orgNumber),
    { enabled: !!orgNumber }
  )

  // 최근 활동 쿼리
  const { data: recentCodes, isLoading: activitiesLoading } = useSupabaseQuery(
    ['recentActivities', orgNumber],
    async () => {
      const { data, error } = await supabase
        .from('used_codes')
        .select('*')
        .eq('org_number', orgNumber)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      return data || []
    },
    { enabled: !!orgNumber }
  )

  // 최근 활동 포맷팅
  useEffect(() => {
    if (recentCodes) {
      const activities = recentCodes.map(code => {
        let type = 'code_created'
        let time = code.created_at
        
        if (code.status === '완료') {
          type = 'test_complete'
          time = code.last_access || code.created_at
        } else if (code.send_status === '발송완료') {
          type = 'code_sent'
          time = code.sent_at || code.created_at
        } else if (code.last_access) {
          type = 'test_start'
          time = code.last_access
        }

        return {
          id: code.id,
          type,
          user: code.name,
          time: formatRelativeTime(time),
          status: code.status
        }
      })
      
      setRecentActivities(activities)
    }
  }, [recentCodes])

  // 상대적 시간 포맷팅
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    
    return date.toLocaleDateString('ko-KR')
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'test_complete':
        return 'fas fa-check-circle text-success'
      case 'test_start':
        return 'fas fa-play-circle text-info'
      case 'code_sent':
        return 'fas fa-paper-plane text-warning'
      case 'code_created':
        return 'fas fa-plus-circle text-primary'
      default:
        return 'fas fa-info-circle'
    }
  }

  const getActivityText = (type) => {
    switch (type) {
      case 'test_complete':
        return '검사 완료'
      case 'test_start':
        return '검사 시작'
      case 'code_sent':
        return '코드 발송'
      case 'code_created':
        return '코드 생성'
      default:
        return '활동'
    }
  }

  if (statsLoading || activitiesLoading) {
    return (
      <div className="dashboard-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>대시보드 로딩 중...</p>
      </div>
    )
  }

  const dashboardStats = stats || {
    totalTests: 0,
    completedTests: 0,
    pendingTests: 0,
    availableCodes: 0
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>대시보드</h1>
        <p className="page-subtitle">IBPI 검사 시스템 현황을 한눈에 확인하세요</p>
      </div>

      {/* 통계 카드 섹션 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon bg-primary">
            <i className="fas fa-clipboard-list"></i>
          </div>
          <div className="stat-content">
            <h3>전체 검사</h3>
            <p className="stat-number">{dashboardStats.totalTests}</p>
            <span className="stat-label">총 진행된 검사</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-success">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>완료된 검사</h3>
            <p className="stat-number">{dashboardStats.completedTests}</p>
            <span className="stat-label">
              완료율 {dashboardStats.totalTests > 0 
                ? Math.round((dashboardStats.completedTests / dashboardStats.totalTests) * 100) 
                : 0}%
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-warning">
            <i className="fas fa-hourglass-half"></i>
          </div>
          <div className="stat-content">
            <h3>진행 중</h3>
            <p className="stat-number">{dashboardStats.pendingTests}</p>
            <span className="stat-label">미완료 검사</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-info">
            <i className="fas fa-qrcode"></i>
          </div>
          <div className="stat-content">
            <h3>검사 코드</h3>
            <p className="stat-number">{dashboardStats.availableCodes}</p>
            <span className="stat-label">사용 가능한 코드</span>
          </div>
        </div>
      </div>

      {/* 빠른 액세스 섹션 */}
      <div className="quick-access-section">
        <h2 className="section-title">빠른 실행</h2>
        <div className="quick-access-grid">
          <button 
            onClick={() => navigate('/test-management')} 
            className="quick-access-card"
          >
            <i className="fas fa-plus-circle"></i>
            <span>새 검사 생성</span>
          </button>
          <button 
            onClick={() => navigate('/test-management#code-waiting')} 
            className="quick-access-card"
          >
            <i className="fas fa-paper-plane"></i>
            <span>코드 발송</span>
          </button>
          <button 
            onClick={() => navigate('/test-scoring')} 
            className="quick-access-card"
          >
            <i className="fas fa-calculator"></i>
            <span>채점하기</span>
          </button>
          <button 
            onClick={() => navigate('/test-results')} 
            className="quick-access-card"
          >
            <i className="fas fa-chart-line"></i>
            <span>결과 보기</span>
          </button>
          <button 
            onClick={() => navigate('/biz-partner-info')} 
            className="quick-access-card"
          >
            <i className="fas fa-building"></i>
            <span>기관 정보</span>
          </button>
          <button 
            onClick={() => navigate('/data-management')} 
            className="quick-access-card"
          >
            <i className="fas fa-database"></i>
            <span>데이터 관리</span>
          </button>
        </div>
      </div>

      {/* 최근 활동 섹션 */}
      <div className="recent-activity-section">
        <h2 className="section-title">최근 활동</h2>
        {recentActivities.length > 0 ? (
          <div className="activity-list">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  <i className={getActivityIcon(activity.type)}></i>
                </div>
                <div className="activity-content">
                  <p className="activity-text">
                    <strong>{activity.user}</strong>님이 {getActivityText(activity.type)}했습니다
                  </p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="text-muted">최근 활동이 없습니다.</p>
          </div>
        )}
        <div className="activity-footer">
          <button 
            onClick={() => navigate('/test-management#code-complete')} 
            className="view-all-link"
          >
            전체 활동 보기 <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>

      {/* 개발 환경에서만 보이는 데모 링크 */}
      {import.meta.env.DEV && (
        <div className="mt-4">
          <button 
            onClick={() => navigate('/reports/demo')} 
            className="btn btn-outline-info"
          >
            <i className="fas fa-eye me-2"></i>
            보고서 데모 보기
          </button>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
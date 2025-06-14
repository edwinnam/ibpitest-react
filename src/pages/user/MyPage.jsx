import { useState } from 'react'
import { useAuth } from '../../modules/auth/AuthContext'
import { useNavigate } from 'react-router-dom'
import useSessionStore from '../../store/useSessionStore'
import TwoFactorSetup from '../../components/TwoFactorSetup'
import './MyPage.css'

const MyPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)
  
  // 세션 설정
  const { sessionSettings, updateSessionSettings } = useSessionStore()
  
  // 사용자 타입 확인 (기관 사용자인지 일반 고객인지)
  const isOrganizationUser = !!user?.user_metadata?.org_number
  
  const handleSessionSettingChange = (field, value) => {
    updateSessionSettings({ [field]: value })
  }
  
  return (
    <div className="my-page">
      <div className="page-header">
        <h1>마이페이지</h1>
        <p className="page-subtitle">계정 정보 및 설정을 관리합니다</p>
      </div>

      <div className="content-wrapper">
        {/* 탭 메뉴 */}
        <div className="tab-menu">
          <button 
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="fas fa-user"></i>
            프로필 정보
          </button>
          <button 
            className={`tab-button ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            <i className="fas fa-cog"></i>
            계정 관리
          </button>
          <button 
            className={`tab-button ${activeTab === 'session' ? 'active' : ''}`}
            onClick={() => setActiveTab('session')}
          >
            <i className="fas fa-clock"></i>
            세션 설정
          </button>
          <button 
            className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <i className="fas fa-shield-alt"></i>
            보안 설정
          </button>
        </div>

        {/* 프로필 정보 탭 */}
        {activeTab === 'profile' && (
          <div className="profile-section">
            <h3>프로필 정보</h3>
            <table className="table">
              <tbody>
                <tr>
                  <th width="30%">이메일</th>
                  <td>{user?.email || '-'}</td>
                </tr>
                {isOrganizationUser ? (
                  <>
                    <tr>
                      <th>기관명</th>
                      <td>{user?.user_metadata?.org_name || '-'}</td>
                    </tr>
                    <tr>
                      <th>기관번호</th>
                      <td>{user?.user_metadata?.org_number || '-'}</td>
                    </tr>
                  </>
                ) : (
                  <>
                    <tr>
                      <th>이름</th>
                      <td>{user?.user_metadata?.name || '-'}</td>
                    </tr>
                    <tr>
                      <th>고객번호</th>
                      <td>{user?.user_metadata?.customer_number || '-'}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 계정 관리 탭 */}
        {activeTab === 'account' && (
          <div className="action-section">
            <h3>계정 관리</h3>
            <div className="action-buttons">
              {isOrganizationUser ? (
                <button 
                  onClick={() => navigate('/biz-partner-info')}
                  className="action-button"
                >
                  <i className="fas fa-building"></i>
                  <span>기관 정보 관리</span>
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/customer-info')}
                  className="action-button"
                >
                  <i className="fas fa-user"></i>
                  <span>개인 정보 관리</span>
                </button>
              )}
              
              <button 
                onClick={() => navigate('/auth/reset-password')}
                className="action-button"
              >
                <i className="fas fa-key"></i>
                <span>비밀번호 변경</span>
              </button>
            </div>
          </div>
        )}

        {/* 세션 설정 탭 */}
        {activeTab === 'session' && (
          <div className="session-settings-section">
            <h3>세션 설정</h3>
            <div className="settings-group">
              <div className="setting-item">
                <label>
                  <span className="setting-label">
                    <i className="fas fa-hourglass-half"></i>
                    세션 타임아웃 (분)
                  </span>
                  <input 
                    type="number" 
                    min="5" 
                    max="120"
                    value={sessionSettings.timeout}
                    onChange={(e) => handleSessionSettingChange('timeout', parseInt(e.target.value))}
                    className="form-control"
                  />
                  <span className="setting-hint">5분 ~ 120분 사이로 설정 가능합니다</span>
                </label>
              </div>

              <div className="setting-item">
                <label>
                  <span className="setting-label">
                    <i className="fas fa-exclamation-triangle"></i>
                    경고 표시 시간 (분)
                  </span>
                  <input 
                    type="number" 
                    min="1" 
                    max="30"
                    value={sessionSettings.warningTime}
                    onChange={(e) => handleSessionSettingChange('warningTime', parseInt(e.target.value))}
                    className="form-control"
                  />
                  <span className="setting-hint">세션 만료 전 경고를 표시할 시간입니다</span>
                </label>
              </div>

              <div className="setting-item">
                <label className="toggle-label">
                  <span className="setting-label">
                    <i className="fas fa-sign-out-alt"></i>
                    자동 로그아웃
                  </span>
                  <div className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={sessionSettings.autoLogout}
                      onChange={(e) => handleSessionSettingChange('autoLogout', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
                <span className="setting-hint">세션 만료 시 자동으로 로그아웃됩니다</span>
              </div>

              <div className="setting-item">
                <label className="toggle-label">
                  <span className="setting-label">
                    <i className="fas fa-mouse-pointer"></i>
                    활동 기억
                  </span>
                  <div className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={sessionSettings.rememberActivity}
                      onChange={(e) => handleSessionSettingChange('rememberActivity', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
                <span className="setting-hint">마우스 움직임이나 키보드 입력 시 세션을 연장합니다</span>
              </div>
            </div>

            <div className="settings-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  if (confirm('세션 설정을 초기값으로 되돌리시겠습니까?')) {
                    updateSessionSettings({
                      timeout: 30,
                      warningTime: 5,
                      autoLogout: true,
                      rememberActivity: true
                    })
                  }
                }}
              >
                초기값으로 복원
              </button>
            </div>
          </div>
        )}

        {/* 보안 설정 탭 */}
        {activeTab === 'security' && (
          <div className="security-section">
            <h3>보안 설정</h3>
            <div className="security-options">
              <div className="security-item">
                <div className="security-info">
                  <h4>
                    <i className="fas fa-mobile-alt"></i>
                    2단계 인증 (2FA)
                  </h4>
                  <p>인증 앱을 사용하여 계정 보안을 강화합니다.</p>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowTwoFactorSetup(true)}
                >
                  설정
                </button>
              </div>

              <div className="security-item">
                <div className="security-info">
                  <h4>
                    <i className="fas fa-history"></i>
                    최근 로그인 기록
                  </h4>
                  <p>최근 30일간의 로그인 기록을 확인합니다.</p>
                </div>
                <button 
                  className="btn btn-secondary"
                  disabled
                >
                  곧 제공 예정
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2단계 인증 설정 모달 */}
      <TwoFactorSetup 
        isOpen={showTwoFactorSetup}
        onClose={() => setShowTwoFactorSetup(false)}
        onSuccess={() => {
          setShowTwoFactorSetup(false)
        }}
      />
    </div>
  )
}

export default MyPage
import { useAuth } from '../../modules/auth/AuthContext'
import { useNavigate } from 'react-router-dom'
import './MyPage.css'

const MyPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // 사용자 타입 확인 (기관 사용자인지 일반 고객인지)
  const isOrganizationUser = !!user?.user_metadata?.org_number
  
  return (
    <div className="my-page">
      <div className="page-header">
        <h1>마이페이지</h1>
        <p className="page-subtitle">계정 정보 및 설정을 관리합니다</p>
      </div>

      <div className="content-wrapper">
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
      </div>
    </div>
  )
}

export default MyPage
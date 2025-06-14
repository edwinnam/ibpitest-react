import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './TestIntroPage.css'

const TestIntroPage = () => {
  const navigate = useNavigate()
  const [customerInfo, setCustomerInfo] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 세션에서 고객 정보 확인
    const info = sessionStorage.getItem('customerInfo')
    if (!info) {
      navigate('/customer/login')
      return
    }
    setCustomerInfo(JSON.parse(info))
  }, [navigate])

  const handleStartTest = () => {
    setLoading(true)
    // 검사 페이지로 이동
    navigate('/customer/test')
  }

  const handleLogout = () => {
    sessionStorage.removeItem('customerInfo')
    navigate('/customer/login')
  }

  if (!customerInfo) {
    return null
  }

  const getTestTypeInfo = (testType) => {
    switch (testType) {
      case '성인용':
        return {
          title: 'IBPI 성인용 검사',
          duration: '약 20-30분',
          questions: '120문항',
          description: '성인의 대인관계 성향을 종합적으로 평가하는 검사입니다.'
        }
      case '청소년용':
        return {
          title: 'IBPI 청소년용 검사',
          duration: '약 15-25분',
          questions: '100문항',
          description: '청소년의 대인관계 발달과 적응을 평가하는 검사입니다.'
        }
      case '아동용':
        return {
          title: 'IBPI 아동용 검사',
          duration: '약 15-20분',
          questions: '80문항',
          description: '아동의 또래관계와 사회성 발달을 평가하는 검사입니다.'
        }
      default:
        return {
          title: 'IBPI 심리검사',
          duration: '약 20-30분',
          questions: '문항',
          description: '대인관계 성향을 평가하는 검사입니다.'
        }
    }
  }

  const testInfo = getTestTypeInfo(customerInfo.testType)

  return (
    <div className="test-intro-page">
      <div className="intro-container">
        <div className="intro-card">
          <div className="intro-header">
            <h1>{testInfo.title}</h1>
            <p className="welcome-message">
              <strong>{customerInfo.name}</strong>님, 안녕하세요!
            </p>
          </div>

          <div className="test-info">
            <div className="info-item">
              <i className="fas fa-clock"></i>
              <div>
                <h4>예상 소요시간</h4>
                <p>{testInfo.duration}</p>
              </div>
            </div>
            <div className="info-item">
              <i className="fas fa-list-ol"></i>
              <div>
                <h4>문항 수</h4>
                <p>{testInfo.questions}</p>
              </div>
            </div>
            <div className="info-item">
              <i className="fas fa-info-circle"></i>
              <div>
                <h4>검사 설명</h4>
                <p>{testInfo.description}</p>
              </div>
            </div>
          </div>

          <div className="instructions">
            <h3>검사 안내사항</h3>
            <ul>
              <li>
                <i className="fas fa-check-circle"></i>
                조용하고 집중할 수 있는 환경에서 검사를 진행해주세요.
              </li>
              <li>
                <i className="fas fa-check-circle"></i>
                각 문항을 잘 읽고 자신의 평소 모습과 가장 가까운 답변을 선택해주세요.
              </li>
              <li>
                <i className="fas fa-check-circle"></i>
                정답이 있는 검사가 아니므로 솔직하게 응답해주세요.
              </li>
              <li>
                <i className="fas fa-check-circle"></i>
                중간에 검사를 중단하면 처음부터 다시 시작해야 합니다.
              </li>
              <li>
                <i className="fas fa-check-circle"></i>
                모든 문항에 응답해야 검사가 완료됩니다.
              </li>
            </ul>
          </div>

          <div className="agreement-section">
            <div className="alert alert-info">
              <i className="fas fa-shield-alt me-2"></i>
              <div>
                <strong>개인정보 보호 안내</strong>
                <p className="mb-0">
                  검사 결과는 안전하게 보호되며, 검사를 의뢰한 기관에만 제공됩니다.
                </p>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleStartTest}
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  준비 중...
                </>
              ) : (
                <>
                  <i className="fas fa-play me-2"></i>
                  검사 시작하기
                </>
              )}
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={handleLogout}
            >
              나중에 하기
            </button>
          </div>
        </div>
      </div>

      <div className="page-footer">
        <p>&copy; 2025 IBPI. All rights reserved.</p>
      </div>
    </div>
  )
}

export default TestIntroPage
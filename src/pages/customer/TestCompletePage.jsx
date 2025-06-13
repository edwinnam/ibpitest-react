import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './TestCompletePage.css'

const TestCompletePage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // 세션 정보 확인
    const customerInfo = sessionStorage.getItem('customerInfo')
    if (!customerInfo) {
      navigate('/customer/login')
    }
  }, [navigate])

  const handleClose = () => {
    // 세션 정보 삭제
    sessionStorage.removeItem('customerInfo')
    // 로그인 페이지로 이동
    navigate('/customer/login')
  }

  return (
    <div className="test-complete-page">
      <div className="complete-container">
        <div className="complete-card">
          <div className="complete-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          
          <h1>검사가 완료되었습니다</h1>
          
          <div className="complete-message">
            <p>
              소중한 시간을 내어 검사에 참여해 주셔서 감사합니다.
            </p>
            <p>
              검사 결과는 전문가의 분석을 거쳐 
              검사를 신청하신 기관으로 전달될 예정입니다.
            </p>
          </div>

          <div className="info-box">
            <h3>안내사항</h3>
            <ul>
              <li>
                <i className="fas fa-clock"></i>
                검사 결과는 영업일 기준 3-5일 이내에 확인 가능합니다.
              </li>
              <li>
                <i className="fas fa-building"></i>
                결과 확인은 검사를 신청하신 기관을 통해 가능합니다.
              </li>
              <li>
                <i className="fas fa-shield-alt"></i>
                귀하의 검사 결과는 안전하게 보호되며, 허가된 인원만 열람 가능합니다.
              </li>
              <li>
                <i className="fas fa-question-circle"></i>
                검사에 대한 문의사항은 신청 기관으로 연락 부탁드립니다.
              </li>
            </ul>
          </div>

          <div className="complete-footer">
            <button 
              className="btn btn-primary btn-lg"
              onClick={handleClose}
            >
              <i className="fas fa-home me-2"></i>
              종료하기
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

export default TestCompletePage
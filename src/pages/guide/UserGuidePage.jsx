import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './UserGuidePage.css'

const UserGuidePage = () => {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('overview')

  const sections = {
    overview: '시스템 개요',
    login: '로그인 방법',
    codeGeneration: '검사 코드 생성',
    groupTest: '그룹 검사 관리',
    scoring: '채점하기',
    results: '결과 조회',
    reports: '보고서 출력',
    faq: '자주 묻는 질문'
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="guide-content">
            <h2>IBPI 검사 시스템 개요</h2>
            <p>IBPI(한국대인관계균형심리검사)는 개인의 대인관계 행동 패턴을 분석하는 표준화된 심리검사입니다.</p>
            
            <h3>시스템 특징</h3>
            <ul>
              <li>성인용(107문항), 청소년용(103문항), 어린이용(95문항) 검사 제공</li>
              <li>온라인/오프라인 검사 모두 지원</li>
              <li>자동 채점 및 결과 분석</li>
              <li>PDF 보고서 생성</li>
              <li>Excel 데이터 내보내기</li>
              <li>SMS 알림 기능</li>
            </ul>

            <h3>검사 결과 척도</h3>
            <div className="scale-info">
              <div className="scale-item">
                <strong>CO (협동성)</strong>: 타인과의 협력적 태도를 측정
              </div>
              <div className="scale-item">
                <strong>CL (친밀성)</strong>: 친밀한 관계 형성 능력을 평가
              </div>
              <div className="scale-item">
                <strong>OB (의무감)</strong>: 규칙과 권위에 대한 순응도 측정
              </div>
              <div className="scale-item">
                <strong>GU (포기)</strong>: 어려움에 대한 대처 방식 평가
              </div>
              <div className="scale-item">
                <strong>SD (자기발전)</strong>: 독립성과 자기확신 정도 측정
              </div>
            </div>
          </div>
        )

      case 'login':
        return (
          <div className="guide-content">
            <h2>로그인 방법</h2>
            
            <h3>기관 로그인</h3>
            <ol>
              <li>메인 페이지에서 "기관 로그인" 버튼 클릭</li>
              <li>발급받은 기관 ID와 비밀번호 입력</li>
              <li>"로그인" 버튼 클릭</li>
              <li>로그인 성공 시 대시보드로 이동</li>
            </ol>

            <div className="alert alert-info">
              <i className="fas fa-info-circle"></i> 
              비밀번호를 잊으신 경우 "비밀번호 찾기"를 클릭하여 재설정할 수 있습니다.
            </div>

            <h3>검사자 로그인</h3>
            <ol>
              <li>메인 페이지에서 "검사자 로그인" 버튼 클릭</li>
              <li>기관에서 발급받은 검사 코드 입력</li>
              <li>개인정보 입력 후 검사 시작</li>
            </ol>
          </div>
        )

      case 'codeGeneration':
        return (
          <div className="guide-content">
            <h2>검사 코드 생성</h2>
            
            <h3>개별 코드 생성</h3>
            <ol>
              <li>대시보드에서 "검사 관리" 메뉴 클릭</li>
              <li>"코드 생성" 탭 선택</li>
              <li>검사 종류 선택 (성인용/청소년용/어린이용)</li>
              <li>검사자 정보 입력</li>
              <li>"코드 생성" 버튼 클릭</li>
              <li>생성된 코드를 검사자에게 전달</li>
            </ol>

            <h3>Excel 일괄 생성</h3>
            <ol>
              <li>"Excel 업로드" 버튼 클릭</li>
              <li>제공된 템플릿에 맞춰 검사자 정보 입력</li>
              <li>작성된 Excel 파일 업로드</li>
              <li>업로드된 정보 확인</li>
              <li>"일괄 생성" 버튼 클릭</li>
              <li>생성된 코드를 Excel로 다운로드</li>
            </ol>

            <div className="alert alert-warning">
              <i className="fas fa-exclamation-triangle"></i> 
              Excel 파일은 반드시 제공된 템플릿 형식을 따라야 합니다.
            </div>
          </div>
        )

      case 'groupTest':
        return (
          <div className="guide-content">
            <h2>그룹 검사 관리</h2>
            
            <h3>그룹 검사 설정</h3>
            <ol>
              <li>"그룹 검사" 메뉴 클릭</li>
              <li>검사 그룹명 입력</li>
              <li>검사 종류 및 규준집단 선택</li>
              <li>참가자 정보 입력 또는 Excel 업로드</li>
              <li>SMS 발송 설정 (선택사항)</li>
              <li>"그룹 생성" 버튼 클릭</li>
            </ol>

            <h3>검사 진행 상태 확인</h3>
            <ul>
              <li><span className="badge bg-warning">대기중</span>: 코드 발송 완료, 검사 시작 전</li>
              <li><span className="badge bg-info">진행중</span>: 검사자가 검사를 시작함</li>
              <li><span className="badge bg-success">완료</span>: 검사 완료</li>
            </ul>

            <h3>SMS 알림 기능</h3>
            <p>검사 코드를 SMS로 자동 발송할 수 있습니다.</p>
            <ol>
              <li>SMS 설정에서 발송 메시지 작성</li>
              <li>발송 대상자 선택</li>
              <li>"SMS 발송" 버튼 클릭</li>
            </ol>
          </div>
        )

      case 'scoring':
        return (
          <div className="guide-content">
            <h2>채점하기</h2>
            
            <h3>자동 채점</h3>
            <p>온라인으로 진행된 검사는 완료 즉시 자동으로 채점됩니다.</p>

            <h3>수동 채점</h3>
            <ol>
              <li>"채점하기" 메뉴 클릭</li>
              <li>"수동 채점" 탭 선택</li>
              <li>검사 종류 선택</li>
              <li>검사자 정보 입력</li>
              <li>각 문항별 답안 입력</li>
              <li>키보드 숫자키 1~4로 빠른 입력 가능</li>
              <li>"채점 완료" 버튼 클릭</li>
            </ol>

            <div className="alert alert-info">
              <i className="fas fa-lightbulb"></i> 
              팁: 키보드의 1, 2, 3, 4 키를 사용하면 더 빠르게 답안을 입력할 수 있습니다.
            </div>
          </div>
        )

      case 'results':
        return (
          <div className="guide-content">
            <h2>결과 조회</h2>
            
            <h3>결과 목록 확인</h3>
            <ol>
              <li>"결과 조회" 메뉴 클릭</li>
              <li>검사 종류 탭 선택 (성인용/청소년용/어린이용)</li>
              <li>필터 옵션으로 검색 범위 설정</li>
              <li>검색 결과에서 원하는 항목 확인</li>
            </ol>

            <h3>상세 결과 보기</h3>
            <ul>
              <li>목록에서 검사자 이름 클릭</li>
              <li>원점수, 백분위, T점수 확인</li>
              <li>5요인 프로필 다이어그램 확인</li>
              <li>해석 및 권장사항 확인</li>
            </ul>

            <h3>데이터 내보내기</h3>
            <ol>
              <li>내보낼 항목 선택 (체크박스)</li>
              <li>"Excel" 버튼 클릭</li>
              <li>"선택 데이터" 또는 "전체 데이터" 선택</li>
              <li>Excel 파일 다운로드</li>
            </ol>
          </div>
        )

      case 'reports':
        return (
          <div className="guide-content">
            <h2>보고서 출력</h2>
            
            <h3>개별 보고서 출력</h3>
            <ol>
              <li>결과 목록에서 출력할 검사자 선택</li>
              <li>"PDF 보기" 버튼 클릭</li>
              <li>보고서 미리보기 확인</li>
              <li>"인쇄" 또는 "PDF 다운로드" 선택</li>
            </ol>

            <h3>보고서 구성</h3>
            <ul>
              <li>검사자 기본 정보</li>
              <li>5요인 프로필 다이어그램</li>
              <li>척도별 상세 점수표</li>
              <li>종합 해석</li>
              <li>발달 권장사항</li>
            </ul>

            <h3>일괄 출력</h3>
            <p>여러 개의 보고서를 한 번에 출력하려면:</p>
            <ol>
              <li>출력할 항목들을 체크박스로 선택</li>
              <li>"출력" 버튼 클릭</li>
              <li>출력 옵션 선택</li>
            </ol>
          </div>
        )

      case 'faq':
        return (
          <div className="guide-content">
            <h2>자주 묻는 질문</h2>
            
            <div className="faq-item">
              <h4>Q: 검사 코드는 얼마나 유효한가요?</h4>
              <p>A: 검사 코드는 생성 후 30일간 유효합니다. 기간이 지나면 새로운 코드를 생성해야 합니다.</p>
            </div>

            <div className="faq-item">
              <h4>Q: 검사를 중간에 중단했는데 이어서 할 수 있나요?</h4>
              <p>A: 네, 같은 검사 코드로 다시 로그인하면 중단된 부분부터 이어서 진행할 수 있습니다.</p>
            </div>

            <div className="faq-item">
              <h4>Q: Excel 업로드 시 오류가 발생합니다.</h4>
              <p>A: 제공된 템플릿 형식을 확인하고, 필수 항목이 모두 입력되었는지 확인해주세요. 특히 전화번호 형식(010-0000-0000)을 정확히 입력해야 합니다.</p>
            </div>

            <div className="faq-item">
              <h4>Q: 보고서 PDF가 깨져서 나옵니다.</h4>
              <p>A: 최신 버전의 Chrome 또는 Edge 브라우저를 사용해주세요. Internet Explorer는 지원하지 않습니다.</p>
            </div>

            <div className="faq-item">
              <h4>Q: 검사 결과를 수정할 수 있나요?</h4>
              <p>A: 검사자 정보는 수정 가능하지만, 검사 답안과 점수는 데이터 무결성을 위해 수정할 수 없습니다.</p>
            </div>

            <div className="faq-item">
              <h4>Q: 세션이 자주 만료됩니다.</h4>
              <p>A: 보안을 위해 30분간 활동이 없으면 자동 로그아웃됩니다. 작업 중에는 주기적으로 페이지를 새로고침하거나 "세션 연장" 버튼을 클릭해주세요.</p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="user-guide-page">
      <div className="guide-header">
        <button 
          className="btn btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          <i className="fas fa-arrow-left me-2"></i>
          뒤로가기
        </button>
        <h1>IBPI 검사 시스템 사용 가이드</h1>
      </div>

      <div className="guide-container">
        <div className="guide-sidebar">
          <h3>목차</h3>
          <ul className="guide-menu">
            {Object.entries(sections).map(([key, title]) => (
              <li key={key}>
                <a
                  href="#"
                  className={activeSection === key ? 'active' : ''}
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveSection(key)
                  }}
                >
                  {title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="guide-main">
          {renderContent()}
        </div>
      </div>

      <div className="guide-footer">
        <p>추가 문의사항은 시스템 관리자에게 연락해주세요.</p>
        <p>© 2024 IBPI 검사 시스템. All rights reserved.</p>
      </div>
    </div>
  )
}

export default UserGuidePage
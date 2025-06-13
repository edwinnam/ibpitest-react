import { useEffect, useState } from 'react'
import { reportDataService } from '../../services/reportDataService'
import ProfileDiagram from './ProfileDiagram'
import ScoreTable from './ScoreTable'
import InterpretationSection from './InterpretationSection'
import './IBPIReport.css'

const IBPIReport = ({ customerId, testId, onDataLoad }) => {
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadReportData()
  }, [customerId, testId])

  const loadReportData = async () => {
    try {
      setLoading(true)
      const data = await reportDataService.getReportData(customerId, testId)
      setReportData(data)
      if (onDataLoad) {
        onDataLoad(data)
      }
    } catch (err) {
      console.error('보고서 데이터 로드 오류:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="report-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>보고서를 생성하고 있습니다...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="report-error">
        <i className="fas fa-exclamation-triangle"></i>
        <p>보고서 생성 중 오류가 발생했습니다.</p>
        <p className="error-detail">{error}</p>
      </div>
    )
  }

  if (!reportData) {
    return null
  }

  const { customerInfo, testInfo, scores, interpretation } = reportData

  return (
    <div className="ibpi-report">
      {/* 헤더 */}
      <div className="report-header">
        <div className="report-logo">
          <img src="/images/ibpi-logo.png" alt="IBPI" />
        </div>
        <h1 className="report-title">IBPI 대인관계 심리검사 결과보고서</h1>
        <div className="report-subtitle">
          Interpersonal Behavior Pattern Inventory
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="report-section basic-info">
        <h2 className="section-title">검사자 정보</h2>
        <table className="info-table">
          <tbody>
            <tr>
              <td className="label">이름</td>
              <td className="value">{customerInfo.name}</td>
              <td className="label">성별</td>
              <td className="value">{customerInfo.gender === 'male' ? '남' : '여'}</td>
            </tr>
            <tr>
              <td className="label">연령</td>
              <td className="value">{customerInfo.age}세</td>
              <td className="label">검사일</td>
              <td className="value">
                {new Date(testInfo.testDate).toLocaleDateString('ko-KR')}
              </td>
            </tr>
            <tr>
              <td className="label">소속기관</td>
              <td className="value" colSpan="3">
                {customerInfo.institution1}
                {customerInfo.institution2 && ` - ${customerInfo.institution2}`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 프로필 다이어그램 */}
      <div className="report-section profile-section">
        <h2 className="section-title">대인관계 프로필</h2>
        <div className="profile-container">
          <ProfileDiagram 
            scores={scores.mainScales}
            size={400}
          />
          <div className="profile-legend">
            <h3>척도 설명</h3>
            <ul>
              <li><strong>협조성(CO)</strong>: 타인과의 협력적 태도</li>
              <li><strong>근접성(CL)</strong>: 친밀한 관계 형성 능력</li>
              <li><strong>순종성(OB)</strong>: 규칙과 권위에 대한 순응</li>
              <li><strong>지도성(GU)</strong>: 리더십과 주도적 성향</li>
              <li><strong>자기신뢰(SD)</strong>: 독립성과 자기확신</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 점수 표 */}
      <div className="report-section scores-section">
        <h2 className="section-title">검사 결과 상세</h2>
        <ScoreTable 
          mainScales={scores.mainScales}
          subScales={scores.subScales}
          showSubScales={true}
        />
      </div>

      {/* 해석 섹션 */}
      <div className="report-section interpretation-section">
        <h2 className="section-title">종합 해석</h2>
        <InterpretationSection 
          interpretation={interpretation}
          scores={scores}
        />
      </div>

      {/* 권장사항 */}
      <div className="report-section recommendations-section">
        <h2 className="section-title">발달 권장사항</h2>
        <div className="recommendations-content">
          {interpretation?.recommendations?.map((rec, index) => (
            <div key={index} className="recommendation-item">
              <i className="fas fa-check-circle"></i>
              <p>{rec}</p>
            </div>
          )) || (
            <p>개인의 대인관계 특성을 고려한 맞춤형 권장사항은 전문가 상담을 통해 제공받으실 수 있습니다.</p>
          )}
        </div>
      </div>

      {/* 푸터 */}
      <div className="report-footer">
        <div className="footer-content">
          <p className="disclaimer">
            본 검사 결과는 개인의 대인관계 성향을 이해하는 데 도움을 주기 위한 것으로,
            전문적인 진단이나 치료를 대체할 수 없습니다.
          </p>
          <div className="footer-info">
            <p>발행일: {new Date().toLocaleDateString('ko-KR')}</p>
            <p>© 2025 IBPI. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IBPIReport
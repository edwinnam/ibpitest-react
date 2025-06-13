import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import IBPIReport from '../../components/reports/IBPIReport'
import { mockReportData } from '../../test/mocks/reportData'
import './ReportViewPage.css'

const ReportDemo = () => {
  const navigate = useNavigate()
  const [selectedDataSet, setSelectedDataSet] = useState('complete')
  const [printing, setPrinting] = useState(false)

  // 다양한 테스트 시나리오
  const dataScenarios = {
    complete: {
      name: '완전한 데이터',
      data: mockReportData.completeReportData
    },
    highScores: {
      name: '높은 점수',
      data: {
        ...mockReportData.completeReportData,
        scores: {
          mainScales: Object.fromEntries(
            Object.entries(mockReportData.completeReportData.scores.mainScales).map(([key, value]) => [
              key,
              { ...value, percentile: 85 + Math.random() * 10, tScore: 65 + Math.random() * 5 }
            ])
          ),
          subScales: mockReportData.completeReportData.scores.subScales
        }
      }
    },
    lowScores: {
      name: '낮은 점수',
      data: {
        ...mockReportData.completeReportData,
        scores: {
          mainScales: Object.fromEntries(
            Object.entries(mockReportData.completeReportData.scores.mainScales).map(([key, value]) => [
              key,
              { ...value, percentile: 10 + Math.random() * 10, tScore: 30 + Math.random() * 5 }
            ])
          ),
          subScales: mockReportData.completeReportData.scores.subScales
        }
      }
    },
    mixedScores: {
      name: '혼합 점수',
      data: {
        ...mockReportData.completeReportData,
        scores: {
          mainScales: {
            dom: { ...mockReportData.completeReportData.scores.mainScales.dom, percentile: 90, tScore: 68 },
            soc: { ...mockReportData.completeReportData.scores.mainScales.soc, percentile: 20, tScore: 35 },
            nurt: { ...mockReportData.completeReportData.scores.mainScales.nurt, percentile: 50, tScore: 50 },
            intrus: { ...mockReportData.completeReportData.scores.mainScales.intrus, percentile: 75, tScore: 58 },
            vindic: { ...mockReportData.completeReportData.scores.mainScales.vindic, percentile: 15, tScore: 33 }
          },
          subScales: mockReportData.completeReportData.scores.subScales
        }
      }
    }
  }

  const handlePrint = () => {
    setPrinting(true)
    setTimeout(() => {
      window.print()
      setPrinting(false)
    }, 100)
  }

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(dataScenarios[selectedDataSet].data, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `report-data-${selectedDataSet}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className={`report-view-page ${printing ? 'printing' : ''}`}>
      {/* 툴바 */}
      <div className="report-toolbar no-print">
        <div className="toolbar-left">
          <button 
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            <i className="fas fa-arrow-left me-2"></i>
            뒤로가기
          </button>
          <select 
            className="form-select"
            value={selectedDataSet}
            onChange={(e) => setSelectedDataSet(e.target.value)}
            style={{ width: 'auto' }}
          >
            {Object.entries(dataScenarios).map(([key, scenario]) => (
              <option key={key} value={key}>{scenario.name}</option>
            ))}
          </select>
        </div>
        <div className="toolbar-right">
          <button 
            className="btn btn-primary"
            onClick={handlePrint}
          >
            <i className="fas fa-print me-2"></i>
            인쇄
          </button>
          <button 
            className="btn btn-info"
            onClick={handleExportJSON}
          >
            <i className="fas fa-download me-2"></i>
            JSON 내보내기
          </button>
        </div>
      </div>

      {/* 데모 알림 */}
      <div className="alert alert-info mx-4 mt-3 no-print">
        <i className="fas fa-info-circle me-2"></i>
        <strong>데모 모드:</strong> 이것은 모의 데이터를 사용한 보고서 미리보기입니다. 
        실제 데이터는 검사 완료 후 생성됩니다.
      </div>

      {/* 보고서 컨테이너 */}
      <div className="report-container">
        <IBPIReport reportData={dataScenarios[selectedDataSet].data} />
      </div>

      {/* 디버그 정보 (개발 환경에서만) */}
      {import.meta.env.DEV && (
        <div className="debug-info no-print p-4">
          <h5>디버그 정보</h5>
          <details>
            <summary>현재 데이터셋 보기</summary>
            <pre className="bg-light p-3 mt-2" style={{ maxHeight: '400px', overflow: 'auto' }}>
              {JSON.stringify(dataScenarios[selectedDataSet].data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}

export default ReportDemo
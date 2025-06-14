import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../modules/auth/AuthContext'
import IBPIReport from '../../components/reports/IBPIReport'
import './ReportViewPage.css'

const ReportViewPage = () => {
  const { customerId, testId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const reportRef = useRef(null)
  const [reportData, setReportData] = useState(null)
  const [printing, setPrinting] = useState(false)

  const handleDataLoad = (data) => {
    setReportData(data)
  }

  const handlePrint = () => {
    setPrinting(true)
    setTimeout(() => {
      window.print()
      setPrinting(false)
    }, 100)
  }

  const handleDownloadPDF = async () => {
    try {
      // 개발 환경에서는 window.print() 사용
      if (import.meta.env.DEV) {
        console.log('개발 환경: 브라우저 인쇄 기능을 사용합니다.')
        window.print()
        return
      }

      // Supabase Edge Function 호출
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          customerId,
          testId,
          reportData
        })
      })

      if (!response.ok) {
        throw new Error('PDF 생성 실패')
      }

      // PDF 다운로드
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `IBPI_Report_${reportData?.customerInfo?.name}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('PDF 다운로드 오류:', error)
      alert('PDF 다운로드 중 오류가 발생했습니다. 인쇄 기능을 사용해주세요.')
    }
  }

  const handleShare = () => {
    // 공유 링크 생성
    const shareUrl = `${window.location.origin}/reports/public/${customerId}/${testId}`
    navigator.clipboard.writeText(shareUrl)
    alert('보고서 링크가 클립보드에 복사되었습니다.')
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
            className="btn btn-success"
            onClick={handleDownloadPDF}
            disabled={!reportData}
          >
            <i className="fas fa-file-pdf me-2"></i>
            PDF 다운로드
          </button>
          <button 
            className="btn btn-info"
            onClick={handleShare}
          >
            <i className="fas fa-share-alt me-2"></i>
            공유
          </button>
        </div>
      </div>

      {/* 보고서 */}
      <div className="report-container" ref={reportRef}>
        <IBPIReport 
          customerId={customerId}
          testId={testId}
          onDataLoad={handleDataLoad}
        />
      </div>
    </div>
  )
}

export default ReportViewPage
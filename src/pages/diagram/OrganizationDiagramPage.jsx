import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import OrganizationDiagram from '../../components/diagrams/OrganizationDiagram'
import { reportDataService } from '../../services/reportDataService'
import { Button } from '../../shared/components'
import './OrganizationDiagramPage.css'

const OrganizationDiagramPage = () => {
  const { customerId, testId } = useParams()
  const navigate = useNavigate()
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedTest, setSelectedTest] = useState(null)

  // 고객 목록 조회
  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers-for-diagram'],
    queryFn: async () => {
      const { customers } = await reportDataService.getCustomersWithResults()
      return customers
    }
  })

  // 선택된 고객의 검사 결과 조회
  const { data: reportData, isLoading: loadingReport } = useQuery({
    queryKey: ['diagram-data', selectedCustomer?.id, selectedTest?.id],
    queryFn: () => reportDataService.getReportData(selectedCustomer.id, selectedTest.id),
    enabled: !!selectedCustomer?.id && !!selectedTest?.id
  })

  // URL 파라미터가 있으면 자동으로 로드
  useEffect(() => {
    if (customerId && testId) {
      // URL로 직접 접근한 경우
      loadDirectReport()
    }
  }, [customerId, testId])

  const loadDirectReport = async () => {
    try {
      const data = await reportDataService.getReportData(customerId, testId)
      if (data) {
        setSelectedCustomer({ id: customerId })
        setSelectedTest({ id: testId })
      }
    } catch (error) {
      console.error('Failed to load report:', error)
    }
  }

  const handleCustomerSelect = (e) => {
    const customer = customers.find(c => c.customer_number === e.target.value)
    setSelectedCustomer(customer)
    setSelectedTest(null) // 고객 변경 시 검사 선택 초기화
  }

  const handleTestSelect = (e) => {
    const testId = e.target.value
    setSelectedTest({ id: testId })
  }

  const transformScores = (scores) => {
    if (!scores) return null

    return {
      co: { originalScore: scores.co_original || 0 },
      cl: { originalScore: scores.cl_original || 0 },
      ob: { originalScore: scores.ob_original || 0 },
      gu: { originalScore: scores.gu_original || 0 },
      sd: { originalScore: scores.sd_original || 0 }
    }
  }

  const getGroupAverages = () => {
    if (!reportData?.groupData) return null

    const { averages } = reportData.groupData
    if (!averages) return null

    return {
      co: { mean: averages.co || 0 },
      cl: { mean: averages.cl || 0 },
      ob: { mean: averages.ob || 0 },
      gu: { mean: averages.gu || 0 },
      sd: { mean: averages.sd || 0 }
    }
  }

  return (
    <div className="organization-diagram-page">
      <div className="page-header">
        <h1>
          <i className="fas fa-sitemap me-2"></i>
          조직도 시각화
        </h1>
      </div>

      <div className="diagram-container">
        {/* 선택 영역 */}
        {!customerId && !testId && (
          <div className="selection-panel">
            <h3>검사 결과 선택</h3>
            
            <div className="form-group">
              <label>고객 선택</label>
              <select 
                className="form-control"
                value={selectedCustomer?.customer_number || ''}
                onChange={handleCustomerSelect}
                disabled={loadingCustomers}
              >
                <option value="">고객을 선택하세요</option>
                {customers.map(customer => (
                  <option key={customer.customer_number} value={customer.customer_number}>
                    {customer.name} ({customer.customer_number}) - {customer.test_type}
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomer && (
              <div className="form-group">
                <label>검사 선택</label>
                <select 
                  className="form-control"
                  value={selectedTest?.id || ''}
                  onChange={handleTestSelect}
                >
                  <option value="">검사를 선택하세요</option>
                  <option value="latest">최신 검사 결과</option>
                </select>
              </div>
            )}

            {selectedCustomer && selectedTest && (
              <Button 
                onClick={() => navigate(`/diagram/${selectedCustomer.id}/${selectedTest.id}`)}
                className="mt-3"
              >
                조직도 보기
              </Button>
            )}
          </div>
        )}

        {/* 다이어그램 표시 */}
        {reportData && (
          <div className="diagram-content">
            <div className="customer-info-bar">
              <div className="info-item">
                <span className="label">이름:</span>
                <span className="value">{reportData.customerInfo.name}</span>
              </div>
              <div className="info-item">
                <span className="label">검사일:</span>
                <span className="value">
                  {new Date(reportData.customerInfo.test_date).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <div className="info-item">
                <span className="label">검사유형:</span>
                <span className="value">{reportData.customerInfo.test_type}</span>
              </div>
            </div>

            <OrganizationDiagram 
              scores={transformScores(reportData.scores)}
              groupAverages={getGroupAverages()}
              size={743}
            />

            <div className="action-buttons">
              <Button 
                variant="secondary"
                onClick={() => navigate('/test-results')}
              >
                <i className="fas fa-arrow-left me-2"></i>
                목록으로
              </Button>
              <Button onClick={() => window.print()}>
                <i className="fas fa-print me-2"></i>
                인쇄
              </Button>
              <Button 
                variant="primary"
                onClick={() => navigate(`/reports/${selectedCustomer.id}/${selectedTest.id}`)}
              >
                <i className="fas fa-file-alt me-2"></i>
                전체 보고서 보기
              </Button>
            </div>
          </div>
        )}

        {/* 로딩 상태 */}
        {(loadingCustomers || loadingReport) && (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>데이터를 불러오는 중입니다...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrganizationDiagramPage
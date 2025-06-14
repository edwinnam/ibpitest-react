import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../modules/auth/AuthContext'
import { useSupabaseQuery } from '../../core/hooks/useSupabaseQuery'
import { supabase } from '../../core/services/supabase'
import CustomerEditModal from '../../components/modals/CustomerEditModal'
import * as XLSX from 'xlsx'
import './TestResultsPage.css'

const TestResultsPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedResult, setSelectedResult] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [selectedResults, setSelectedResults] = useState([])
  const [filters, setFilters] = useState({
    testType: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  })
  
  const orgNumber = user?.user_metadata?.org_number || sessionStorage.getItem('orgNumber')

  // 검사 결과 목록 조회
  const { data: testResults = [], isLoading, refetch } = useSupabaseQuery(
    ['testResults', orgNumber, filters],
    async () => {
      let query = supabase
        .from('test_results')
        .select(`
          *,
          customers_info!inner(
            id,
            name,
            gender,
            birth_date,
            organization1,
            organization2,
            personal_id,
            test_type,
            test_date
          )
        `)
        .eq('org_number', orgNumber)
        .order('created_at', { ascending: false })

      // 필터 적용
      if (filters.testType) {
        query = query.eq('customers_info.test_type', filters.testType)
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo + 'T23:59:59')
      }
      if (filters.searchTerm) {
        query = query.or(`customers_info.name.ilike.%${filters.searchTerm}%,customer_number.ilike.%${filters.searchTerm}%`)
      }

      const { data, error } = await query
      
      if (error) throw error
      return data || []
    },
    { enabled: !!orgNumber }
  )

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleSearch = () => {
    refetch()
  }

  const handleReset = () => {
    setFilters({
      testType: '',
      dateFrom: '',
      dateTo: '',
      searchTerm: ''
    })
  }

  const handleViewDetail = (result) => {
    setSelectedResult(result)
    setShowDetailModal(true)
  }

  const handleViewReport = (result) => {
    // 보고서 페이지로 이동
    navigate(`/reports/${result.customer_id}/${result.id}`)
  }

  const handlePrintResult = (result) => {
    // 보고서 페이지에서 인쇄
    navigate(`/reports/${result.customer_id}/${result.id}`)
  }

  const handleDownloadExcel = (downloadAll = false) => {
    try {
      // 다운로드할 데이터 결정
      const dataToExport = downloadAll ? testResults : 
        testResults.filter(r => selectedResults.includes(r.id))

      if (dataToExport.length === 0) {
        alert('다운로드할 데이터가 없습니다.')
        return
      }

      // 엑셀 데이터 준비
      const excelData = dataToExport.map((result, index) => ({
        '번호': index + 1,
        '이름': result.customers_info.name,
        '성별': result.customers_info.gender,
        '나이': calculateAge(result.customers_info.birth_date),
        '생년월일': formatDate(result.customers_info.birth_date),
        '검사일': formatDate(result.customers_info.test_date),
        '검사종류': result.customers_info.test_type,
        '소속기관 1': result.customers_info.organization1 || '',
        '소속기관 2': result.customers_info.organization2 || '',
        '개인고유번호': result.customers_info.personal_id || '',
        '총점': result.total_score || 0,
        'CL 점수': result.cl_score || 0,
        'CO 점수': result.co_score || 0,
        'OB 점수': result.ob_score || 0,
        'GU 점수': result.gu_score || 0,
        'SD 점수': result.sd_score || 0,
        '타당도': result.validity_score || 0
      }))

      // 워크시트 생성
      const ws = XLSX.utils.json_to_sheet(excelData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '검사결과')

      // 파일 다운로드
      const fileName = `IBPI_검사결과_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)

      alert(`${dataToExport.length}건의 데이터가 다운로드되었습니다.`)
    } catch (error) {
      console.error('엑셀 다운로드 오류:', error)
      alert('엑셀 다운로드 중 오류가 발생했습니다.')
    }
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedResults(testResults.map(r => r.id))
    } else {
      setSelectedResults([])
    }
  }

  const handleSelectResult = (resultId) => {
    setSelectedResults(prev => {
      if (prev.includes(resultId)) {
        return prev.filter(id => id !== resultId)
      } else {
        return [...prev, resultId]
      }
    })
  }

  const handleEditCustomer = (customerInfo) => {
    setEditingCustomer(customerInfo)
    setShowEditModal(true)
  }

  const handleUpdateCustomer = () => {
    // 데이터 새로고침
    refetch()
  }

  const handleDeleteSelected = async () => {
    if (selectedResults.length === 0) {
      alert('삭제할 항목을 선택하세요.')
      return
    }

    if (!confirm(`선택한 ${selectedResults.length}건의 결과를 삭제하시겠습니까?`)) {
      return
    }

    try {
      // test_results 테이블에서 삭제
      const { error } = await supabase
        .from('test_results')
        .delete()
        .in('id', selectedResults)

      if (error) throw error

      alert('선택한 항목이 삭제되었습니다.')
      setSelectedResults([])
      refetch()
    } catch (error) {
      console.error('삭제 오류:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleAnalysisStatusChange = async (status) => {
    if (selectedResults.length === 0) {
      alert('변경할 항목을 선택하세요.')
      return
    }

    try {
      const { error } = await supabase
        .from('test_results')
        .update({ is_analyzed: status })
        .in('id', selectedResults)

      if (error) throw error

      alert(`선택한 항목이 ${status ? '분석완료' : '분석미완료'}로 변경되었습니다.`)
      setSelectedResults([])
      refetch()
    } catch (error) {
      console.error('상태 변경 오류:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const getScoreLevel = (score) => {
    if (score >= 80) return { text: '매우 양호', color: 'success' }
    if (score >= 60) return { text: '양호', color: 'primary' }
    if (score >= 40) return { text: '보통', color: 'warning' }
    return { text: '주의 필요', color: 'danger' }
  }

  const calculateAge = (birthDate) => {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  if (isLoading) {
    return (
      <div className="results-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>검사 결과 로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="test-results-page">
      <div className="page-header">
        <h1>검사 결과 조회</h1>
        <p className="page-subtitle">채점이 완료된 검사 결과를 조회하고 관리합니다</p>
      </div>

      {/* 검사 종류 탭 */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <a 
            className={`nav-link ${filters.testType === '' || filters.testType === 'IBPI 성인용' ? 'active' : ''}`}
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handleFilterChange('testType', 'IBPI 성인용')
            }}
          >
            IBPI 성인용
          </a>
        </li>
        <li className="nav-item">
          <a 
            className={`nav-link ${filters.testType === 'IBPI 청소년용' ? 'active' : ''}`}
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handleFilterChange('testType', 'IBPI 청소년용')
            }}
          >
            IBPI 청소년용
          </a>
        </li>
        <li className="nav-item">
          <a 
            className={`nav-link ${filters.testType === 'IBPI 어린이용' ? 'active' : ''}`}
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handleFilterChange('testType', 'IBPI 어린이용')
            }}
          >
            IBPI 어린이용
          </a>
        </li>
      </ul>

      {/* 분석 상태 탭 */}
      <div className="analysis-tabs mb-3">
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <a className="nav-link active" href="#">
              분석전 (<span>{testResults.filter(r => !r.is_analyzed).length}</span>)
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">
              분석완료 (<span>{testResults.filter(r => r.is_analyzed).length}</span>)
            </a>
          </li>
        </ul>
      </div>

      {/* 필터 섹션 */}
      <div className="filter-section mb-4">
        <div className="row g-3">
          <div className="col-md-3">
            <select
              className="form-select"
              value={filters.testType}
              onChange={(e) => handleFilterChange('testType', e.target.value)}
            >
              <option value="">전체 검사종류</option>
              <option value="성인용">성인용</option>
              <option value="청소년용">청소년용</option>
              <option value="아동용">아동용</option>
            </select>
          </div>
          <div className="col-md-2">
            <input
              type="date"
              className="form-control"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              placeholder="시작일"
            />
          </div>
          <div className="col-md-2">
            <input
              type="date"
              className="form-control"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              placeholder="종료일"
            />
          </div>
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              placeholder="이름 또는 검사코드 검색"
            />
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary w-100" onClick={handleSearch}>
              <i className="fas fa-search me-2"></i>검색
            </button>
          </div>
        </div>
        <div className="row g-3 mt-2">
          <div className="col-md-10"></div>
          <div className="col-md-2">
            <button className="btn btn-secondary w-100" onClick={handleReset}>
              <i className="fas fa-redo me-2"></i>초기화
            </button>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="action-buttons mb-3">
        <button 
          className="btn btn-light me-2" 
          disabled={selectedResults.length === 0}
          onClick={handleDeleteSelected}
        >
          삭제
        </button>
        <button 
          className="btn btn-light me-2" 
          disabled={selectedResults.length === 0}
          onClick={() => alert('출력 기능은 준비 중입니다.')}
        >
          출력
        </button>
        <button 
          className="btn btn-light me-2" 
          disabled={selectedResults.length === 0}
          onClick={() => alert('저장 기능은 준비 중입니다.')}
        >
          저장
        </button>
        <div className="dropdown d-inline-block me-2">
          <button 
            className="btn btn-light dropdown-toggle" 
            type="button"
            data-bs-toggle="dropdown"
            disabled={selectedResults.length === 0}
          >
            해석보고서
          </button>
          <ul className="dropdown-menu">
            <li>
              <a className="dropdown-item" href="#" onClick={(e) => {
                e.preventDefault()
                handleAnalysisStatusChange(true)
              }}>
                분석 완료로 표시
              </a>
            </li>
            <li>
              <a className="dropdown-item" href="#" onClick={(e) => {
                e.preventDefault()
                handleAnalysisStatusChange(false)
              }}>
                분석 미완료로 표시
              </a>
            </li>
          </ul>
        </div>
        <div className="dropdown d-inline-block">
          <button 
            className="btn btn-light dropdown-toggle" 
            type="button"
            data-bs-toggle="dropdown"
            disabled={selectedResults.length === 0}
          >
            Excel
          </button>
          <ul className="dropdown-menu">
            <li>
              <a className="dropdown-item" href="#" onClick={(e) => {
                e.preventDefault()
                handleDownloadExcel(false)
              }}>
                선택 데이터 다운로드
              </a>
            </li>
            <li>
              <a className="dropdown-item" href="#" onClick={(e) => {
                e.preventDefault()
                handleDownloadExcel(true)
              }}>
                전체 데이터 다운로드
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* 결과 통계 */}
      <div className="results-stats mb-4">
        <div className="row g-3">
          <div className="col-md-3">
            <div className="stat-card bg-primary text-white">
              <h5>전체 결과</h5>
              <h2>{testResults.length}</h2>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card bg-success text-white">
              <h5>이번 달</h5>
              <h2>
                {testResults.filter(r => 
                  new Date(r.scored_at).getMonth() === new Date().getMonth()
                ).length}
              </h2>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card bg-info text-white">
              <h5>이번 주</h5>
              <h2>
                {testResults.filter(r => {
                  const weekAgo = new Date()
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  return new Date(r.scored_at) >= weekAgo
                }).length}
              </h2>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-card bg-warning text-white">
              <h5>오늘</h5>
              <h2>
                {testResults.filter(r => 
                  new Date(r.scored_at).toDateString() === new Date().toDateString()
                ).length}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* 결과 목록 */}
      <div className="results-content">
        {testResults.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-chart-bar fa-3x text-muted mb-3"></i>
            <h4>검사 결과가 없습니다</h4>
            <p className="text-muted">채점이 완료된 검사 결과가 여기에 표시됩니다.</p>
          </div>
        ) : (
          <>
            <div className="action-bar mb-3">
              <button className="btn btn-success" onClick={handleDownloadExcel}>
                <i className="fas fa-file-excel me-2"></i>
                엑셀 다운로드
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>
                      <input 
                        type="checkbox" 
                        checked={testResults.length > 0 && testResults.every(r => selectedResults.includes(r.id))}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>번호</th>
                    <th>이름</th>
                    <th>성별</th>
                    <th>나이</th>
                    <th>생년월일</th>
                    <th>검사일</th>
                    <th>검사기관</th>
                    <th>소속기관 1</th>
                    <th>소속기관 2</th>
                    <th>개인고유번호</th>
                    <th>PDF 출력</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.map((result, index) => {
                    return (
                      <tr 
                        key={result.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleEditCustomer(result.customers_info)}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={selectedResults.includes(result.id)}
                            onChange={() => handleSelectResult(result.id)}
                          />
                        </td>
                        <td>{index + 1}</td>
                        <td>{result.customers_info.name}</td>
                        <td>{result.customers_info.gender === '남' ? '남' : '여'}</td>
                        <td>{calculateAge(result.customers_info.birth_date)}</td>
                        <td>{formatDate(result.customers_info.birth_date)}</td>
                        <td>{formatDate(result.customers_info.test_date)}</td>
                        <td>{result.customers_info.test_type}</td>
                        <td>{result.customers_info.organization1 || '-'}</td>
                        <td>{result.customers_info.organization2 || '-'}</td>
                        <td>{result.customers_info.personal_id || '-'}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleViewReport(result)}
                            title="PDF 보기"
                          >
                            <i className="fas fa-file-pdf"></i>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* 상세보기 모달 */}
      {showDetailModal && selectedResult && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">검사 결과 상세</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDetailModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="result-detail">
                  <h6>기본 정보</h6>
                  <table className="table table-bordered">
                    <tbody>
                      <tr>
                        <th width="30%">이름</th>
                        <td>{selectedResult.customers_info.name}</td>
                        <th width="30%">검사일</th>
                        <td>{formatDate(selectedResult.customers_info.test_date)}</td>
                      </tr>
                      <tr>
                        <th>성별/나이</th>
                        <td>
                          {selectedResult.customers_info.gender === '남' ? '남' : '여'} / 
                          {calculateAge(selectedResult.customers_info.birth_date)}세
                        </td>
                        <th>검사종류</th>
                        <td>{selectedResult.test_type}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h6 className="mt-4">검사 결과</h6>
                  <table className="table table-bordered">
                    <tbody>
                      <tr>
                        <th width="30%">총점</th>
                        <td colSpan="3" className="fw-bold text-primary">
                          {selectedResult.total_score || 0}점
                        </td>
                      </tr>
                      <tr>
                        <th>CL (근접성)</th>
                        <td>{selectedResult.cl_score || 0}점</td>
                        <th>CO (협조성)</th>
                        <td>{selectedResult.co_score || 0}점</td>
                      </tr>
                      <tr>
                        <th>OB (순종성)</th>
                        <td>{selectedResult.ob_score || 0}점</td>
                        <th>GU (지도성)</th>
                        <td>{selectedResult.gu_score || 0}점</td>
                      </tr>
                      <tr>
                        <th>SD (자기신뢰)</th>
                        <td>{selectedResult.sd_score || 0}점</td>
                        <th>타당도</th>
                        <td>{selectedResult.validity_score || 0}점</td>
                      </tr>
                    </tbody>
                  </table>

                  {selectedResult.interpretation && (
                    <>
                      <h6 className="mt-4">해석</h6>
                      <div className="alert alert-info">
                        <p className="mb-1"><strong>{selectedResult.interpretation.overall}</strong></p>
                        <p className="mb-0">{selectedResult.interpretation.details}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-info"
                  onClick={() => {
                    navigate(`/diagram/${selectedResult.customer_id}/${selectedResult.id}`)
                    setShowDetailModal(false)
                  }}
                >
                  <i className="fas fa-sitemap me-2"></i>조직도
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => handlePrintResult(selectedResult)}
                >
                  <i className="fas fa-print me-2"></i>인쇄
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDetailModal(false)}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 고객 정보 수정 모달 */}
      <CustomerEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingCustomer(null)
        }}
        customerData={editingCustomer}
        onUpdate={handleUpdateCustomer}
      />

      <div className="page-footer mt-5">
        <a href="/test-scoring" className="btn btn-outline-primary">
          채점하기
        </a>
        <a href="/dashboard" className="btn btn-outline-secondary">
          대시보드로 이동
        </a>
      </div>
    </div>
  )
}

export default TestResultsPage
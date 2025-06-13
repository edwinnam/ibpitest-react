import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../modules/auth/AuthContext'
import { useSupabaseQuery } from '../../core/hooks/useSupabaseQuery'
import { supabase } from '../../core/services/supabase'
import './TestResultsPage.css'

const TestResultsPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedResult, setSelectedResult] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
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
          customer_info!inner(
            name,
            gender,
            birth_date,
            institution1,
            institution2,
            test_codes!inner(test_code, test_type)
          )
        `)
        .eq('org_number', orgNumber)
        .order('scored_at', { ascending: false })

      // 필터 적용
      if (filters.testType) {
        query = query.eq('customer_info.test_codes.test_type', filters.testType)
      }
      if (filters.dateFrom) {
        query = query.gte('scored_at', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('scored_at', filters.dateTo + 'T23:59:59')
      }
      if (filters.searchTerm) {
        query = query.or(`customer_info.name.ilike.%${filters.searchTerm}%,customer_info.test_codes.test_code.ilike.%${filters.searchTerm}%`)
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

  const handleDownloadExcel = () => {
    // 엑셀 다운로드 로직
    alert('엑셀 다운로드 기능은 준비 중입니다.')
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
                    <th>채점일</th>
                    <th>검사종류</th>
                    <th>이름</th>
                    <th>성별/나이</th>
                    <th>검사코드</th>
                    <th>소속기관</th>
                    <th>총점</th>
                    <th>수준</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.map(result => {
                    const scoreLevel = getScoreLevel(result.scores?.total || 0)
                    return (
                      <tr key={result.id}>
                        <td>{formatDate(result.scored_at)}</td>
                        <td>
                          <span className="badge bg-primary">
                            {result.customer_info.test_codes.test_type}
                          </span>
                        </td>
                        <td>{result.customer_info.name}</td>
                        <td>
                          {result.customer_info.gender === 'male' ? '남' : '여'} / 
                          {calculateAge(result.customer_info.birth_date)}세
                        </td>
                        <td className="text-monospace">
                          {result.customer_info.test_codes.test_code}
                        </td>
                        <td>{result.customer_info.institution1}</td>
                        <td className="fw-bold">{result.scores?.total || 0}</td>
                        <td>
                          <span className={`badge bg-${scoreLevel.color}`}>
                            {scoreLevel.text}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => handleViewDetail(result)}
                              title="상세보기"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="btn btn-outline-info"
                              onClick={() => handleViewReport(result)}
                              title="보고서"
                            >
                              <i className="fas fa-file-alt"></i>
                            </button>
                            <button
                              className="btn btn-outline-success"
                              onClick={() => handlePrintResult(result)}
                              title="인쇄"
                            >
                              <i className="fas fa-print"></i>
                            </button>
                          </div>
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
                        <td>{selectedResult.customer_info.name}</td>
                        <th width="30%">검사일</th>
                        <td>{formatDate(selectedResult.scored_at)}</td>
                      </tr>
                      <tr>
                        <th>성별/나이</th>
                        <td>
                          {selectedResult.customer_info.gender === 'male' ? '남' : '여'} / 
                          {calculateAge(selectedResult.customer_info.birth_date)}세
                        </td>
                        <th>검사종류</th>
                        <td>{selectedResult.customer_info.test_codes.test_type}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h6 className="mt-4">검사 결과</h6>
                  <table className="table table-bordered">
                    <tbody>
                      <tr>
                        <th width="30%">총점</th>
                        <td colSpan="3" className="fw-bold text-primary">
                          {selectedResult.scores?.total || 0}점
                        </td>
                      </tr>
                      {selectedResult.scores?.subscales && Object.entries(selectedResult.scores.subscales).map(([key, value]) => (
                        <tr key={key}>
                          <th>{key}</th>
                          <td>{value}점</td>
                        </tr>
                      ))}
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
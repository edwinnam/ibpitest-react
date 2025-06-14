import { useState } from 'react'
import { useAuth } from '../../../modules/auth/AuthContext'
import { useOrganization } from '../../../modules/organization/OrganizationContext'
import { useSupabaseQuery, useSupabaseMutation } from '../../../core/hooks/useSupabaseQuery'
import { testCodeService } from '../../../core/services/testCodeService'
import { smsService } from '../../../core/services/smsService'
import './GroupCodeCompleteTab.css'

// 규준집단 레이블 매핑
const getStandardGroupLabel = (standardGroup) => {
  const groupMap = {
    'adult_general': '성인 일반',
    'adult_20s': '성인 20대',
    'adult_30s': '성인 30대',
    'adult_40plus': '성인 40대이후',
    'youth': '청소년',
    'child': '어린이',
    'child_3to5': '어린이 3~5세',
    'child_6to8': '어린이 6~8세',
    'child_9to12': '어린이 9~12세'
  }
  return groupMap[standardGroup] || standardGroup || '-'
}

const GroupCodeCompleteTab = ({ onRefresh }) => {
  const { user } = useAuth()
  const { getOrgNumber } = useOrganization()
  const [selectedItems, setSelectedItems] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  
  // 필터 상태
  const [filters, setFilters] = useState({
    testType: '',
    status: '',
    name: '',
    keyword: ''
  })
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [messageBox, setMessageBox] = useState('')
  
  const orgNumber = getOrgNumber()

  // 필터 객체 생성
  const filterParams = {
    testType: filters.testType,
    status: filters.status,
    name: filters.name
  }

  // 발송 완료된 코드 목록 조회
  const { 
    data: completedList = [], 
    isLoading, 
    refetch,
    isFetching 
  } = useSupabaseQuery(
    ['groupCompletedCodes', orgNumber, filterParams],
    () => testCodeService.getCompletedCodes(orgNumber, filterParams),
    { enabled: !!orgNumber }
  )

  // SMS 재발송 뮤테이션
  const resendSMSMutation = useSupabaseMutation(
    async (codeIds) => {
      const selectedCodes = completedList.filter(item => codeIds.includes(item.id))
      
      const recipients = selectedCodes.map(code => ({
        name: code.name,
        phone: code.phone,
        testCode: code.test_code,
        testType: code.test_type,
        institution1: code.institution1
      }))
      
      const smsResult = await smsService.resendSMS(recipients)
      
      if (!smsResult.success) {
        throw new Error('SMS 재발송 중 일부 오류가 발생했습니다.')
      }
      
      // 재발송 상태 업데이트
      await testCodeService.updateSendStatus(codeIds, '재발송')
      
      return smsResult
    },
    {
      onSuccess: (data) => {
        setMessageBox(`${data.summary.success}개의 검사코드가 재발송되었습니다.`)
        setTimeout(() => setMessageBox(''), 3000)
        setSelectedItems([])
        setSelectAll(false)
        refetch()
      },
      onError: (error) => {
        alert(`SMS 재발송 오류: ${error.message}`)
      }
    }
  )

  // 코드 반환 뮤테이션
  const returnCodesMutation = useSupabaseMutation(
    async (codeIds) => {
      const returnedCount = await testCodeService.returnCodes(codeIds)
      return returnedCount
    },
    {
      onSuccess: (count) => {
        setMessageBox(`${count}개의 검사코드가 반환되었습니다.`)
        setTimeout(() => setMessageBox(''), 3000)
        setSelectedItems([])
        setSelectAll(false)
        refetch()
        if (onRefresh) onRefresh()
      },
      onError: (error) => {
        alert(`코드 반환 오류: ${error.message}`)
      }
    }
  )

  // 필터링된 데이터
  const filteredData = completedList.filter(item => {
    // 키워드 검색
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      const searchFields = [
        item.name,
        item.test_code,
        item.phone,
        item.email,
        item.institution1,
        item.institution2
      ].filter(Boolean).join(' ').toLowerCase()
      
      if (!searchFields.includes(keyword)) {
        return false
      }
    }
    
    return true
  })

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = filteredData.slice(startIndex, endIndex)

  const handleSelectAll = (checked) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedItems(currentData.map(item => item.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (itemId, checked) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId])
    } else {
      setSelectedItems(selectedItems.filter(id => id !== itemId))
      setSelectAll(false)
    }
  }

  const handleResendSMS = () => {
    if (selectedItems.length === 0) {
      alert('재발송할 항목을 선택해주세요.')
      return
    }
    if (confirm(`선택한 ${selectedItems.length}개의 검사코드를 재발송하시겠습니까?`)) {
      resendSMSMutation.mutate(selectedItems)
    }
  }

  const handleReturnCodes = () => {
    if (selectedItems.length === 0) {
      alert('반환할 항목을 선택해주세요.')
      return
    }

    // 미실시 상태인 항목만 반환 가능
    const returnable = selectedItems.filter(id => {
      const item = completedList.find(code => code.id === id)
      return item && item.status === '미실시'
    })

    if (returnable.length === 0) {
      alert('반환 가능한 코드가 없습니다. 미실시 상태의 코드만 반환 가능합니다.')
      return
    }

    if (returnable.length < selectedItems.length) {
      alert(`${selectedItems.length}개 중 ${returnable.length}개만 반환 가능합니다. (미실시 상태만 가능)`)
    }

    if (confirm(`${returnable.length}개의 검사코드를 반환하시겠습니까?`)) {
      returnCodesMutation.mutate(returnable)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    refetch()
  }

  const handleResetSearch = () => {
    setFilters({
      testType: '',
      status: '',
      name: '',
      keyword: ''
    })
    setCurrentPage(1)
    refetch()
  }

  const handleRefresh = () => {
    refetch()
    setMessageBox('새로고침 되었습니다.')
    setTimeout(() => setMessageBox(''), 2000)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case '완료':
        return <span className="badge bg-success">완료</span>
      case '진행중':
        return <span className="badge bg-warning">진행중</span>
      case '미실시':
        return <span className="badge bg-secondary">미실시</span>
      default:
        return <span className="badge bg-light text-dark">{status}</span>
    }
  }

  const getSendStatusBadge = (sendStatus) => {
    switch (sendStatus) {
      case '발송완료':
        return <span className="badge bg-primary">발송완료</span>
      case '재발송':
        return <span className="badge bg-info">재발송</span>
      default:
        return <span className="badge bg-light text-dark">{sendStatus}</span>
    }
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <i className="fas fa-spinner fa-spin"></i>
        <p>발송 완료 목록 로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="group-code-complete-tab">
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">단체검사 코드 발송완료</h5>
          
          {/* 검색 및 필터 섹션 */}
          <div className="search-filter-section mb-3">
            <div className="row g-2">
              <div className="col-md-2">
                <select
                  className="form-select form-select-sm"
                  value={filters.testType}
                  onChange={(e) => setFilters({...filters, testType: e.target.value})}
                >
                  <option value="">검사종류</option>
                  <option value="IBPI 성인용">IBPI 성인용</option>
                  <option value="IBPI 청소년용">IBPI 청소년용</option>
                  <option value="IBPI 어린이용">IBPI 어린이용</option>
                </select>
              </div>
              <div className="col-md-2">
                <select
                  className="form-select form-select-sm"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="">상태</option>
                  <option value="미실시">미실시</option>
                  <option value="진행중">진행중</option>
                  <option value="완료">완료</option>
                </select>
              </div>
              <div className="col-md-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="이름"
                  value={filters.name}
                  onChange={(e) => setFilters({...filters, name: e.target.value})}
                />
              </div>
              <div className="col-md-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="검색어"
                  value={filters.keyword}
                  onChange={(e) => setFilters({...filters, keyword: e.target.value})}
                />
              </div>
              <div className="col-md-1">
                <select
                  className="form-select form-select-sm"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                >
                  <option value="10">10개</option>
                  <option value="20">20개</option>
                  <option value="50">50개</option>
                  <option value="100">100개</option>
                </select>
              </div>
              <div className="col-md-3">
                <button 
                  className="btn btn-primary btn-sm me-2"
                  onClick={handleSearch}
                >
                  검색
                </button>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetSearch}
                >
                  초기화
                </button>
              </div>
            </div>
          </div>

          {/* 액션 버튼 및 메시지 */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <button 
                className="btn btn-primary me-2" 
                onClick={handleResendSMS}
                disabled={resendSMSMutation.isLoading}
              >
                {resendSMSMutation.isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    재발송 중...
                  </>
                ) : (
                  '재발송'
                )}
              </button>
              <button 
                className="btn btn-secondary me-2" 
                onClick={handleReturnCodes}
                disabled={returnCodesMutation.isLoading}
              >
                {returnCodesMutation.isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    반환 중...
                  </>
                ) : (
                  '코드반환'
                )}
              </button>
              <button 
                className="btn btn-info text-white" 
                onClick={handleRefresh}
                disabled={isFetching}
              >
                {isFetching ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    새로고침 중...
                  </>
                ) : (
                  '새로고침'
                )}
              </button>
            </div>
            
            {messageBox && (
              <div className="text-success fw-bold">
                <i className="fas fa-check-circle me-2"></i>
                {messageBox}
              </div>
            )}
          </div>

          {/* 통계 정보 */}
          <div className="stats-info mb-3">
            <span className="text-muted">
              총 {filteredData.length}개 | 
              선택됨: {selectedItems.length}개 | 
              페이지: {currentPage}/{totalPages || 1}
            </span>
          </div>

          {filteredData.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
              <p className="text-muted">발송 완료된 검사코드가 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-bordered group-complete-table">
                  <thead>
                    <tr>
                      <th>
                        <input 
                          type="checkbox"
                          checked={selectAll}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </th>
                      <th>검사종류</th>
                      <th>이름</th>
                      <th>검사코드</th>
                      <th>이메일</th>
                      <th>휴대폰번호</th>
                      <th>상태</th>
                      <th>발송일</th>
                      <th>최종접속일</th>
                      <th>SMS 발송</th>
                      <th>발송현황</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map(item => (
                      <tr key={item.id}>
                        <td>
                          <input 
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                          />
                        </td>
                        <td>{item.test_type}</td>
                        <td>{item.name}</td>
                        <td className="text-monospace">{item.test_code}</td>
                        <td>{item.email || '-'}</td>
                        <td>{item.phone}</td>
                        <td>{getStatusBadge(item.status)}</td>
                        <td>
                          {item.sent_at 
                            ? new Date(item.sent_at).toLocaleDateString('ko-KR')
                            : '-'
                          }
                        </td>
                        <td>
                          {item.last_access 
                            ? new Date(item.last_access).toLocaleDateString('ko-KR')
                            : '-'
                          }
                        </td>
                        <td>
                          {item.sms_sent ? (
                            <span className="badge bg-success">발송</span>
                          ) : (
                            <span className="badge bg-secondary">미발송</span>
                          )}
                        </td>
                        <td>{getSendStatusBadge(item.send_status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <nav className="mt-3">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        이전
                      </button>
                    </li>
                    
                    {/* 페이지 번호 표시 */}
                    {[...Array(Math.min(5, totalPages))].map((_, index) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = index + 1
                      } else if (currentPage <= 3) {
                        pageNum = index + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + index
                      } else {
                        pageNum = currentPage - 2 + index
                      }
                      
                      return (
                        <li 
                          key={pageNum} 
                          className={`page-item ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          <button 
                            className="page-link" 
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        </li>
                      )
                    })}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        다음
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default GroupCodeCompleteTab
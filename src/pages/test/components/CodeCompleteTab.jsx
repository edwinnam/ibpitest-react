import { useState } from 'react'
import { useAuth } from '../../../modules/auth/AuthContext'
import { useSupabaseQuery, useSupabaseMutation } from '../../../core/hooks/useSupabaseQuery'
import { testCodeService } from '../../../core/services/testCodeService'
import { smsService } from '../../../core/services/smsService'
import './CodeCompleteTab.css'

const CodeCompleteTab = ({ onRefresh }) => {
  const { user } = useAuth()
  const [selectedItems, setSelectedItems] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTestType, setFilterTestType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  
  const orgNumber = user?.user_metadata?.org_number || sessionStorage.getItem('orgNumber')

  // 필터 객체 생성
  const filters = {
    testType: filterTestType,
    status: filterStatus,
    name: searchTerm
  }

  // 발송 완료된 코드 목록 조회
  const { data: completedList = [], isLoading, refetch } = useSupabaseQuery(
    ['completedCodes', orgNumber, filters],
    () => testCodeService.getCompletedCodes(orgNumber, filters),
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
        alert(`${data.summary.success}개의 검사코드가 재발송되었습니다.`)
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
        alert(`${count}개의 검사코드가 반환되었습니다.`)
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

  // 페이지네이션 계산
  const filteredData = completedList
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
    <div className="code-complete-tab">
      <div className="card card-body">
        <h4 className="text-center mb-3">검사코드 발송완료</h4>
        
        {/* 검색 및 필터 섹션 */}
        <div className="search-filter-section mb-4">
          <div className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="이름으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filterTestType}
                onChange={(e) => setFilterTestType(e.target.value)}
              >
                <option value="">전체 검사종류</option>
                <option value="성인용">성인용</option>
                <option value="청소년용">청소년용</option>
                <option value="아동용">아동용</option>
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">전체 상태</option>
                <option value="미실시">미실시</option>
                <option value="진행중">진행중</option>
                <option value="완료">완료</option>
              </select>
            </div>
            <div className="col-md-2">
              <button 
                className="btn btn-secondary w-100"
                onClick={() => {
                  setSearchTerm('')
                  setFilterTestType('')
                  setFilterStatus('')
                }}
              >
                필터 초기화
              </button>
            </div>
          </div>
        </div>

        {/* 통계 정보 */}
        <div className="stats-info mb-3">
          <span className="text-muted">
            총 {filteredData.length}개 | 
            선택됨: {selectedItems.length}개
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
              <table className="table table-bordered">
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
                    <th>휴대폰번호</th>
                    <th>진행상태</th>
                    <th>발송상태</th>
                    <th>발송일시</th>
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
                      <td>{item.phone}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>{getSendStatusBadge(item.send_status)}</td>
                      <td>
                        {item.sent_at 
                          ? new Date(item.sent_at).toLocaleString('ko-KR')
                          : '-'
                        }
                      </td>
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
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      이전
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, index) => (
                    <li 
                      key={index + 1} 
                      className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                    >
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(index + 1)}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      다음
                    </button>
                  </li>
                </ul>
              </nav>
            )}

            {/* 액션 버튼 */}
            <div className="action-buttons mt-4">
              <button 
                className="btn btn-primary me-2" 
                onClick={handleResendSMS}
                disabled={resendSMSMutation.isLoading}
              >
                {resendSMSMutation.isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    재발송 중...
                  </>
                ) : (
                  <>
                    <i className="fas fa-redo me-2"></i>
                    SMS 재발송
                  </>
                )}
              </button>
              <button 
                className="btn btn-warning" 
                onClick={handleReturnCodes}
                disabled={returnCodesMutation.isLoading}
              >
                {returnCodesMutation.isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    반환 중...
                  </>
                ) : (
                  <>
                    <i className="fas fa-undo me-2"></i>
                    코드 반환
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CodeCompleteTab
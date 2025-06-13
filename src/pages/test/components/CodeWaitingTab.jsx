import { useState, useEffect } from 'react'
import { useAuth } from '../../../modules/auth/AuthContext'
import { useSupabaseQuery, useSupabaseMutation } from '../../../core/hooks/useSupabaseQuery'
import { testCodeService } from '../../../core/services/testCodeService'
import { smsService } from '../../../core/services/smsService'
import './CodeWaitingTab.css'

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

const CodeWaitingTab = ({ onRefresh }) => {
  const { user } = useAuth()
  const [selectedItems, setSelectedItems] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [showSendSection, setShowSendSection] = useState(false)
  
  const orgNumber = user?.user_metadata?.org_number || sessionStorage.getItem('orgNumber')

  // 대기 중인 코드 목록 조회
  const { data: waitingList = [], isLoading, refetch } = useSupabaseQuery(
    ['waitingCodes', orgNumber],
    () => testCodeService.getWaitingCodes(orgNumber),
    { enabled: !!orgNumber }
  )

  // SMS 발송 뮤테이션
  const sendSMSMutation = useSupabaseMutation(
    async (codeIds) => {
      // 선택된 코드 정보 가져오기
      const selectedCodes = waitingList.filter(item => codeIds.includes(item.id))
      
      // SMS 발송을 위한 데이터 준비
      const recipients = selectedCodes.map(code => ({
        name: code.name,
        phone: code.phone,
        testCode: code.test_code,
        testType: code.test_type,
        institution1: code.institution1
      }))
      
      // SMS 발송
      const smsResult = await smsService.sendSMS(recipients)
      
      if (!smsResult.success) {
        throw new Error('SMS 발송 중 일부 오류가 발생했습니다.')
      }
      
      // 발송 상태 업데이트
      await testCodeService.updateSendStatus(codeIds, '발송완료')
      
      return smsResult
    },
    {
      onSuccess: (data) => {
        alert(`${data.summary.success}개의 검사코드가 발송되었습니다.`)
        setShowSendSection(false)
        setSelectedItems([])
        setSelectAll(false)
        refetch()
        if (onRefresh) onRefresh()
      },
      onError: (error) => {
        alert(`SMS 발송 오류: ${error.message}`)
      }
    }
  )

  const handleSelectAll = (checked) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedItems(waitingList.map(item => item.id))
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

  const handleSendClick = () => {
    if (selectedItems.length === 0) {
      alert('발송할 항목을 선택해주세요.')
      return
    }
    setShowSendSection(true)
  }

  const handleConfirmSend = async () => {
    sendSMSMutation.mutate(selectedItems)
  }

  const handleCancel = () => {
    setShowSendSection(false)
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <i className="fas fa-spinner fa-spin"></i>
        <p>대기 목록 로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="code-waiting-tab">
      <div className="card card-body">
        <h4 className="text-center mb-3">검사코드 발송대기</h4>
        
        {waitingList.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
            <p className="text-muted">발송 대기 중인 검사코드가 없습니다.</p>
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
                    <th>개인고유번호</th>
                    <th>소속기관1</th>
                    <th>소속기관2</th>
                    <th>이메일</th>
                    <th>휴대폰번호</th>
                    <th>규준집단</th>
                  </tr>
                </thead>
                <tbody>
                  {waitingList.map(item => (
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
                      <td>{item.personal_id || '-'}</td>
                      <td>{item.institution1}</td>
                      <td>{item.institution2 || '-'}</td>
                      <td>{item.email || '-'}</td>
                      <td>{item.phone}</td>
                      <td>{getStandardGroupLabel(item.standard_group)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showSendSection && (
              <div className="send-section mt-4">
                <div className="alert alert-info">
                  <h5>인증코드 발송</h5>
                  <p>선택된 {selectedItems.length}명에게 검사코드를 발송합니다.</p>
                  <p className="mb-0">발송 방법: SMS</p>
                </div>
              </div>
            )}

            <div className="action-buttons mt-4">
              {!showSendSection ? (
                <button 
                  className="btn btn-primary" 
                  onClick={handleSendClick}
                >
                  발송
                </button>
              ) : (
                <>
                  <button 
                    className="btn btn-danger me-2" 
                    onClick={handleConfirmSend}
                    disabled={sendSMSMutation.isLoading}
                  >
                    {sendSMSMutation.isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        발송 중...
                      </>
                    ) : (
                      '확인'
                    )}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={handleCancel}
                    disabled={sendSMSMutation.isLoading}
                  >
                    취소
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CodeWaitingTab
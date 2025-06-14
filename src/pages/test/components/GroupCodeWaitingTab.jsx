import { useState, useEffect } from 'react'
import { useAuth } from '../../../modules/auth/AuthContext'
import { useOrganization } from '../../../modules/organization/OrganizationContext'
import { useSupabaseQuery, useSupabaseMutation } from '../../../core/hooks/useSupabaseQuery'
import { testCodeService } from '../../../core/services/testCodeService'
import { smsService } from '../../../core/services/smsService'
import './GroupCodeWaitingTab.css'

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

const GroupCodeWaitingTab = ({ onRefresh }) => {
  const { user } = useAuth()
  const { getOrgNumber } = useOrganization()
  const [selectedItems, setSelectedItems] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [showSendSection, setShowSendSection] = useState(false)
  
  // SMS 설정
  const [bulkSmsEnabled, setBulkSmsEnabled] = useState(false)
  const [bulkSmsTestMode, setBulkSmsTestMode] = useState(true)
  
  const orgNumber = getOrgNumber()

  // 대기 중인 코드 목록 조회
  const { data: waitingList = [], isLoading, refetch } = useSupabaseQuery(
    ['groupWaitingCodes', orgNumber],
    () => testCodeService.getWaitingCodes(orgNumber),
    { enabled: !!orgNumber }
  )

  // SMS 발송 뮤테이션
  const sendSMSMutation = useSupabaseMutation(
    async (codeIds) => {
      if (!bulkSmsEnabled) {
        // SMS 비활성화 시 상태만 업데이트
        await testCodeService.updateSendStatus(codeIds, '발송완료')
        return { success: true, summary: { total: codeIds.length, success: codeIds.length, fail: 0 } }
      }

      // 선택된 코드 정보 가져오기
      const selectedCodes = waitingList.filter(item => codeIds.includes(item.id))
      
      // 500개씩 분할하여 발송
      const batchSize = 500
      let totalSuccess = 0
      let totalFail = 0
      
      for (let i = 0; i < selectedCodes.length; i += batchSize) {
        const batch = selectedCodes.slice(i, i + batchSize)
        
        // SMS 발송을 위한 데이터 준비
        const recipients = batch.map(code => ({
          name: code.name,
          phone: code.phone,
          testCode: code.test_code,
          testType: code.test_type,
          institution1: code.institution1
        }))
        
        // SMS 발송
        const smsResult = await smsService.sendSMS(recipients)
        
        totalSuccess += smsResult.summary.success
        totalFail += smsResult.summary.fail
        
        // 성공한 코드들의 상태 업데이트
        const successCodes = batch
          .filter((code, index) => smsResult.results[index]?.success)
          .map(code => code.id)
        
        if (successCodes.length > 0) {
          await testCodeService.updateSendStatus(successCodes, '발송완료')
        }
      }
      
      return {
        success: totalFail === 0,
        summary: {
          total: selectedCodes.length,
          success: totalSuccess,
          fail: totalFail
        }
      }
    },
    {
      onSuccess: (data) => {
        alert(`총 ${data.summary.total}명 중 ${data.summary.success}명 발송 성공`)
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
    <div className="group-code-waiting-tab">
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">단체검사 코드 발송대기</h5>
          
          {/* 대기 수 표시 */}
          <div className="alert alert-info mt-3">
            총 <span className="fw-bold">{waitingList.length}</span>명의 발송 대기 데이터가 있습니다.
          </div>
          
          {waitingList.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
              <p className="text-muted">발송 대기 중인 검사코드가 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-bordered group-waiting-table">
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
                      <th>SMS 상태</th>
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
                        <td>
                          <span className="badge bg-warning">대기</span>
                        </td>
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
                    <p className="mb-0">
                      발송 방법: {bulkSmsEnabled ? 'SMS' : '코드 생성만 (SMS 비활성화)'}
                    </p>
                  </div>
                </div>
              )}

              {/* SMS 발송 설정 */}
              <div className="card mt-3 bulk-sms-settings">
                <div className="card-header">
                  <h6 className="mb-0">📱 일괄 SMS 발송 설정</h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-check form-switch">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="bulk-sms-enable"
                          checked={bulkSmsEnabled}
                          onChange={(e) => setBulkSmsEnabled(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="bulk-sms-enable">
                          SMS 발송 활성화
                        </label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="bulk-sms-test-mode"
                          checked={bulkSmsTestMode}
                          onChange={(e) => setBulkSmsTestMode(e.target.checked)}
                          disabled={!bulkSmsEnabled}
                        />
                        <label className="form-check-label" htmlFor="bulk-sms-test-mode">
                          테스트 모드
                        </label>
                      </div>
                    </div>
                    <div className="col-md-4 text-end">
                      <span className={`badge ${bulkSmsEnabled ? 'bg-success' : 'bg-secondary'}`}>
                        {bulkSmsEnabled ? 
                          (bulkSmsTestMode ? 'SMS 테스트 모드' : 'SMS 활성화') : 
                          'SMS 비활성화'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="action-buttons text-center mt-4">
                {!showSendSection ? (
                  <button 
                    className="btn btn-primary" 
                    onClick={handleSendClick}
                  >
                    <i className="fas fa-paper-plane me-2"></i>
                    일괄 발송
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
                          <span className="spinner-border spinner-border-sm me-2"></span>
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
    </div>
  )
}

export default GroupCodeWaitingTab
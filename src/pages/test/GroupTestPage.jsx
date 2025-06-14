import { useState, useEffect } from 'react'
import { useAuth } from '../../modules/auth/AuthContext'
import { useOrganization } from '../../modules/organization/OrganizationContext'
import GroupCodeGenerationTab from './components/GroupCodeGenerationTab'
import GroupCodeWaitingTab from './components/GroupCodeWaitingTab'
import GroupCodeCompleteTab from './components/GroupCodeCompleteTab'
import './GroupTestPage.css'

const GroupTestPage = () => {
  const [activeTab, setActiveTab] = useState('generation')
  const { user } = useAuth()
  const { getAvailableCodes, refreshStats } = useOrganization()
  const [remainingCodes, setRemainingCodes] = useState(0)

  useEffect(() => {
    // URL 해시에 따라 탭 설정
    const hash = window.location.hash.substring(1)
    if (hash && ['generation', 'waiting', 'complete'].includes(hash)) {
      setActiveTab(hash)
    }

    // 잔여 코드 수 로드
    loadRemainingCodes()
  }, [getAvailableCodes])

  const loadRemainingCodes = async () => {
    if (!user) return
    
    try {
      const availableCodes = getAvailableCodes()
      setRemainingCodes(availableCodes)
      await refreshStats()
    } catch (error) {
      console.error('잔여 코드 로드 오류:', error)
    }
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    window.location.hash = tabId
  }

  return (
    <div className="group-test-page">
      <div className="page-header">
        <h1>IBPI 단체검사 관리</h1>
        <p className="page-subtitle">단체 검사를 위한 코드 생성 및 관리</p>
      </div>

      {/* 탭 네비게이션 */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'generation' ? 'active' : ''}`}
            onClick={() => handleTabChange('generation')}
          >
            검사코드 생성
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'waiting' ? 'active' : ''}`}
            onClick={() => handleTabChange('waiting')}
          >
            검사코드 발송대기
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'complete' ? 'active' : ''}`}
            onClick={() => handleTabChange('complete')}
          >
            검사코드 발송완료
          </button>
        </li>
      </ul>

      {/* 탭 컨텐츠 */}
      <div className="tab-content">
        {activeTab === 'generation' && (
          <GroupCodeGenerationTab 
            remainingCodes={remainingCodes}
            onRefresh={loadRemainingCodes}
          />
        )}
        {activeTab === 'waiting' && (
          <GroupCodeWaitingTab 
            onRefresh={loadRemainingCodes}
          />
        )}
        {activeTab === 'complete' && (
          <GroupCodeCompleteTab 
            onRefresh={loadRemainingCodes}
          />
        )}
      </div>

      {/* 하단 링크 */}
      <div className="page-footer mt-5">
        <button 
          className="btn btn-link"
          onClick={() => window.location.href = '/test-management#code-generation'}
        >
          <i className="fas fa-arrow-left me-2"></i>
          개인검사 관리로 돌아가기
        </button>
      </div>
    </div>
  )
}

export default GroupTestPage
import { useState, useEffect } from 'react'
import { useAuth } from '../../modules/auth/AuthContext'
import { useOrganization } from '../../modules/organization/OrganizationContext'
import { db } from '../../core/services/supabase'
import CodeGenerationTab from './components/CodeGenerationTab'
import CodeWaitingTab from './components/CodeWaitingTab'
import CodeCompleteTab from './components/CodeCompleteTab'
import './TestManagementPage.css'

const TestManagementPage = () => {
  const [activeTab, setActiveTab] = useState('code-generation')
  const { user } = useAuth()
  const { getAvailableCodes, refreshStats } = useOrganization()
  const [remainingCodes, setRemainingCodes] = useState(0)

  useEffect(() => {
    // URL 해시에 따라 탭 설정
    const hash = window.location.hash.substring(1)
    if (hash && ['code-generation', 'code-waiting', 'code-complete'].includes(hash)) {
      setActiveTab(hash)
    }

    // 잔여 코드 수 로드
    loadRemainingCodes()
  }, [user, getAvailableCodes])

  const loadRemainingCodes = async () => {
    if (!user) return
    
    try {
      // 기관 컨텍스트에서 사용 가능한 코드 수 가져오기
      const availableCodes = getAvailableCodes()
      setRemainingCodes(availableCodes)
      
      // 통계 새로고침
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
    <div className="test-management-page">
      <div className="page-header">
        <h1>IBPI 검사코드관리 및 검사실시</h1>
      </div>

      {/* 메인 탭 */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab !== 'group-test' ? 'active' : ''}`}
            onClick={() => handleTabChange('code-generation')}
          >
            검사코드
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'group-test' ? 'active' : ''}`}
            onClick={() => handleTabChange('group-test')}
          >
            단체검사 검사코드
          </button>
        </li>
      </ul>

      {/* 서브 탭 (개인 검사) */}
      {activeTab !== 'group-test' && (
        <>
          <ul className="nav nav-tabs nav-tabs-sub">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'code-generation' ? 'active' : ''}`}
                onClick={() => handleTabChange('code-generation')}
              >
                검사코드 생성
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'code-waiting' ? 'active' : ''}`}
                onClick={() => handleTabChange('code-waiting')}
              >
                검사코드 발송대기
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'code-complete' ? 'active' : ''}`}
                onClick={() => handleTabChange('code-complete')}
              >
                검사코드 발송완료
              </button>
            </li>
          </ul>

          <div className="tab-content mt-4">
            {activeTab === 'code-generation' && (
              <CodeGenerationTab 
                remainingCodes={remainingCodes}
                onRefresh={loadRemainingCodes}
              />
            )}
            {activeTab === 'code-waiting' && (
              <CodeWaitingTab onRefresh={loadRemainingCodes} />
            )}
            {activeTab === 'code-complete' && (
              <CodeCompleteTab onRefresh={loadRemainingCodes} />
            )}
          </div>
        </>
      )}

      {/* 단체검사 탭 내용 */}
      {activeTab === 'group-test' && (
        <div className="tab-content mt-4">
          <div className="card card-body">
            <h4 className="text-center mb-4">단체검사 검사코드</h4>
            <div className="alert alert-warning">
              단체검사 구매 이후 사용하실 수 있습니다.
            </div>
            <button 
              type="button" 
              className="btn btn-primary mx-auto"
              style={{ width: 'fit-content' }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="page-footer">
        <button className="btn btn-outline-secondary">
          이용자 가이드
        </button>
        <button className="btn btn-outline-secondary">
          검사구매 링크
        </button>
        <a href="/dashboard" className="btn btn-outline-secondary">
          이전 페이지
        </a>
      </div>
    </div>
  )
}

export default TestManagementPage
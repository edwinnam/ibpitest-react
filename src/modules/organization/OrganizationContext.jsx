import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { organizationService } from '../../core/services/organizationService'

const OrganizationContext = createContext({})

export const useOrganization = () => {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}

export const OrganizationProvider = ({ children }) => {
  const { user } = useAuth()
  const [organization, setOrganization] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 기관 정보 로드
  const loadOrganization = async (orgNumber) => {
    setLoading(true)
    setError(null)
    
    try {
      // 기관 정보 가져오기
      const orgData = await organizationService.getOrganization(orgNumber)
      setOrganization(orgData)
      
      // 통계 정보 가져오기
      const statsData = await organizationService.getOrganizationStats(orgNumber)
      setStats(statsData)
      
      // 로컬 스토리지에 저장
      localStorage.setItem('orgNumber', orgData.org_number)
      localStorage.setItem('orgName', orgData.name || '')
      localStorage.setItem('codesAvailable', statsData.availableCodes || '0')
      
    } catch (err) {
      console.error('기관 정보 로드 오류:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 사용자 로그인 시 기관 정보 로드
  useEffect(() => {
    const fetchOrganization = async () => {
      if (user) {
        console.log('User logged in:', user.email)
        
        // user_metadata에서 org_number 확인
        const orgNumber = user.user_metadata?.org_number || localStorage.getItem('orgNumber')
        console.log('Org number from metadata/storage:', orgNumber)
        
        if (orgNumber) {
          await loadOrganization(orgNumber)
        } else if (user.email) {
          // 이메일로 기관 정보 조회
          try {
            console.log('Fetching organization by email:', user.email)
            const orgData = await organizationService.getOrganization(user.email)
            console.log('Organization data:', orgData)
            
            if (orgData) {
              await loadOrganization(orgData.org_number)
            } else {
              console.warn('No organization found for email:', user.email)
              setLoading(false)
            }
          } catch (err) {
            console.error('기관 조회 오류:', err)
            setError(err.message)
            setLoading(false)
          }
        } else {
          setLoading(false)
        }
      } else {
        // 로그아웃 시 상태 초기화
        setOrganization(null)
        setStats(null)
        setLoading(false)
      }
    }

    fetchOrganization()
  }, [user])

  // 통계 업데이트 함수
  const refreshStats = async () => {
    if (!organization?.org_number) return
    
    try {
      const statsData = await organizationService.getOrganizationStats(organization.org_number)
      setStats(statsData)
      localStorage.setItem('codesAvailable', statsData.availableCodes || '0')
    } catch (err) {
      console.error('통계 업데이트 오류:', err)
    }
  }

  const value = {
    organization,
    stats,
    loading,
    error,
    refreshStats,
    loadOrganization,
    // 편의를 위한 getter 함수들
    getOrgNumber: () => organization?.org_number,
    getOrgName: () => organization?.name,
    getAvailableCodes: () => stats?.availableCodes || 0,
    getTotalTests: () => stats?.totalTests || 0,
    getCompletedTests: () => stats?.completedTests || 0,
    getPendingTests: () => stats?.pendingTests || 0,
  }

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}
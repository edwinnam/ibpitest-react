import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '../../core/services/supabase'
import { mfaService } from '../../core/services/mfaService'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 초기 세션 체크
    auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Session error:', error)
      } else {
        setSession(data?.session)
        setUser(data?.session?.user || null)
      }
      setLoading(false)
    })

    // 인증 상태 변경 리스너
    const { data: authListener } = auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      setSession(session)
      setUser(session?.user || null)
      setLoading(false)

      // 세션이 만료된 경우
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // 필요한 정리 작업
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    setLoading(true)
    try {
      const { data, error } = await auth.signIn(email, password)
      if (error) throw error
      
      // Check if user has MFA enabled
      const assuranceLevel = await mfaService.getAssuranceLevel()
      const factors = await mfaService.listFactors()
      
      // If MFA is required but not completed
      if (factors.length > 0 && assuranceLevel === 'aal1') {
        return { 
          data, 
          error: null, 
          requiresMFA: true,
          factors 
        }
      }
      
      return { data, error: null, requiresMFA: false }
    } catch (error) {
      console.error('Login error:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await auth.signOut()
      if (error) throw error
      
      // 로컬 스토리지 정리
      localStorage.clear()
      sessionStorage.clear()
      
      return { error: null }
    } catch (error) {
      console.error('Logout error:', error)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
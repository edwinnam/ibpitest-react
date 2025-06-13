import { create } from 'zustand'
import { db } from '../core/services/supabase'

const useOrganizationStore = create((set, get) => ({
  organization: null,
  codesAvailable: 0,
  loading: false,
  error: null,

  // 기관 정보 로드
  loadOrganization: async (orgNumber) => {
    set({ loading: true, error: null })
    
    try {
      const { data, error } = await db.getOrganization(orgNumber)
      
      if (error) throw error
      
      set({ 
        organization: data,
        loading: false 
      })
      
      // 코드 수도 함께 로드
      await get().loadCodesAvailable(orgNumber)
      
    } catch (error) {
      set({ 
        error: error.message,
        loading: false 
      })
    }
  },

  // 사용 가능한 코드 수 로드
  loadCodesAvailable: async (orgNumber) => {
    try {
      const { data, error } = await db.getTestCodes(orgNumber)
      
      if (error) throw error
      
      const unusedCodes = data.filter(code => code.status === 'unused').length
      
      set({ codesAvailable: unusedCodes })
      
    } catch (error) {
      console.error('코드 수 로드 오류:', error)
    }
  },

  // 코드 사용
  useCode: (count = 1) => {
    set(state => ({
      codesAvailable: Math.max(0, state.codesAvailable - count)
    }))
  },

  // 코드 반환
  returnCode: (count = 1) => {
    set(state => ({
      codesAvailable: state.codesAvailable + count
    }))
  },

  // 상태 초기화
  reset: () => {
    set({
      organization: null,
      codesAvailable: 0,
      loading: false,
      error: null
    })
  }
}))
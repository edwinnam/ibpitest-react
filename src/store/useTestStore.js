import { create } from 'zustand'
import { supabase } from '../core/services/supabase'

const useTestStore = create((set, get) => ({
  tests: [],
  waitingTests: [],
  completedTests: [],
  loading: false,
  error: null,

  // 대기 중인 검사 로드
  loadWaitingTests: async (orgNumber) => {
    set({ loading: true, error: null })
    
    try {
      const { data, error } = await supabase
        .from('test_codes')
        .select('*')
        .eq('org_number', orgNumber)
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      set({ 
        waitingTests: data || [],
        loading: false 
      })
      
    } catch (error) {
      set({ 
        error: error.message,
        loading: false 
      })
    }
  },

  // 완료된 검사 로드
  loadCompletedTests: async (orgNumber) => {
    set({ loading: true, error: null })
    
    try {
      const { data, error } = await supabase
        .from('test_codes')
        .select('*')
        .eq('org_number', orgNumber)
        .in('status', ['sent', 'completed'])
        .order('sent_at', { ascending: false })
      
      if (error) throw error
      
      set({ 
        completedTests: data || [],
        loading: false 
      })
      
    } catch (error) {
      set({ 
        error: error.message,
        loading: false 
      })
    }
  },

  // 검사 코드 생성
  createTestCodes: async (customers, orgNumber) => {
    set({ loading: true, error: null })
    
    try {
      // 코드 생성 로직
      const codes = customers.map(customer => ({
        code: `IBPI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        org_number: orgNumber,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email,
        test_type: customer.testType,
        standard_group: customer.standardGroup,
        status: 'waiting',
        created_at: new Date().toISOString()
      }))
      
      const { data, error } = await supabase
        .from('test_codes')
        .insert(codes)
        .select()
      
      if (error) throw error
      
      // 대기 목록 업데이트
      set(state => ({
        waitingTests: [...data, ...state.waitingTests],
        loading: false
      }))
      
      return { success: true, data }
      
    } catch (error) {
      set({ 
        error: error.message,
        loading: false 
      })
      return { success: false, error: error.message }
    }
  },

  // 코드 발송
  sendCodes: async (codeIds) => {
    set({ loading: true, error: null })
    
    try {
      // SMS 발송 로직 구현
      // ...
      
      // 상태 업데이트
      const { data, error } = await supabase
        .from('test_codes')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .in('id', codeIds)
        .select()
      
      if (error) throw error
      
      // 대기 목록에서 제거하고 완료 목록에 추가
      set(state => ({
        waitingTests: state.waitingTests.filter(test => !codeIds.includes(test.id)),
        completedTests: [...data, ...state.completedTests],
        loading: false
      }))
      
      return { success: true, data }
      
    } catch (error) {
      set({ 
        error: error.message,
        loading: false 
      })
      return { success: false, error: error.message }
    }
  },

  // 코드 반환
  returnCodes: async (codeIds) => {
    set({ loading: true, error: null })
    
    try {
      const { data, error } = await supabase
        .from('test_codes')
        .delete()
        .in('id', codeIds)
        .select()
      
      if (error) throw error
      
      // 완료 목록에서 제거
      set(state => ({
        completedTests: state.completedTests.filter(test => !codeIds.includes(test.id)),
        loading: false
      }))
      
      return { success: true, data }
      
    } catch (error) {
      set({ 
        error: error.message,
        loading: false 
      })
      return { success: false, error: error.message }
    }
  },

  // 상태 초기화
  reset: () => {
    set({
      tests: [],
      waitingTests: [],
      completedTests: [],
      loading: false,
      error: null
    })
  }
}))
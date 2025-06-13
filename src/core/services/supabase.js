import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ojwknqceiqzgutyhefwc.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qd2tucWNlaXF6Z3V0eWhlZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0ODQ3MjEsImV4cCI6MjA0NzA2MDcyMX0.HUBv8KIGgd1IH3B6Z1NhE_hP0pOqfKYhGQN5bgCBPu0'

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// 인증 헬퍼 함수들
export const auth = {
  // 로그인
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    // 로그인 성공 시 기관 정보 가져오기
    if (data?.user && !error) {
      try {
        // 이메일로 기관 정보 조회
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('email', email)
          .single()
        
        if (!orgError && orgData) {
          // 기관 정보를 로컬 스토리지에 저장
          localStorage.setItem('orgNumber', orgData.org_number)
          localStorage.setItem('orgName', orgData.name || '')
          localStorage.setItem('codesAvailable', orgData.codes_available || '0')
          
          // user_metadata에 org_number 추가
          data.user.user_metadata = {
            ...data.user.user_metadata,
            org_number: orgData.org_number,
            org_name: orgData.name
          }
        }
      } catch (err) {
        console.error('기관 정보 조회 오류:', err)
      }
    }
    
    return { data, error }
  },

  // 로그아웃
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // 현재 세션 가져오기
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession()
    return { data, error }
  },

  // 현재 사용자 가져오기
  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // 세션 변경 리스너
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  },
}

// 데이터베이스 헬퍼 함수들
export const db = {
  // 기관 정보 조회
  getOrganization: async (orgNumber) => {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('org_number', orgNumber)
      .single()
    return { data, error }
  },

  // 검사 코드 조회
  getTestCodes: async (orgNumber) => {
    const { data, error } = await supabase
      .from('test_codes')
      .select('*')
      .eq('org_number', orgNumber)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // 고객 정보 조회
  getCustomers: async (orgNumber) => {
    const { data, error } = await supabase
      .from('customers_info')
      .select('*')
      .eq('org_number', orgNumber)
      .order('created_at', { ascending: false })
    return { data, error }
  },
}
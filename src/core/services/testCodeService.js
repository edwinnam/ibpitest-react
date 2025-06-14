import { supabase } from './supabase'

// 코드 생성 함수
const generateUniqueCode = () => {
  // 현재 시간을 기반으로 한 접두사 (5자리)
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const prefix = year + month + day
  
  // 랜덤 6자리 숫자
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  
  return `${prefix.slice(-5)}-${random}`
}

export const testCodeService = {
  // 검사 코드 생성
  async createTestCodes(orgNumber, customers) {
    // 1. unused_codes에서 필요한 수만큼 코드 가져오기
    const { data: unusedCodes, error: fetchError } = await supabase
      .from('unused_codes')
      .select('*')
      .eq('org_number', orgNumber)
      .limit(customers.length)
    
    if (fetchError) throw fetchError
    
    if (!unusedCodes || unusedCodes.length < customers.length) {
      throw new Error(`사용 가능한 코드가 부족합니다. 필요: ${customers.length}, 가능: ${unusedCodes?.length || 0}`)
    }

    // 2. used_codes로 이동
    const usedCodesData = customers.map((customer, index) => ({
      code: unusedCodes[index].code,
      org_number: orgNumber,
      assigned_to_name: customer.name,
      assigned_to_phone: customer.phone,
      assigned_to_email: customer.email || null,
      test_type: customer.testType,
      standard_group: customer.standardGroup,
      customer_number: customer.personalId || null,
      organization1: customer.institution1,
      organization2: customer.institution2 || null,
      status: 'assigned',
      assigned_at: new Date().toISOString()
    }))

    // 3. used_codes에 삽입
    const { data: insertedCodes, error: insertError } = await supabase
      .from('used_codes')
      .insert(usedCodesData)
      .select()
    
    if (insertError) throw insertError

    // 4. unused_codes에서 삭제
    const codesToDelete = unusedCodes.map(code => code.code)
    const { error: deleteError } = await supabase
      .from('unused_codes')
      .delete()
      .in('code', codesToDelete)
    
    if (deleteError) throw deleteError

    return insertedCodes
  },

  // 대기 중인 코드 조회
  async getWaitingCodes(orgNumber) {
    const { data, error } = await supabase
      .from('used_codes')
      .select('*')
      .eq('org_number', orgNumber)
      .eq('status', 'assigned')
      .eq('sms_sent', false)
      .order('assigned_at', { ascending: false })
    
    if (error) throw error
    
    // 데이터 매핑
    return (data || []).map(item => ({
      ...item,
      name: item.assigned_to_name,
      phone: item.assigned_to_phone,
      email: item.assigned_to_email,
      personal_id: item.customer_number,
      institution1: item.organization1,
      institution2: item.organization2,
      test_code: item.code,
      send_status: item.sms_sent ? '발송완료' : '대기'
    }))
  },

  // 발송 완료된 코드 조회
  async getCompletedCodes(orgNumber, filters = {}) {
    let query = supabase
      .from('used_codes')
      .select('*')
      .eq('org_number', orgNumber)
      .eq('sms_sent', true)
    
    // 필터 적용
    if (filters.testType) {
      query = query.eq('test_type', filters.testType)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.name) {
      query = query.ilike('assigned_to_name', `%${filters.name}%`)
    }
    
    const { data, error } = await query.order('sms_sent_at', { ascending: false })
    
    if (error) throw error
    
    // 데이터 매핑
    return (data || []).map(item => ({
      ...item,
      name: item.assigned_to_name,
      phone: item.assigned_to_phone,
      email: item.assigned_to_email,
      personal_id: item.customer_number,
      institution1: item.organization1,
      institution2: item.organization2,
      test_code: item.code,
      status: item.status === 'completed' ? '완료' : (item.status === 'assigned' ? '미실시' : '진행중'),
      send_status: item.sms_sent ? '발송완료' : '대기',
      sent_at: item.sms_sent_at,
      last_access: item.completed_at
    }))
  },

  // 코드 발송 상태 업데이트
  async updateSendStatus(codeIds, status) {
    const updateData = {
      sms_sent: true,
      sms_sent_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('used_codes')
      .update(updateData)
      .in('id', codeIds)
      .select()
    
    if (error) throw error
    return data
  },

  // 코드 반환 (used_codes → unused_codes)
  async returnCodes(codeIds) {
    // 1. 반환할 코드 정보 조회
    const { data: codesToReturn, error: fetchError } = await supabase
      .from('used_codes')
      .select('code, org_number')
      .in('id', codeIds)
      .eq('status', '미실시') // 미실시 상태만 반환 가능
    
    if (fetchError) throw fetchError
    
    if (!codesToReturn || codesToReturn.length === 0) {
      throw new Error('반환 가능한 코드가 없습니다.')
    }

    // 2. unused_codes에 다시 삽입
    const unusedCodesData = codesToReturn.map(item => ({
      code: item.code,
      org_number: item.org_number,
      created_at: new Date().toISOString()
    }))

    const { error: insertError } = await supabase
      .from('unused_codes')
      .insert(unusedCodesData)
    
    if (insertError) throw insertError

    // 3. used_codes에서 삭제
    const { error: deleteError } = await supabase
      .from('used_codes')
      .delete()
      .in('id', codeIds)
    
    if (deleteError) throw deleteError

    return codesToReturn.length
  },

  // 검사 상태 업데이트
  async updateTestStatus(codeId, status) {
    const { data, error } = await supabase
      .from('used_codes')
      .update({ 
        status,
        last_access: new Date().toISOString()
      })
      .eq('id', codeId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 미사용 코드 생성 (관리자용)
  async generateUnusedCodes(orgNumber, count) {
    const codes = []
    const maxAttempts = count * 10 // 충분한 시도 횟수
    let attempts = 0
    
    // 중복 확인을 위해 기존 코드 목록 가져오기
    const { data: existingCodes } = await supabase
      .from('unused_codes')
      .select('code')
      .eq('org_number', orgNumber)
    
    const existingCodeSet = new Set(existingCodes?.map(c => c.code) || [])
    
    // 고유한 코드 생성
    while (codes.length < count && attempts < maxAttempts) {
      const newCode = generateUniqueCode()
      if (!existingCodeSet.has(newCode) && !codes.some(c => c.code === newCode)) {
        codes.push({
          code: newCode,
          org_number: orgNumber,
          created_at: new Date().toISOString()
        })
      }
      attempts++
    }
    
    if (codes.length < count) {
      throw new Error('충분한 고유 코드를 생성할 수 없습니다.')
    }
    
    // 코드 삽입
    const { data, error } = await supabase
      .from('unused_codes')
      .insert(codes)
      .select()
    
    if (error) throw error
    
    // 기관의 사용 가능한 코드 수 업데이트
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ 
        codes_available: supabase.sql`codes_available + ${count}`
      })
      .eq('org_number', orgNumber)
    
    if (updateError) throw updateError
    
    return data
  }
}
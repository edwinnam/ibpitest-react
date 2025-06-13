import { supabase } from './supabase'

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
      test_code: unusedCodes[index].code,
      org_number: orgNumber,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || null,
      test_type: customer.testType,
      standard_group: customer.standardGroup,
      personal_id: customer.personalId || null,
      institution1: customer.institution1,
      institution2: customer.institution2 || null,
      status: '미실시',
      send_status: '대기',
      created_at: new Date().toISOString()
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
      .eq('send_status', '대기')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // 발송 완료된 코드 조회
  async getCompletedCodes(orgNumber, filters = {}) {
    let query = supabase
      .from('used_codes')
      .select('*')
      .eq('org_number', orgNumber)
      .in('send_status', ['발송완료', '재발송'])
    
    // 필터 적용
    if (filters.testType) {
      query = query.eq('test_type', filters.testType)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.name) {
      query = query.ilike('name', `%${filters.name}%`)
    }
    
    const { data, error } = await query.order('sent_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // 코드 발송 상태 업데이트
  async updateSendStatus(codeIds, status) {
    const { data, error } = await supabase
      .from('used_codes')
      .update({ 
        send_status: status,
        sent_at: new Date().toISOString()
      })
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
  }
}
import { supabase } from './supabase'

export const organizationService = {
  // 기관 정보 조회
  async getOrganization(orgNumber) {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('org_number', orgNumber)
      .single()
    
    if (error) throw error
    return data
  },

  // 기관 정보 업데이트
  async updateOrganization(orgNumber, updates) {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('org_number', orgNumber)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 사용 가능한 코드 수 조회
  async getAvailableCodesCount(orgNumber) {
    const { count, error } = await supabase
      .from('unused_codes')
      .select('*', { count: 'exact', head: true })
      .eq('org_number', orgNumber)
    
    if (error) throw error
    return count || 0
  },

  // 사용된 코드 수 조회
  async getUsedCodesCount(orgNumber) {
    const { count, error } = await supabase
      .from('used_codes')
      .select('*', { count: 'exact', head: true })
      .eq('org_number', orgNumber)
    
    if (error) throw error
    return count || 0
  },

  // 기관 통계 조회
  async getOrganizationStats(orgNumber) {
    const [availableCodes, usedCodes] = await Promise.all([
      this.getAvailableCodesCount(orgNumber),
      this.getUsedCodesCount(orgNumber)
    ])

    // 완료된 검사 수
    const { count: completedTests } = await supabase
      .from('used_codes')
      .select('*', { count: 'exact', head: true })
      .eq('org_number', orgNumber)
      .eq('status', '완료')

    // 진행 중인 검사 수  
    const { count: pendingTests } = await supabase
      .from('used_codes')
      .select('*', { count: 'exact', head: true })
      .eq('org_number', orgNumber)
      .eq('status', '미실시')

    return {
      availableCodes,
      usedCodes,
      totalCodes: availableCodes + usedCodes,
      completedTests: completedTests || 0,
      pendingTests: pendingTests || 0,
      totalTests: usedCodes
    }
  }
}
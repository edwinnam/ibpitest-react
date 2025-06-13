import { supabase } from './supabase'

/**
 * 고객번호 생성 서비스
 * 형식: YYYYMMDD-NNNN (날짜-일련번호)
 */
export const getNextCustomerNumber = async () => {
  try {
    // 오늘 날짜 기준
    const today = new Date()
    const datePrefix = today.toISOString().split('T')[0].replace(/-/g, '') // YYYYMMDD
    
    // 오늘 날짜로 시작하는 가장 큰 고객번호 조회
    const { data, error } = await supabase
      .from('customers_info')
      .select('customer_number')
      .like('customer_number', `${datePrefix}-%`)
      .order('customer_number', { ascending: false })
      .limit(1)
    
    if (error) {
      console.error('고객번호 조회 오류:', error)
      // 오류 시 타임스탬프 기반 고유 번호 생성
      return `${datePrefix}-${Date.now().toString().slice(-4)}`
    }
    
    let nextNumber = 1
    
    if (data && data.length > 0) {
      // 기존 번호에서 일련번호 추출
      const lastNumber = data[0].customer_number
      const parts = lastNumber.split('-')
      
      if (parts.length === 2) {
        const lastSeq = parseInt(parts[1], 10)
        if (!isNaN(lastSeq)) {
          nextNumber = lastSeq + 1
        }
      }
    }
    
    // 4자리로 패딩
    const paddedNumber = nextNumber.toString().padStart(4, '0')
    
    return `${datePrefix}-${paddedNumber}`
  } catch (error) {
    console.error('고객번호 생성 오류:', error)
    // 오류 시 타임스탬프 기반 고유 번호 생성
    const datePrefix = new Date().toISOString().split('T')[0].replace(/-/g, '')
    return `${datePrefix}-${Date.now().toString().slice(-4)}`
  }
}
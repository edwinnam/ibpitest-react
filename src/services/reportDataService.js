import { supabase } from '../core/services/supabase'

// IBPI 척도 정보
const SCALE_INFO = {
  mainScales: {
    co: { name: '협조성', fullName: 'Cooperation' },
    cl: { name: '근접성', fullName: 'Closeness' },
    ob: { name: '순종성', fullName: 'Obedience' },
    gu: { name: '지도성', fullName: 'Guidance' },
    sd: { name: '자기신뢰', fullName: 'Self-Dependence' }
  },
  subScales: {
    co1: { name: '화합', parent: 'co' },
    co2: { name: '양보', parent: 'co' },
    co3: { name: '이타', parent: 'co' },
    co4: { name: '배려', parent: 'co' },
    cl1: { name: '친밀', parent: 'cl' },
    cl2: { name: '신뢰', parent: 'cl' },
    cl3: { name: '호감', parent: 'cl' },
    cl4: { name: '교류', parent: 'cl' },
    ob1: { name: '복종', parent: 'ob' },
    ob2: { name: '예의', parent: 'ob' },
    ob3: { name: '인내', parent: 'ob' },
    ob4: { name: '수용', parent: 'ob' },
    gu1: { name: '주도', parent: 'gu' },
    gu2: { name: '통제', parent: 'gu' },
    gu3: { name: '결단', parent: 'gu' },
    gu4: { name: '책임', parent: 'gu' },
    sd1: { name: '독립', parent: 'sd' },
    sd2: { name: '자존', parent: 'sd' },
    sd3: { name: '자신', parent: 'sd' },
    sd4: { name: '자율', parent: 'sd' }
  }
}

export const reportDataService = {
  // 보고서에 필요한 모든 데이터 조회
  async getReportData(customerId, testId) {
    try {
      console.log('보고서 데이터 조회 시작:', { customerId, testId })

      // 병렬로 모든 데이터 조회
      const [
        customerInfo,
        testResult,
        finalScores,
        interpretation
      ] = await Promise.all([
        this.getCustomerInfo(customerId),
        this.getTestResult(customerId, testId),
        this.getFinalScores(customerId, testId),
        this.getInterpretation(customerId, testId)
      ])

      // 백분위 및 T점수 계산
      const scoresWithStats = await this.calculateScoreStatistics(
        finalScores,
        customerInfo.standard_group || 'adult'
      )

      // 그룹 데이터 조회
      const groupData = await this.getGroupData(customerInfo.standard_group || 'adult')

      return {
        customerInfo,
        testInfo: {
          testId,
          testDate: testResult?.created_at || new Date().toISOString(),
          testType: customerInfo.test_type,
          duration: testResult?.duration
        },
        scores: scoresWithStats,
        groupData,
        interpretation: interpretation || this.generateDefaultInterpretation(scoresWithStats)
      }
    } catch (error) {
      console.error('보고서 데이터 조회 오류:', error)
      throw error
    }
  },

  // 고객 정보 조회
  async getCustomerInfo(customerId) {
    const { data, error } = await supabase
      .from('customer_info')
      .select(`
        id,
        name,
        gender,
        birth_date,
        test_type,
        standard_group,
        institution1,
        institution2,
        org_number
      `)
      .eq('id', customerId)
      .single()

    if (error) throw error
    
    // 나이 계산
    const birthDate = new Date(data.birth_date)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return { ...data, age }
  },

  // 검사 결과 조회
  async getTestResult(customerId, testId) {
    const { data, error } = await supabase
      .from('test_responses')
      .select('*')
      .eq('customer_id', customerId)
      .eq('id', testId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // 최종 점수 조회
  async getFinalScores(customerId, testId) {
    const { data, error } = await supabase
      .from('final_scores')
      .select(`
        co_original, cl_original, ob_original, gu_original, sd_original,
        co1_original, co2_original, co3_original, co4_original,
        cl1_original, cl2_original, cl3_original, cl4_original,
        ob1_original, ob2_original, ob3_original, ob4_original,
        gu1_original, gu2_original, gu3_original, gu4_original,
        sd1_original, sd2_original, sd3_original, sd4_original
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('최종 점수 조회 오류:', error)
      // 오류 시 기본값 반환
      return this.generateMockScores()
    }

    return data
  },

  // 점수 통계 계산 (백분위, T점수)
  async calculateScoreStatistics(scores, standardGroup) {
    const result = {
      mainScales: {},
      subScales: {}
    }

    // 주척도 통계
    for (const scale of ['co', 'cl', 'ob', 'gu', 'sd']) {
      const originalScore = scores[`${scale}_original`]
      const stats = await this.getScaleStatistics(scale, originalScore, standardGroup)
      
      result.mainScales[scale] = {
        originalScore,
        percentile: stats?.percentile || 50,
        tScore: stats?.t_score || 50,
        ...SCALE_INFO.mainScales[scale]
      }
    }

    // 하위척도 통계
    for (const scale of Object.keys(SCALE_INFO.subScales)) {
      const originalScore = scores[`${scale}_original`]
      if (originalScore !== null && originalScore !== undefined) {
        // 하위척도는 간단한 백분위 계산
        const percentile = this.calculatePercentile(
          originalScore,
          50, // 평균값 (실제로는 DB에서 가져와야 함)
          10  // 표준편차 (실제로는 DB에서 가져와야 함)
        )
        
        result.subScales[scale] = {
          originalScore,
          percentile,
          tScore: Math.round(50 + (percentile - 50) / 5), // 간단한 T점수 변환
          ...SCALE_INFO.subScales[scale]
        }
      }
    }

    return result
  },

  // 척도별 통계 정보 조회
  async getScaleStatistics(scaleName, originalScore, standardGroup) {
    const { data, error } = await supabase
      .from('rulebook_scores')
      .select('percentile, t_score')
      .eq('scale_name', scaleName)
      .eq('standard_group', standardGroup)
      .eq('original_score', originalScore)
      .single()

    if (error) {
      console.warn(`척도 통계 조회 실패 (${scaleName}):`, error)
      return null
    }

    return data
  },

  // 그룹 데이터 조회
  async getGroupData(standardGroup) {
    try {
      const [averages, deviations] = await Promise.all([
        supabase
          .from('group_averages')
          .select('*')
          .eq('standard_group', standardGroup)
          .single(),
        supabase
          .from('group_deviations')
          .select('*')
          .eq('standard_group', standardGroup)
          .single()
      ])

      return {
        averages: averages.data,
        deviations: deviations.data
      }
    } catch (error) {
      console.warn('그룹 데이터 조회 실패:', error)
      return { averages: null, deviations: null }
    }
  },

  // 해석 조회
  async getInterpretation(customerId, testId) {
    const { data, error } = await supabase
      .from('test_interpretations')
      .select('*')
      .eq('customer_id', customerId)
      .eq('test_id', testId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.warn('해석 조회 실패:', error)
    }

    return data
  },

  // 백분위 계산 (정규분포 기반)
  calculatePercentile(score, mean, stdDev) {
    if (stdDev === 0) return 50
    
    const zScore = (score - mean) / stdDev
    const percentile = this.normalCDF(zScore) * 100
    
    return Math.round(Math.max(1, Math.min(99, percentile)))
  },

  // 표준정규분포의 누적분포함수
  normalCDF(z) {
    const t = 1 / (1 + 0.2316419 * Math.abs(z))
    const d = 0.3989423 * Math.exp(-z * z / 2)
    const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
    
    return z > 0 ? 1 - probability : probability
  },

  // 기본 해석 생성
  generateDefaultInterpretation(scores) {
    const mainScales = scores.mainScales
    
    // 가장 높은 점수와 낮은 점수 찾기
    let highest = { scale: '', score: 0 }
    let lowest = { scale: '', score: 100 }
    
    for (const [scale, data] of Object.entries(mainScales)) {
      if (data.percentile > highest.score) {
        highest = { scale, score: data.percentile }
      }
      if (data.percentile < lowest.score) {
        lowest = { scale, score: data.percentile }
      }
    }

    return {
      summary: `검사 결과, ${mainScales[highest.scale].name} 영역이 가장 높게 나타났으며, ${mainScales[lowest.scale].name} 영역이 상대적으로 낮게 나타났습니다.`,
      strengths: [`${mainScales[highest.scale].name} 영역에서 우수한 능력을 보이고 있습니다.`],
      recommendations: [`${mainScales[lowest.scale].name} 영역의 발달을 위한 활동을 권장합니다.`]
    }
  },

  // 모의 점수 생성 (개발용)
  generateMockScores() {
    const scores = {}
    
    // 주척도
    for (const scale of ['co', 'cl', 'ob', 'gu', 'sd']) {
      scores[`${scale}_original`] = Math.floor(Math.random() * 30) + 20
    }
    
    // 하위척도
    for (const scale of Object.keys(SCALE_INFO.subScales)) {
      scores[`${scale}_original`] = Math.floor(Math.random() * 10) + 5
    }
    
    return scores
  }
}
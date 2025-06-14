// Mock data for testing report functionality

export const mockCustomerInfo = {
  id: 'test-customer-123',
  name: '홍길동',
  gender: 'male',
  birth_date: '2010-05-15',
  test_type: 'youth',
  standard_group: 'youth',
  institution1: '서울중학교',
  institution2: '2학년',
  org_number: 'ORG123',
  age: 14
}

export const mockTestResult = {
  id: 'test-result-456',
  customer_id: 'test-customer-123',
  created_at: '2025-01-13T10:30:00Z',
  duration: 1800, // 30 minutes in seconds
  responses: {
    q1: 4,
    q2: 3,
    q3: 5,
    // ... more responses
  }
}

export const mockFinalScores = {
  // 주척도 원점수
  co_original: 45,
  cl_original: 52,
  ob_original: 38,
  gu_original: 48,
  sd_original: 41,
  
  // 하위척도 원점수
  co1_original: 12,
  co2_original: 11,
  co3_original: 10,
  co4_original: 12,
  cl1_original: 14,
  cl2_original: 13,
  cl3_original: 12,
  cl4_original: 13,
  ob1_original: 9,
  ob2_original: 10,
  ob3_original: 10,
  ob4_original: 9,
  gu1_original: 12,
  gu2_original: 13,
  gu3_original: 11,
  gu4_original: 12,
  sd1_original: 10,
  sd2_original: 11,
  sd3_original: 10,
  sd4_original: 10
}

export const mockScoresWithStats = {
  mainScales: {
    co: {
      originalScore: 45,
      percentile: 65,
      tScore: 55,
      name: '협조성',
      fullName: 'Cooperation'
    },
    cl: {
      originalScore: 52,
      percentile: 78,
      tScore: 60,
      name: '근접성',
      fullName: 'Closeness'
    },
    ob: {
      originalScore: 38,
      percentile: 42,
      tScore: 47,
      name: '순종성',
      fullName: 'Obedience'
    },
    gu: {
      originalScore: 48,
      percentile: 70,
      tScore: 57,
      name: '지도성',
      fullName: 'Guidance'
    },
    sd: {
      originalScore: 41,
      percentile: 50,
      tScore: 50,
      name: '자기신뢰',
      fullName: 'Self-Dependence'
    }
  },
  subScales: {
    co1: { originalScore: 12, percentile: 68, tScore: 56, name: '화합', parent: 'co' },
    co2: { originalScore: 11, percentile: 60, tScore: 54, name: '양보', parent: 'co' },
    co3: { originalScore: 10, percentile: 55, tScore: 52, name: '이타', parent: 'co' },
    co4: { originalScore: 12, percentile: 68, tScore: 56, name: '배려', parent: 'co' },
    cl1: { originalScore: 14, percentile: 80, tScore: 62, name: '친밀', parent: 'cl' },
    cl2: { originalScore: 13, percentile: 75, tScore: 59, name: '신뢰', parent: 'cl' },
    cl3: { originalScore: 12, percentile: 70, tScore: 57, name: '호감', parent: 'cl' },
    cl4: { originalScore: 13, percentile: 75, tScore: 59, name: '교류', parent: 'cl' },
    ob1: { originalScore: 9, percentile: 40, tScore: 46, name: '복종', parent: 'ob' },
    ob2: { originalScore: 10, percentile: 45, tScore: 48, name: '예의', parent: 'ob' },
    ob3: { originalScore: 10, percentile: 45, tScore: 48, name: '인내', parent: 'ob' },
    ob4: { originalScore: 9, percentile: 40, tScore: 46, name: '수용', parent: 'ob' },
    gu1: { originalScore: 12, percentile: 68, tScore: 56, name: '주도', parent: 'gu' },
    gu2: { originalScore: 13, percentile: 73, tScore: 58, name: '통제', parent: 'gu' },
    gu3: { originalScore: 11, percentile: 62, tScore: 54, name: '결단', parent: 'gu' },
    gu4: { originalScore: 12, percentile: 68, tScore: 56, name: '책임', parent: 'gu' },
    sd1: { originalScore: 10, percentile: 50, tScore: 50, name: '독립', parent: 'sd' },
    sd2: { originalScore: 11, percentile: 55, tScore: 52, name: '자존', parent: 'sd' },
    sd3: { originalScore: 10, percentile: 50, tScore: 50, name: '자신', parent: 'sd' },
    sd4: { originalScore: 10, percentile: 50, tScore: 50, name: '자율', parent: 'sd' }
  }
}

export const mockGroupData = {
  averages: {
    standard_group: 'youth',
    co_avg: 42.5,
    cl_avg: 45.3,
    ob_avg: 40.2,
    gu_avg: 43.8,
    sd_avg: 41.0
  },
  deviations: {
    standard_group: 'youth',
    co_sd: 8.2,
    cl_sd: 9.1,
    ob_sd: 7.5,
    gu_sd: 8.8,
    sd_sd: 8.0
  }
}

export const mockInterpretation = {
  summary: '검사 결과, 근접성 영역이 가장 높게 나타났으며, 순종성 영역이 상대적으로 낮게 나타났습니다.',
  strengths: [
    '근접성 영역에서 우수한 능력을 보이고 있습니다.',
    '타인과의 친밀한 관계 형성에 강점이 있습니다.',
    '지도성 영역도 평균 이상의 수준을 보입니다.'
  ],
  recommendations: [
    '순종성 영역의 발달을 위한 활동을 권장합니다.',
    '규칙 준수와 타인의 의견 수용 연습이 필요합니다.',
    '자기신뢰 향상을 위한 자기 표현 활동을 추천합니다.'
  ],
  detailed_analysis: {
    co: '협조성은 평균보다 높은 수준으로, 타인과의 협력적 관계를 잘 유지할 수 있습니다.',
    cl: '근접성이 매우 높게 나타나 친밀한 대인관계 형성에 강점이 있습니다.',
    ob: '순종성이 다소 낮아 규칙 준수나 권위 수용에 어려움이 있을 수 있습니다.',
    gu: '지도성이 높은 편으로 리더십 발휘 가능성이 있습니다.',
    sd: '자기신뢰는 평균 수준으로 균형잡힌 모습을 보입니다.'
  }
}

export const mockReportData = {
  customerInfo: mockCustomerInfo,
  testInfo: {
    testId: 'test-result-456',
    testDate: '2025-01-13T10:30:00Z',
    testType: 'youth',
    duration: 1800
  },
  scores: mockScoresWithStats,
  groupData: mockGroupData,
  interpretation: mockInterpretation
}

// Mock Supabase responses
export const mockSupabaseResponses = {
  customerInfo: {
    data: mockCustomerInfo,
    error: null
  },
  testResult: {
    data: mockTestResult,
    error: null
  },
  finalScores: {
    data: mockFinalScores,
    error: null
  },
  scaleStatistics: {
    co: { data: { percentile: 65, t_score: 55 }, error: null },
    cl: { data: { percentile: 78, t_score: 60 }, error: null },
    ob: { data: { percentile: 42, t_score: 47 }, error: null },
    gu: { data: { percentile: 70, t_score: 57 }, error: null },
    sd: { data: { percentile: 50, t_score: 50 }, error: null }
  },
  groupAverages: {
    data: mockGroupData.averages,
    error: null
  },
  groupDeviations: {
    data: mockGroupData.deviations,
    error: null
  },
  interpretation: {
    data: mockInterpretation,
    error: null
  }
}

// Error scenarios
export const mockErrorResponses = {
  customerNotFound: {
    data: null,
    error: {
      code: 'PGRST116',
      message: 'Customer not found',
      details: 'The requested customer ID does not exist'
    }
  },
  databaseConnectionError: {
    data: null,
    error: {
      code: 'CONNECTION_ERROR',
      message: 'Unable to connect to database',
      details: 'Network error or database is down'
    }
  },
  unauthorizedAccess: {
    data: null,
    error: {
      code: '401',
      message: 'Unauthorized',
      details: 'Invalid authentication credentials'
    }
  }
}
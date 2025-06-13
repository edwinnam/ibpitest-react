/**
 * IBPI 채점 서비스
 * 검사 응답을 바탕으로 점수를 계산하는 로직
 */

// 역문항 정의
const reverseItems = {
  adult: [47, 87],
  youth: [4, 44, 49, 82],
  child: [2, 40, 49, 71, 76]
}

// 타당도 문항 정의
const validityItems = {
  adult: { 7: 3, 35: 2, 58: 1, 94: 4 },
  youth: { 7: 3, 35: 2, 66: 1, 87: 4 },
  child: { 7: 3, 39: 2, 66: 1, 86: 4 }
}

// 코드 맵 정의 (각 요인별 문항 번호)
const personalityCodeMap = {
  adult: {
    CL1: [12, 52, 101],
    CL2: [2, 34, 63, 82],
    CL3: [22, 28, 42, 65, 68, 85, 91, 106],
    CL4: [16, 38, 57, 74],
    CO1: [17, 48, 75, 99],
    CO2: [8, 19, 81, 96],
    CO3: [46, 77, 88],
    CO4: [3, 13, 59, 64],
    GU1: [14, 39, 93],
    GU2: [0, 24, 29, 31, 37, 40, 44, 50, 54, 61, 67],
    GU3: [18, 45, 97, 104],
    GU4: [6, 27, 32, 51, 69, 72, 78, 84],
    GU5: [25, 55, 102],
    GU6: [21, 89],
    OB1: [1, 15, 33, 43, 62],
    OB2: [9, 70, 83, 105],
    OB3: [5, 56, 73, 86, 95],
    SD1: [4, 11, 20, 36, 60],
    SD2: [53, 66, 92],
    SD3: [23, 41, 79, 90],
    SD4: [47, 87],
    SD5: [10, 26, 30, 49, 71, 76, 80, 98, 100, 103],
    VAL1: [7, 35, 58, 94],
  },
  youth: {
    CL1: [52, 59, 73, 100],
    CL2: [12, 16, 36, 55, 63, 79, 91, 96],
    CL3: [3, 44, 82],
    CL4: [27, 65, 69, 102],
    CO1: [4, 11, 37, 50, 94],
    CO2: [8, 48, 84],
    CO3: [31, 74],
    CO4: [13, 19, 64, 78],
    GU1: [33, 76],
    GU2: [0, 23, 28, 32, 38, 46, 53],
    GU3: [14, 18, 41, 89, 93],
    GU4: [26, 42, 54, 56, 61, 68, 71, 81, 101],
    GU5: [1, 21, 24, 40, 47, 57, 85, 97],
    OB1: [2, 6, 9, 58, 80, 90, 99],
    OB2: [5, 15, 34, 45, 62],
    OB3: [30, 72, 83],
    SD1: [20, 39],
    SD2: [22, 43, 67, 88],
    SD3: [49],
    SD4: [17, 51, 92, 95],
    SD5: [10, 25, 29, 60, 70, 75, 77, 86, 98],
    VAL1: [7, 35, 66, 87],
  },
  child: {
    CL1: [17, 61, 93],
    CL2: [11, 30, 45, 52, 68, 81, 89],
    CL3: [2, 49, 71],
    CL4: [54, 56, 77],
    CO1: [12, 16, 38, 50, 91],
    CO2: [8, 47, 79],
    CO3: [27, 69],
    CO4: [13, 58, 73],
    GU1: [31, 44],
    GU2: [0, 22, 32, 43],
    GU3: [14, 18, 35, 82, 85],
    GU4: [1, 25, 36, 41, 48, 53, 55, 63, 74, 92],
    GU5: [23, 37, 46, 51, 67, 80, 88],
    OB1: [5, 9, 60, 75, 83, 94],
    OB2: [6, 15, 33, 59],
    OB3: [28, 65, 76],
    SD1: [20, 34],
    SD2: [21, 64, 84],
    SD3: [40],
    SD4: [4, 70, 87, 90],
    SD5: [10, 24, 26, 29, 57, 62, 72, 78],
    VAL1: [3, 7, 39, 66, 86],
  }
}

// 요인 그룹 정의
const factorGroups = {
  adult: {
    CL: ['CL1', 'CL2', 'CL3', 'CL4'],
    CO: ['CO1', 'CO2', 'CO3', 'CO4'],
    GU: ['GU1', 'GU2', 'GU3', 'GU4', 'GU5', 'GU6'],
    OB: ['OB1', 'OB2', 'OB3'],
    SD: ['SD1', 'SD2', 'SD3', 'SD4', 'SD5'],
    VAL: ['VAL1']
  },
  youth: {
    CL: ['CL1', 'CL2', 'CL3', 'CL4'],
    CO: ['CO1', 'CO2', 'CO3', 'CO4'],
    GU: ['GU1', 'GU2', 'GU3', 'GU4', 'GU5'],
    OB: ['OB1', 'OB2', 'OB3'],
    SD: ['SD1', 'SD2', 'SD3', 'SD4', 'SD5'],
    VAL: ['VAL1']
  },
  child: {
    CL: ['CL1', 'CL2', 'CL3', 'CL4'],
    CO: ['CO1', 'CO2', 'CO3', 'CO4'],
    GU: ['GU1', 'GU2', 'GU3', 'GU4', 'GU5'],
    OB: ['OB1', 'OB2', 'OB3'],
    SD: ['SD1', 'SD2', 'SD3', 'SD4', 'SD5'],
    VAL: ['VAL1']
  }
}


/**
 * 타당도 검사 및 역채점 처리
 * @param {number} choice 선택한 답변 (0-3)
 * @param {number} questionNumber 문항 번호 (1-based)
 * @param {string} testType 검사 유형
 * @returns {number} 처리된 점수
 */
function processScore(choice, questionNumber, testType) {
  if (choice === null || choice === undefined || choice === -1) {
    return 0
  }

  // 라디오 버튼 값을 점수로 변환 (0-3 -> 1-4)
  let score = choice + 1

  // 타당도 문항 처리
  const validity = validityItems[testType]
  if (validity && validity[questionNumber]) {
    return score === validity[questionNumber] ? 0 : 1
  }

  // 역문항 처리
  if (reverseItems[testType] && reverseItems[testType].includes(questionNumber)) {
    score = 5 - score
  }

  return score
}


/**
 * 검사 응답을 바탕으로 점수 계산
 * @param {Array} answers 응답 배열 (0-3 또는 null)
 * @param {string} testType 검사 유형 ('adult', 'youth', 'child')
 * @returns {Object} 계산된 점수
 */
export function calculateScores(answers, testType) {
  const codeMap = personalityCodeMap[testType]
  const groups = factorGroups[testType]
  
  if (!codeMap || !groups) {
    throw new Error(`지원하지 않는 검사 유형: ${testType}`)
  }

  // 1. 각 문항별 점수 계산
  const processedScores = answers.map((answer, index) => 
    processScore(answer, index + 1, testType)
  )

  // 2. 코드별 점수 계산
  const codeScores = {}
  for (const [code, items] of Object.entries(codeMap)) {
    let sum = 0
    let count = 0
    
    for (const itemIndex of items) {
      if (itemIndex < processedScores.length) {
        sum += processedScores[itemIndex]
        count++
      }
    }
    
    codeScores[code] = {
      raw: sum,
      average: count > 0 ? sum / count : 0,
      count: count
    }
  }

  // 3. 요인별 점수 계산
  const factorScores = {}
  for (const [factor, codes] of Object.entries(groups)) {
    let totalRaw = 0
    let totalCount = 0
    
    for (const code of codes) {
      if (codeScores[code]) {
        totalRaw += codeScores[code].raw
        totalCount += codeScores[code].count
      }
    }
    
    factorScores[factor] = {
      raw: totalRaw,
      average: totalCount > 0 ? totalRaw / totalCount : 0
    }
  }

  // 4. 타당도 점수 계산
  const validityScore = codeScores.VAL1 ? codeScores.VAL1.raw : 0

  // 5. 전체 점수 계산
  const totalRaw = Object.values(factorScores)
    .filter(score => score.raw !== undefined)
    .reduce((sum, score) => sum + score.raw, 0)

  // 6. 해석 생성
  const interpretation = generateInterpretation(factorScores, validityScore, testType)

  return {
    total_score: totalRaw,
    validity_score: validityScore,
    cl_raw: factorScores.CL?.raw || 0,
    co_raw: factorScores.CO?.raw || 0,
    gu_raw: factorScores.GU?.raw || 0,
    ob_raw: factorScores.OB?.raw || 0,
    sd_raw: factorScores.SD?.raw || 0,
    code_scores: codeScores,
    factor_scores: factorScores,
    interpretation: interpretation
  }
}

/**
 * 해석 생성
 * @param {Object} factorScores 요인별 점수
 * @param {number} validityScore 타당도 점수
 * @param {string} testType 검사 유형
 * @returns {string} 해석 텍스트
 */
function generateInterpretation(factorScores, validityScore, testType) {
  // 타당도 검사
  if (validityScore > 2) {
    return '주의: 타당도 점수가 높아 검사 결과의 신뢰성이 낮을 수 있습니다.'
  }

  // 각 요인별 해석
  const interpretations = []
  
  for (const [factor, score] of Object.entries(factorScores)) {
    if (factor === 'VAL') continue // 타당도는 제외
    
    const rawScore = score.raw
    const factorName = getFactorName(factor)
    interpretations.push(`${factorName}: ${rawScore}점`)
  }

  return interpretations.join(', ')
}

/**
 * 요인 이름 가져오기
 * @param {string} factor 요인 코드
 * @returns {string} 요인 이름
 */
function getFactorName(factor) {
  const names = {
    CL: '친밀성',
    CO: '협동성',
    GU: '포기',
    OB: '의무감',
    SD: '자기발전'
  }
  return names[factor] || factor
}
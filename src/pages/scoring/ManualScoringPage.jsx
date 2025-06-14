import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../modules/auth/AuthContext'
import { useOrganization } from '../../modules/organization/OrganizationContext'
import { supabase } from '../../core/services/supabase'
import { getNextCustomerNumber } from '../../core/services/customerNumberGenerator'
import { calculateScores } from '../../core/services/scoringService'
import './ManualScoringPage.css'

// 규준집단 옵션 정의
const standardGroupOptions = {
  adult: [
    { value: 'adult_general', label: '성인 일반' },
    { value: 'adult_20s', label: '성인 20대' },
    { value: 'adult_30s', label: '성인 30대' },
    { value: 'adult_40plus', label: '성인 40대 이상' }
  ],
  youth: [
    { value: 'youth', label: '청소년' }
  ],
  child: [
    { value: 'child', label: '어린이' },
    { value: 'child_3to5', label: '어린이 3~5세' },
    { value: 'child_6to8', label: '어린이 6~8세' },
    { value: 'child_9to12', label: '어린이 9~12세' }
  ]
}

// 검사 문항 수
const questionCounts = {
  adult: 107,
  youth: 103,
  child: 95
}

const ManualScoringPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getOrgNumber, getOrgName } = useOrganization()
  
  const [currentStep, setCurrentStep] = useState(1) // 1: 검사유형 선택, 2: 고객정보, 3: 답안입력
  const [testType, setTestType] = useState('')
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    gender: '',
    personalNumber: '',
    organization1: '',
    organization2: '',
    email: '',
    smartphone: '',
    year: '',
    month: '',
    day: '',
    testDate: new Date().toISOString().split('T')[0],
    standardGroup: ''
  })
  const [answers, setAnswers] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const answerFormRef = useRef(null)

  // 초기화
  useEffect(() => {
    if (testType && questionCounts[testType]) {
      setAnswers(new Array(questionCounts[testType]).fill(null))
      setCurrentQuestionIndex(0)
    }
  }, [testType])

  // 키보드 이벤트 처리
  useEffect(() => {
    if (currentStep === 3) {
      const handleKeyPress = (e) => {
        const key = e.key
        if (['1', '2', '3', '4'].includes(key)) {
          e.preventDefault()
          const value = parseInt(key) - 1 // 0-3으로 변환
          handleAnswerSelect(currentQuestionIndex, value)
        }
      }

      window.addEventListener('keydown', handleKeyPress)
      return () => window.removeEventListener('keydown', handleKeyPress)
    }
  }, [currentStep, currentQuestionIndex, answers])

  // 생년월일 옵션 생성
  const generateDateOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let year = currentYear; year >= currentYear - 100; year--) {
      years.push(year)
    }

    const months = Array.from({ length: 12 }, (_, i) => i + 1)
    
    const getDaysInMonth = (year, month) => {
      return new Date(year, month, 0).getDate()
    }

    const days = customerInfo.year && customerInfo.month
      ? Array.from({ length: getDaysInMonth(customerInfo.year, customerInfo.month) }, (_, i) => i + 1)
      : Array.from({ length: 31 }, (_, i) => i + 1)

    return { years, months, days }
  }

  // 고객정보 유효성 검사
  const validateCustomerInfo = () => {
    const required = ['name', 'gender', 'email', 'smartphone', 'year', 'month', 'day', 'testDate', 'standardGroup']
    for (const field of required) {
      if (!customerInfo[field]) {
        alert(`필수 항목을 모두 입력해주세요.`)
        return false
      }
    }
    
    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerInfo.email)) {
      alert('올바른 이메일 형식을 입력해주세요.')
      return false
    }

    // 전화번호 형식 검사
    const phoneRegex = /^[0-9]{3}-[0-9]{4}-[0-9]{4}$/
    if (!phoneRegex.test(customerInfo.smartphone)) {
      alert('전화번호는 000-0000-0000 형식으로 입력해주세요.')
      return false
    }

    return true
  }

  // 답안 선택 처리
  const handleAnswerSelect = (questionIndex, value) => {
    const newAnswers = [...answers]
    newAnswers[questionIndex] = value
    setAnswers(newAnswers)

    // 자동으로 다음 문항으로 이동
    if (questionIndex < answers.length - 1) {
      setCurrentQuestionIndex(questionIndex + 1)
      
      // 스크롤 처리
      setTimeout(() => {
        const nextQuestion = document.querySelector(`[data-question-index="${questionIndex + 1}"]`)
        if (nextQuestion) {
          const container = answerFormRef.current
          const questionTop = nextQuestion.offsetTop
          const containerHeight = container.clientHeight
          const scrollTop = questionTop - containerHeight / 2
          
          container.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          })
        }
      }, 100)
    }
  }

  // 저장 처리
  const handleSave = async () => {
    // 미응답 문항 확인
    const unansweredCount = answers.filter(a => a === null).length
    if (unansweredCount > 0) {
      if (!confirm(`${unansweredCount}개의 미응답 문항이 있습니다. 계속하시겠습니까?`)) {
        return
      }
    }

    setIsSaving(true)
    try {
      const orgNumber = getOrgNumber()
      const customerNumber = await getNextCustomerNumber()
      
      // 생년월일 조합
      const birthDate = `${customerInfo.year}-${String(customerInfo.month).padStart(2, '0')}-${String(customerInfo.day).padStart(2, '0')}`
      
      // 고객 정보 저장
      const { data: savedCustomer, error: customerError } = await supabase
        .from('customers_info')
        .insert({
          customer_number: customerNumber,
          org_number: orgNumber,
          name: customerInfo.name,
          gender: customerInfo.gender,
          birth_date: birthDate,
          email: customerInfo.email,
          phone: customerInfo.smartphone,
          test_type: testType === 'adult' ? 'IBPI 성인용' : testType === 'youth' ? 'IBPI 청소년용' : 'IBPI 어린이용',
          test_method: 'offline',
          test_date: customerInfo.testDate,
          standard_group: customerInfo.standardGroup,
          personal_id: customerInfo.personalNumber || null,
          organization1: customerInfo.organization1 || null,
          organization2: customerInfo.organization2 || null,
          is_test_completed: true,
          is_test_done: true,
          is_test_started: true,
          is_code_used: true,
          is_code_sent: true,
          is_scored: false,
          access_count: 1,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (customerError) throw customerError

      // 답안을 test_scores 테이블에 저장 (원본 구조와 동일)
      const answersObject = {}
      answers.forEach((answer, index) => {
        if (answer !== null && answer !== undefined) {
          answersObject[index] = answer
        }
      })

      const { error: testScoresError } = await supabase
        .from('test_scores')
        .insert({
          customer_id: savedCustomer.id,
          customer_number: customerNumber,
          org_number: orgNumber,
          name: customerInfo.name,
          test_type: savedCustomer.test_type,
          test_code: null, // 오프라인 채점이므로 코드 없음
          scores: answersObject, // JSONB 형식으로 저장
          total_questions: answers.length,
          answered_questions: answers.filter(a => a !== null).length,
          created_at: new Date().toISOString()
        })

      if (testScoresError) throw testScoresError

      // 채점 처리
      const scores = calculateScoresWrapper(answers, testType)
      
      // test_results 테이블에 결과 저장
      const { error: resultError } = await supabase
        .from('test_results')
        .insert({
          customer_id: savedCustomer.id,
          customer_number: customerNumber,
          org_number: orgNumber,
          test_type: savedCustomer.test_type,
          total_score: scores.total_score,
          validity_score: scores.validity_score,
          cl_score: scores.cl_raw,
          co_score: scores.co_raw,
          gu_score: scores.gu_raw,
          ob_score: scores.ob_raw,
          sd_score: scores.sd_raw,
          interpretation: scores.interpretation,
          created_at: new Date().toISOString()
        })

      if (resultError) throw resultError

      // final_scores 테이블에 상세 점수 저장
      // 1. 먼저 코드별 점수 추출
      const codeScores = scores.code_scores || {}
      
      // 2. final_scores 데이터 구성
      const finalScoresData = {
        customer_id: savedCustomer.id,
        customer_number: customerNumber,
        org_number: orgNumber,
        test_code: null, // 오프라인 채점이므로 코드 없음
        name: customerInfo.name,
        category: 'TOTAL',
        category_name: '전체 점수',
        parent_category: null,
        // JSONB 형식으로 전체 점수 데이터 저장
        scores: {
          raw: scores,
          categories: {
            CL: { raw: scores.cl_raw, codes: ['CL1', 'CL2', 'CL3', 'CL4'] },
            CO: { raw: scores.co_raw, codes: ['CO1', 'CO2', 'CO3', 'CO4'] },
            GU: { raw: scores.gu_raw, codes: ['GU1', 'GU2', 'GU3', 'GU4', 'GU5', 'GU6'] },
            OB: { raw: scores.ob_raw, codes: ['OB1', 'OB2', 'OB3'] },
            SD: { raw: scores.sd_raw, codes: ['SD1', 'SD2', 'SD3', 'SD4', 'SD5'] },
            VAL: { raw: scores.validity_score, codes: ['VAL1'] }
          },
          test_type: testType
        },
        // 개별 코드별 점수 컬럼들
        cl1: codeScores.CL1?.raw || 0,
        cl2: codeScores.CL2?.raw || 0,
        cl3: codeScores.CL3?.raw || 0,
        cl4: codeScores.CL4?.raw || 0,
        cl_total: scores.cl_raw || 0,
        co1: codeScores.CO1?.raw || 0,
        co2: codeScores.CO2?.raw || 0,
        co3: codeScores.CO3?.raw || 0,
        co4: codeScores.CO4?.raw || 0,
        co_total: scores.co_raw || 0,
        gu1: codeScores.GU1?.raw || 0,
        gu2: codeScores.GU2?.raw || 0,
        gu3: codeScores.GU3?.raw || 0,
        gu4: codeScores.GU4?.raw || 0,
        gu5: codeScores.GU5?.raw || 0,
        gu6: testType === 'adult' ? (codeScores.GU6?.raw || 0) : 0, // GU6는 성인만
        gu_total: scores.gu_raw || 0,
        ob1: codeScores.OB1?.raw || 0,
        ob2: codeScores.OB2?.raw || 0,
        ob3: codeScores.OB3?.raw || 0,
        ob_total: scores.ob_raw || 0,
        sd1: codeScores.SD1?.raw || 0,
        sd2: codeScores.SD2?.raw || 0,
        sd3: codeScores.SD3?.raw || 0,
        sd4: codeScores.SD4?.raw || 0,
        sd5: codeScores.SD5?.raw || 0,
        sd_total: scores.sd_raw || 0,
        val_total: scores.validity_score || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: finalScoresError } = await supabase
        .from('final_scores')
        .insert(finalScoresData)

      if (finalScoresError) throw finalScoresError

      // 고객 정보 업데이트 (채점 완료)
      const { error: updateError } = await supabase
        .from('customers_info')
        .update({
          is_scored: true,
          is_test_done: true,
          is_test_completed: true,
          scored_at: new Date().toISOString(),
          test_completed_at: new Date().toISOString()
        })
        .eq('id', savedCustomer.id)

      if (updateError) throw updateError

      alert('채점이 완료되었습니다.')
      navigate('/test-results')
    } catch (error) {
      console.error('저장 오류:', error)
      alert(`저장 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  // 점수 계산 래퍼 함수
  const calculateScoresWrapper = (answers, testType) => {
    try {
      const scores = calculateScores(answers, testType)
      
      // 데이터베이스 저장용 형식으로 변환
      return {
        total_score: scores.total_score,
        validity_score: scores.validity_score,
        cl_raw: scores.cl_raw,
        co_raw: scores.co_raw,
        gu_raw: scores.gu_raw,
        ob_raw: scores.ob_raw,
        sd_raw: scores.sd_raw,
        interpretation: scores.interpretation,
        code_scores: scores.code_scores,
        factor_scores: scores.factor_scores
      }
    } catch (error) {
      console.error('채점 오류:', error)
      throw error
    }
  }

  // 렌더링
  if (currentStep === 1) {
    return (
      <div className="manual-scoring-page">
        <div className="page-header">
          <h1>IBPI 검사 채점 시스템</h1>
          <p className="page-subtitle">직접 답안을 입력하여 채점합니다</p>
        </div>

        <div className="step-indicator">
          <div className="step active">1단계: 검사유형 선택</div>
          <div className="step">2단계: 고객정보입력</div>
          <div className="step">3단계: 답안입력</div>
        </div>

        <div className="test-type-selection">
          <h3>채점표를 선택하세요</h3>
          <div className="test-type-buttons">
            <button
              className="test-type-btn adult"
              onClick={() => {
                setTestType('adult')
                setCurrentStep(2)
              }}
            >
              <i className="fas fa-user"></i>
              <span>IBPI 성인용</span>
              <small>107문항</small>
            </button>
            <button
              className="test-type-btn youth"
              onClick={() => {
                setTestType('youth')
                setCurrentStep(2)
              }}
            >
              <i className="fas fa-user-graduate"></i>
              <span>IBPI 청소년용</span>
              <small>103문항</small>
            </button>
            <button
              className="test-type-btn child"
              onClick={() => {
                setTestType('child')
                setCurrentStep(2)
              }}
            >
              <i className="fas fa-child"></i>
              <span>IBPI 어린이용</span>
              <small>95문항</small>
            </button>
          </div>
        </div>

        <div className="page-footer">
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            이전 페이지
          </button>
        </div>
      </div>
    )
  }

  if (currentStep === 2) {
    const { years, months, days } = generateDateOptions()

    return (
      <div className="manual-scoring-page">
        <div className="page-header">
          <h1>IBPI 검사 채점 시스템</h1>
          <p className="page-subtitle">직접 답안을 입력하여 채점합니다</p>
        </div>

        <div className="step-indicator">
          <div className="step completed">1단계: 검사유형 선택</div>
          <div className="step active">2단계: 고객정보입력</div>
          <div className="step">3단계: 답안입력</div>
        </div>

        <div className="customer-info-form">
          <h3>고객 정보를 입력하세요</h3>
          <form onSubmit={(e) => {
            e.preventDefault()
            if (validateCustomerInfo()) {
              setCurrentStep(3)
            }
          }}>
            <div className="form-row">
              <div className="form-group">
                <label>이름 *</label>
                <input
                  type="text"
                  className="form-control"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>성별 *</label>
                <select
                  className="form-control"
                  value={customerInfo.gender}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, gender: e.target.value })}
                  required
                >
                  <option value="">선택</option>
                  <option value="남">남</option>
                  <option value="여">여</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>개인고유번호</label>
                <input
                  type="text"
                  className="form-control"
                  value={customerInfo.personalNumber}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, personalNumber: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>소속기관 1</label>
                <input
                  type="text"
                  className="form-control"
                  value={customerInfo.organization1}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, organization1: e.target.value })}
                  placeholder={getOrgName() || ''}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>소속기관 2</label>
                <input
                  type="text"
                  className="form-control"
                  value={customerInfo.organization2}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, organization2: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>이메일 *</label>
                <input
                  type="email"
                  className="form-control"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>스마트폰 *</label>
                <input
                  type="tel"
                  className="form-control"
                  value={customerInfo.smartphone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    let formatted = value
                    if (value.length >= 7) {
                      formatted = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`
                    } else if (value.length >= 3) {
                      formatted = `${value.slice(0, 3)}-${value.slice(3)}`
                    }
                    setCustomerInfo({ ...customerInfo, smartphone: formatted })
                  }}
                  placeholder="010-0000-0000"
                  maxLength="13"
                  required
                />
              </div>
              <div className="form-group">
                <label>생년월일 *</label>
                <div className="date-selects">
                  <select
                    className="form-control"
                    value={customerInfo.year}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, year: e.target.value })}
                    required
                  >
                    <option value="">년도</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}년</option>
                    ))}
                  </select>
                  <select
                    className="form-control"
                    value={customerInfo.month}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, month: e.target.value })}
                    required
                  >
                    <option value="">월</option>
                    {months.map(month => (
                      <option key={month} value={month}>{month}월</option>
                    ))}
                  </select>
                  <select
                    className="form-control"
                    value={customerInfo.day}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, day: e.target.value })}
                    required
                  >
                    <option value="">일</option>
                    {days.map(day => (
                      <option key={day} value={day}>{day}일</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>검사일 *</label>
                <input
                  type="date"
                  className="form-control"
                  value={customerInfo.testDate}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, testDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>규준집단 *</label>
                <select
                  className="form-control"
                  value={customerInfo.standardGroup}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, standardGroup: e.target.value })}
                  required
                >
                  <option value="">선택</option>
                  {standardGroupOptions[testType]?.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn btn-secondary"
              >
                취소
              </button>
              <button type="submit" className="btn btn-primary">
                다음
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (currentStep === 3) {
    const totalQuestions = questionCounts[testType]
    const questionsPerGroup = 20
    const groupCount = Math.ceil(totalQuestions / questionsPerGroup)

    return (
      <div className="manual-scoring-page">
        <div className="page-header">
          <h1>IBPI 검사 채점 시스템</h1>
          <p className="page-subtitle">직접 답안을 입력하여 채점합니다</p>
        </div>

        <div className="step-indicator">
          <div className="step completed">1단계: 검사유형 선택</div>
          <div className="step completed">2단계: 고객정보입력</div>
          <div className="step active">3단계: 답안입력</div>
        </div>

        <div className="answer-input-section">
          <div className="customer-info-summary">
            <span>{customerInfo.name}</span>
            <span>{new Date().getFullYear() - parseInt(customerInfo.year) + 1}세</span>
            <span>{customerInfo.gender}</span>
            <span>검사일: {customerInfo.testDate}</span>
            <span>{customerInfo.organization1}</span>
            {customerInfo.organization2 && <span>{customerInfo.organization2}</span>}
            <span>{standardGroupOptions[testType]?.find(o => o.value === customerInfo.standardGroup)?.label}</span>
          </div>

          <div className="answer-form-container" ref={answerFormRef}>
            <div className="answer-form">
              {Array.from({ length: groupCount }).map((_, groupIndex) => {
                const startIndex = groupIndex * questionsPerGroup
                const endIndex = Math.min(startIndex + questionsPerGroup, totalQuestions)

                return (
                  <div key={groupIndex} className="question-group">
                    <div className="choices-header">
                      <div>1</div>
                      <div>2</div>
                      <div>3</div>
                      <div>4</div>
                    </div>
                    {Array.from({ length: endIndex - startIndex }).map((_, index) => {
                      const questionIndex = startIndex + index
                      const isCurrentQuestion = questionIndex === currentQuestionIndex

                      return (
                        <div
                          key={questionIndex}
                          className={`question-row ${isCurrentQuestion ? 'current' : ''}`}
                          data-question-index={questionIndex}
                        >
                          <div className={`question-number ${isCurrentQuestion ? 'active' : ''}`}>
                            {questionIndex + 1}
                          </div>
                          <div className="radio-group">
                            {[0, 1, 2, 3].map(value => (
                              <label key={value} className="radio-label">
                                <input
                                  type="radio"
                                  name={`question-${questionIndex}`}
                                  value={value}
                                  checked={answers[questionIndex] === value}
                                  onChange={() => handleAnswerSelect(questionIndex, value)}
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="answer-progress">
            <div className="progress">
              <div
                className="progress-bar"
                style={{ width: `${(answers.filter(a => a !== null).length / totalQuestions) * 100}%` }}
              />
            </div>
            <div className="progress-text">
              {answers.filter(a => a !== null).length} / {totalQuestions} 문항 완료
            </div>
          </div>

          <div className="form-actions">
            <button
              onClick={() => setCurrentStep(2)}
              className="btn btn-secondary"
            >
              이전
            </button>
            <div className="keyboard-hint">
              키보드의 숫자키 1, 2, 3, 4를 눌러 입력하세요
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  저장 중...
                </>
              ) : (
                '입력내용 저장'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default ManualScoringPage
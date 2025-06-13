import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../core/services/supabase'
import TestProgress from './components/TestProgress'
import TestQuestion from './components/TestQuestion'
import TestNavigation from './components/TestNavigation'
import './TestPage.css'

// 문항 데이터 import (실제로는 별도 파일로 분리)
import { adultQuestions } from '../../data/questions/adult'
import { youthQuestions } from '../../data/questions/youth'
import { childQuestions } from '../../data/questions/child'

const TestPage = () => {
  const navigate = useNavigate()
  const [customerInfo, setCustomerInfo] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState({})
  const [startTime, setStartTime] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  useEffect(() => {
    // 세션에서 고객 정보 확인
    const info = sessionStorage.getItem('customerInfo')
    if (!info) {
      navigate('/customer/login')
      return
    }
    
    const parsedInfo = JSON.parse(info)
    setCustomerInfo(parsedInfo)
    
    // 검사 유형에 따라 문항 로드
    loadQuestions(parsedInfo.testType)
    
    // 검사 시작 시간 기록
    setStartTime(new Date())
    
    // 페이지 이탈 방지
    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [navigate])

  const loadQuestions = (testType) => {
    switch (testType) {
      case '성인용':
        setQuestions(adultQuestions)
        break
      case '청소년용':
        setQuestions(youthQuestions)
        break
      case '아동용':
        setQuestions(childQuestions)
        break
      default:
        setQuestions(adultQuestions)
    }
  }

  const handleAnswer = (questionId, answer) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }))
    
    // 자동으로 다음 문항으로 이동 (마지막 문항이 아닌 경우)
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1)
      }, 300)
    }
  }

  const handleNavigation = (direction) => {
    if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    } else if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handleJumpToQuestion = (index) => {
    setCurrentQuestionIndex(index)
  }

  const calculateProgress = () => {
    const answeredCount = Object.keys(responses).length
    return Math.round((answeredCount / questions.length) * 100)
  }

  const handleSubmit = async () => {
    // 모든 문항에 응답했는지 확인
    const unansweredQuestions = questions.filter(q => !responses[q.id])
    
    if (unansweredQuestions.length > 0) {
      alert(`아직 응답하지 않은 문항이 ${unansweredQuestions.length}개 있습니다. 모든 문항에 응답해주세요.`)
      // 첫 번째 미응답 문항으로 이동
      const firstUnansweredIndex = questions.findIndex(q => !responses[q.id])
      setCurrentQuestionIndex(firstUnansweredIndex)
      return
    }

    if (!confirm('검사를 제출하시겠습니까? 제출 후에는 수정할 수 없습니다.')) {
      return
    }

    setSaving(true)

    try {
      // 검사 소요 시간 계산
      const endTime = new Date()
      const duration = Math.round((endTime - startTime) / 1000) // 초 단위

      // 응답 데이터 저장
      const { error: responseError } = await supabase
        .from('test_responses')
        .insert({
          customer_id: customerInfo.customerId,
          test_code: customerInfo.testCode,
          responses: responses,
          test_type: customerInfo.testType,
          completed_at: endTime.toISOString(),
          duration: duration
        })

      if (responseError) throw responseError

      // 고객 정보 업데이트
      const { error: updateError } = await supabase
        .from('customer_info')
        .update({
          is_test_completed: true,
          test_completed_at: endTime.toISOString(),
          test_duration: duration
        })
        .eq('id', customerInfo.customerId)

      if (updateError) throw updateError

      // used_codes 상태 업데이트
      const { error: codeError } = await supabase
        .from('used_codes')
        .update({
          status: '완료',
          completed_at: endTime.toISOString()
        })
        .eq('test_code', customerInfo.testCode)

      if (codeError) throw codeError

      // 완료 페이지로 이동
      navigate('/customer/test-complete')
    } catch (error) {
      console.error('검사 제출 오류:', error)
      alert('검사 제출 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  const handleExit = () => {
    setShowExitConfirm(true)
  }

  const confirmExit = () => {
    sessionStorage.removeItem('customerInfo')
    navigate('/customer/login')
  }

  if (!customerInfo || questions.length === 0) {
    return (
      <div className="test-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>검사를 준비하고 있습니다...</p>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const isFirstQuestion = currentQuestionIndex === 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const progress = calculateProgress()

  return (
    <div className="test-page">
      <div className="test-header">
        <div className="test-info">
          <h3>{customerInfo.name}님의 {customerInfo.testType} 검사</h3>
          <button className="btn-exit" onClick={handleExit}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <TestProgress 
          current={currentQuestionIndex + 1}
          total={questions.length}
          progress={progress}
        />
      </div>

      <div className="test-content">
        <TestQuestion
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          selectedAnswer={responses[currentQuestion.id]}
          onAnswer={handleAnswer}
        />

        <TestNavigation
          isFirstQuestion={isFirstQuestion}
          isLastQuestion={isLastQuestion}
          hasCurrentAnswer={!!responses[currentQuestion.id]}
          onPrevious={() => handleNavigation('prev')}
          onNext={() => handleNavigation('next')}
          onSubmit={handleSubmit}
          saving={saving}
        />

        {/* 문항 점프 네비게이션 */}
        <div className="question-jump-nav">
          <p className="text-muted mb-2">빠른 이동:</p>
          <div className="question-dots">
            {questions.map((q, index) => (
              <button
                key={q.id}
                className={`question-dot ${
                  index === currentQuestionIndex ? 'active' : ''
                } ${responses[q.id] ? 'answered' : ''}`}
                onClick={() => handleJumpToQuestion(index)}
                title={`문항 ${index + 1}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 종료 확인 모달 */}
      {showExitConfirm && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5>검사 종료</h5>
              </div>
              <div className="modal-body">
                <p>정말로 검사를 종료하시겠습니까?</p>
                <p className="text-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  지금까지의 응답은 저장되지 않으며, 처음부터 다시 시작해야 합니다.
                </p>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowExitConfirm(false)}
                >
                  계속하기
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={confirmExit}
                >
                  종료하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestPage
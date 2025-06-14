import './TestQuestion.css'

const TestQuestion = ({ 
  question, 
  questionNumber, 
  totalQuestions, 
  selectedAnswer, 
  onAnswer 
}) => {
  const answerOptions = [
    { value: 1, label: '전혀 그렇지 않다' },
    { value: 2, label: '그렇지 않다' },
    { value: 3, label: '보통이다' },
    { value: 4, label: '그렇다' },
    { value: 5, label: '매우 그렇다' }
  ]

  return (
    <div className="test-question">
      <div className="question-header">
        <span className="question-number">Q{questionNumber}</span>
        <span className="question-category">{question.category}</span>
      </div>

      <h2 className="question-text">{question.text}</h2>

      <div className="answer-options">
        {answerOptions.map(option => (
          <button
            key={option.value}
            className={`answer-option ${selectedAnswer === option.value ? 'selected' : ''}`}
            onClick={() => onAnswer(question.id, option.value)}
          >
            <span className="option-value">{option.value}</span>
            <span className="option-label">{option.label}</span>
          </button>
        ))}
      </div>

      {/* 모바일용 간단 옵션 */}
      <div className="answer-options-mobile">
        {answerOptions.map(option => (
          <button
            key={option.value}
            className={`answer-option-mobile ${selectedAnswer === option.value ? 'selected' : ''}`}
            onClick={() => onAnswer(question.id, option.value)}
            title={option.label}
          >
            {option.value}
          </button>
        ))}
      </div>
    </div>
  )
}

export default TestQuestion
import './TestNavigation.css'

const TestNavigation = ({
  isFirstQuestion,
  isLastQuestion,
  hasCurrentAnswer,
  onPrevious,
  onNext,
  onSubmit,
  saving
}) => {
  return (
    <div className="test-navigation">
      <button
        className="btn btn-secondary"
        onClick={onPrevious}
        disabled={isFirstQuestion}
      >
        <i className="fas fa-chevron-left me-2"></i>
        이전
      </button>

      {!isLastQuestion ? (
        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={!hasCurrentAnswer}
        >
          다음
          <i className="fas fa-chevron-right ms-2"></i>
        </button>
      ) : (
        <button
          className="btn btn-success"
          onClick={onSubmit}
          disabled={!hasCurrentAnswer || saving}
        >
          {saving ? (
            <>
              <i className="fas fa-spinner fa-spin me-2"></i>
              제출 중...
            </>
          ) : (
            <>
              <i className="fas fa-check me-2"></i>
              검사 완료
            </>
          )}
        </button>
      )}
    </div>
  )
}

export default TestNavigation
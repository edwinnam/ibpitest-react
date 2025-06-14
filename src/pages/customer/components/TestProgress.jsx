import './TestProgress.css'

const TestProgress = ({ current, total, progress }) => {
  return (
    <div className="test-progress">
      <div className="progress-info">
        <span className="progress-text">
          문항 <strong>{current}</strong> / {total}
        </span>
        <span className="progress-percentage">{progress}% 완료</span>
      </div>
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default TestProgress
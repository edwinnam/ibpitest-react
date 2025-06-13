import React from 'react'
import './ScoreTable.css'

const ScoreTable = ({ mainScales, subScales, showSubScales = true }) => {
  // 백분위에 따른 수준 판정
  const getLevel = (percentile) => {
    if (percentile >= 85) return { text: '매우 높음', class: 'very-high' }
    if (percentile >= 70) return { text: '높음', class: 'high' }
    if (percentile >= 30) return { text: '보통', class: 'normal' }
    if (percentile >= 15) return { text: '낮음', class: 'low' }
    return { text: '매우 낮음', class: 'very-low' }
  }

  // 하위척도를 주척도별로 그룹화
  const groupSubScales = () => {
    const grouped = {
      co: [], cl: [], ob: [], gu: [], sd: []
    }
    
    Object.entries(subScales).forEach(([key, data]) => {
      const parent = data.parent
      if (grouped[parent]) {
        grouped[parent].push({ key, ...data })
      }
    })
    
    return grouped
  }

  const groupedSubScales = groupSubScales()

  return (
    <div className="score-table-container">
      <table className="score-table">
        <thead>
          <tr>
            <th>척도</th>
            <th>원점수</th>
            <th>백분위</th>
            <th>T점수</th>
            <th>수준</th>
          </tr>
        </thead>
        <tbody>
          {/* 주척도 */}
          {Object.entries(mainScales).map(([key, data]) => {
            const level = getLevel(data.percentile)
            return (
              <React.Fragment key={key}>
                <tr className="main-scale-row">
                  <td className="scale-name">
                    <strong>{data.name}</strong>
                    <span className="scale-code">({key.toUpperCase()})</span>
                  </td>
                  <td className="score">{data.originalScore}</td>
                  <td className="percentile">{data.percentile}%</td>
                  <td className="t-score">{data.tScore}</td>
                  <td className="level">
                    <span className={`level-badge ${level.class}`}>
                      {level.text}
                    </span>
                  </td>
                </tr>
                
                {/* 하위척도 */}
                {showSubScales && groupedSubScales[key].map((subScale) => {
                  const subLevel = getLevel(subScale.percentile)
                  return (
                    <tr key={subScale.key} className="sub-scale-row">
                      <td className="scale-name sub-scale">
                        └ {subScale.name}
                      </td>
                      <td className="score">{subScale.originalScore}</td>
                      <td className="percentile">{subScale.percentile}%</td>
                      <td className="t-score">{subScale.tScore}</td>
                      <td className="level">
                        <span className={`level-badge ${subLevel.class} small`}>
                          {subLevel.text}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>

      {/* 수준 범례 */}
      <div className="score-legend">
        <h4>수준 기준</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="level-badge very-high small">매우 높음</span>
            <span>85% 이상</span>
          </div>
          <div className="legend-item">
            <span className="level-badge high small">높음</span>
            <span>70~84%</span>
          </div>
          <div className="legend-item">
            <span className="level-badge normal small">보통</span>
            <span>30~69%</span>
          </div>
          <div className="legend-item">
            <span className="level-badge low small">낮음</span>
            <span>15~29%</span>
          </div>
          <div className="legend-item">
            <span className="level-badge very-low small">매우 낮음</span>
            <span>14% 이하</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScoreTable
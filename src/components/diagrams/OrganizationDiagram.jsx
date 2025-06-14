import { useEffect, useRef, memo } from 'react'
import './OrganizationDiagram.css'

const OrganizationDiagram = memo(({ scores, groupAverages, size = 743 }) => {
  const svgRef = useRef(null)

  // 척도별 색상 정의
  const colors = {
    ob: { light: 'lightcoral', dark: 'red', label: '집착' },
    gu: { light: '#dfbf90', dark: 'orange', label: '포기' },
    cl: { light: 'lightgreen', dark: 'green', label: '밀착' },
    co: { light: 'lightblue', dark: 'blue', label: '단절' },
    sd: { light: 'RGB(204, 153, 255)', dark: 'purple', label: '자율성' }
  }

  useEffect(() => {
    if (!scores) return
    drawDiagram()
  }, [scores, groupAverages])

  const drawDiagram = () => {
    const svg = svgRef.current
    if (!svg) return

    // 점수를 위치로 변환하는 함수
    const scoreToPosition = (score, isVertical = false) => {
      // 원점수 범위를 0-100으로 정규화
      const normalized = Math.max(0, Math.min(100, score))
      
      if (isVertical) {
        // 자율성 (SD) - 세로 막대
        const minY = 106
        const maxHeight = 288
        return minY + (maxHeight * (100 - normalized) / 100)
      } else {
        // 다른 척도들 - 가로 막대
        const maxWidth = 150
        return maxWidth * normalized / 100
      }
    }

    // 각 척도의 원점수 사각형 업데이트
    const updateScoreRect = (scale, score) => {
      const rect = svg.querySelector(`#${scale}originscore`)
      if (!rect) return

      if (scale === 'sd') {
        // 자율성은 세로로 그려짐
        const height = 288 * score / 100
        rect.setAttribute('y', 106 + (288 - height))
        rect.setAttribute('height', height)
      } else {
        // 나머지는 가로로 그려짐
        const width = scoreToPosition(score)
        rect.setAttribute('width', width)
      }
    }

    // 그룹 평균 사각형 업데이트
    const updateGroupRect = (scale, avgScore) => {
      const rect = svg.querySelector(`#${scale}Rect`)
      if (!rect) return

      if (scale === 'sd') {
        // 자율성은 세로로
        const height = 294 * avgScore / 100
        rect.setAttribute('y', 103 + (294 - height))
        rect.setAttribute('height', height)
      } else {
        // 나머지는 가로로
        const width = 160 * avgScore / 100
        rect.setAttribute('width', width)
      }
    }

    // 각 척도 업데이트
    Object.keys(colors).forEach(scale => {
      const score = scores[scale]?.originalScore || 0
      updateScoreRect(scale, score)

      if (groupAverages && groupAverages[scale]) {
        const avgScore = groupAverages[scale].mean || 0
        updateGroupRect(scale, avgScore)
      }
    })
  }

  return (
    <div className="organization-diagram">
      <h3 className="diagram-title">IBPI 5요인 조직도</h3>
      
      <svg ref={svgRef} width={size} height="500">
        {/* 큰 직사각형 네모 박스 */}
        <rect x="0" y="0" width={size} height="500" stroke="black" fill="none" />

        {/* 가운데 큰 사각형 박스 */}
        <rect x="171.5" y="100" width="400" height="300" stroke="black" fill="none" />

        {/* 큰 사각형을 5등분한 작은 사각형들 */}
        <rect x="172.5" y="101" width="170" height="149" fill="lightcoral" strokeWidth="0" />
        <rect x="172.5" y="251" width="170" height="149" fill="#dfbf90" strokeWidth="0" />
        <rect x="401.5" y="101" width="170" height="149" fill="lightgreen" strokeWidth="0" />
        <rect x="401.5" y="251" width="170" height="149" fill="lightblue" strokeWidth="0" />

        {/* 각 사각형의 중앙에 위치한 더 작은 사각형들 - 원점수 */}
        <rect id="oboriginscore" x="182.5" y="106" width="0" height="143" fill="red" />
        <rect id="guoriginscore" x="182.5" y="249" width="0" height="143" fill="orange" />
        <rect id="cloriginscore" x="411.5" y="106" width="0" height="143" fill="green" />
        <rect id="cooriginscore" x="411.5" y="249" width="0" height="143" fill="blue" />

        {/* 그룹평균값을 표시할 사각형들 */}
        <rect id="obRect" x="177.5" y="103.5" width="0" height="146" fill="none" stroke="white"
          strokeDasharray="4,4" strokeWidth="3" />
        <rect id="guRect" x="177.5" y="250" width="0" height="146" fill="none" stroke="white"
          strokeDasharray="4,4" strokeWidth="3" />
        <rect id="clRect" x="406.5" y="103.5" width="0" height="146" fill="none" stroke="white"
          strokeDasharray="4,4" strokeWidth="3" />
        <rect id="coRect" x="406.5" y="250" width="0" height="146" fill="none" stroke="white"
          strokeDasharray="4,4" strokeWidth="3" />

        {/* 중앙 사각형 - 자율성 */}
        <rect x="341.5" y="100" width="60" height="300" fill="RGB(204, 153, 255)" stroke="black" />
        <rect id="sdoriginscore" x="347" y="106" width="50" height="0" fill="purple" stroke="none" />
        <rect id="sdRect" x="344" y="103" width="55" height="0" fill="none" stroke="white"
          strokeDasharray="4,4" strokeWidth="3" />
        <text x="371.5" y="250" textAnchor="middle" writingMode="tb" fill="white">자율성</text>

        {/* 0과 100 숫자 */}
        <text x="257.5" y="252" textAnchor="middle" fill="black" fontSize="13px">0</text>
        <text x="486.5" y="252" textAnchor="middle" fill="black" fontSize="13px">0</text>
        <text x="257.5" y="99" textAnchor="middle" fill="black" fontSize="12px">100</text>
        <text x="257.5" y="409" textAnchor="middle" fill="black" fontSize="12px">-100</text>
        <text x="486.5" y="99" textAnchor="middle" fill="black" fontSize="12px">100</text>
        <text x="486.5" y="409" textAnchor="middle" fill="black" fontSize="12px">-100</text>

        {/* 사각형의 이름들 */}
        <circle cx="257.5" cy="175" r="25" fill="red" stroke="none" />
        <text x="257.5" y="175" textAnchor="middle" dominantBaseline="middle" fill="white">집착</text>
        <circle cx="257.5" cy="325" r="25" fill="orange" stroke="none" />
        <text x="257.5" y="325" textAnchor="middle" dominantBaseline="middle" fill="white">포기</text>
        <circle cx="486.5" cy="175" r="25" fill="green" stroke="none" />
        <text x="486.5" y="175" textAnchor="middle" dominantBaseline="middle" fill="white">밀착</text>
        <circle cx="486.5" cy="325" r="25" fill="blue" stroke="none" />
        <text x="486.5" y="325" textAnchor="middle" dominantBaseline="middle" fill="white">단절</text>
      </svg>

      <div className="diagram-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: colors.ob.dark }}></span>
          <span>의무감 (OB) - 집착</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: colors.gu.dark }}></span>
          <span>포기 (GU)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: colors.cl.dark }}></span>
          <span>친밀성 (CL) - 밀착</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: colors.co.dark }}></span>
          <span>협동성 (CO) - 단절</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: colors.sd.dark }}></span>
          <span>자기발전 (SD) - 자율성</span>
        </div>
      </div>

      {scores && (
        <div className="score-display">
          <h4>현재 점수</h4>
          <div className="score-grid">
            {Object.entries(scores).map(([key, data]) => (
              <div key={key} className="score-item">
                <span className="scale-name">{key.toUpperCase()}</span>
                <span className="scale-score">{data.originalScore || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

OrganizationDiagram.displayName = 'OrganizationDiagram'

export default OrganizationDiagram
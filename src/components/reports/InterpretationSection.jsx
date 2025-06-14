import './InterpretationSection.css'

const InterpretationSection = ({ interpretation, scores }) => {
  // 주요 특성 분석
  const analyzeMainCharacteristics = () => {
    const { mainScales } = scores
    const characteristics = []

    // 가장 높은 척도 찾기
    let highest = { scale: '', score: 0, name: '' }
    let lowest = { scale: '', score: 100, name: '' }

    Object.entries(mainScales).forEach(([scale, data]) => {
      if (data.percentile > highest.score) {
        highest = { scale, score: data.percentile, name: data.name }
      }
      if (data.percentile < lowest.score) {
        lowest = { scale, score: data.percentile, name: data.name }
      }
    })

    // 특성 설명
    const scaleDescriptions = {
      co: {
        high: '타인과의 협력을 중시하며, 조화로운 관계 형성에 능숙합니다.',
        low: '독립적인 성향이 강하며, 자신만의 방식을 선호합니다.'
      },
      cl: {
        high: '친밀한 관계를 추구하며, 정서적 교류를 중요시합니다.',
        low: '적절한 거리를 유지하며, 객관적인 관계를 선호합니다.'
      },
      ob: {
        high: '규칙과 질서를 중시하며, 안정적인 환경을 선호합니다.',
        low: '자유로운 사고와 행동을 추구하며, 변화에 개방적입니다.'
      },
      gu: {
        high: '리더십이 뛰어나며, 주도적으로 상황을 이끌어갑니다.',
        low: '협력적인 팔로워십을 발휘하며, 조화를 중시합니다.'
      },
      sd: {
        high: '자기 확신이 강하며, 독립적인 판단과 행동을 합니다.',
        low: '타인의 의견을 존중하며, 협력적인 의사결정을 선호합니다.'
      }
    }

    // 높은 척도 특성
    if (highest.score >= 70) {
      characteristics.push({
        type: 'strength',
        title: `${highest.name} 우세`,
        description: scaleDescriptions[highest.scale]?.high || ''
      })
    }

    // 낮은 척도 특성
    if (lowest.score <= 30) {
      characteristics.push({
        type: 'consideration',
        title: `${lowest.name} 영역`,
        description: scaleDescriptions[lowest.scale]?.low || ''
      })
    }

    return { highest, lowest, characteristics }
  }

  const analysis = analyzeMainCharacteristics()

  return (
    <div className="interpretation-section">
      {/* 종합 요약 */}
      <div className="summary-box">
        <h3>검사 결과 요약</h3>
        <p>
          {interpretation?.summary || 
           `${analysis.highest.name} 영역(${analysis.highest.score}%)이 가장 높게 나타났으며, 
            ${analysis.lowest.name} 영역(${analysis.lowest.score}%)이 상대적으로 낮게 나타났습니다.`}
        </p>
      </div>

      {/* 주요 특성 */}
      <div className="characteristics-section">
        <h3>주요 대인관계 특성</h3>
        {analysis.characteristics.map((char, index) => (
          <div key={index} className={`characteristic-item ${char.type}`}>
            <h4>
              <i className={`fas ${char.type === 'strength' ? 'fa-star' : 'fa-lightbulb'}`}></i>
              {char.title}
            </h4>
            <p>{char.description}</p>
          </div>
        ))}
      </div>

      {/* 척도별 해석 */}
      <div className="scale-interpretations">
        <h3>척도별 상세 분석</h3>
        {Object.entries(scores.mainScales).map(([scale, data]) => (
          <div key={scale} className="scale-interpretation">
            <div className="scale-header">
              <h4>{data.name} ({scale.toUpperCase()})</h4>
              <span className="percentile-badge">{data.percentile}%</span>
            </div>
            <p>{getScaleInterpretation(scale, data.percentile)}</p>
          </div>
        ))}
      </div>

      {/* 강점 영역 */}
      {interpretation?.strengths && interpretation.strengths.length > 0 && (
        <div className="strengths-section">
          <h3>강점 영역</h3>
          <ul>
            {interpretation.strengths.map((strength, index) => (
              <li key={index}>
                <i className="fas fa-check-circle"></i>
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// 척도별 해석 생성
const getScaleInterpretation = (scale, percentile) => {
  const interpretations = {
    co: {
      high: '협조성이 높아 팀워크와 협력 활동에서 뛰어난 성과를 보입니다. 타인의 의견을 존중하고 갈등을 조화롭게 해결하는 능력이 있습니다.',
      medium: '상황에 따라 협력적인 태도와 독립적인 태도를 적절히 조절할 수 있습니다. 필요시 타인과 협력하며, 개인적인 목표도 추구합니다.',
      low: '독립적이고 자율적인 성향으로, 개인의 목표와 가치를 중시합니다. 필요시 협력할 수 있으나 자신만의 방식을 선호합니다.'
    },
    cl: {
      high: '정서적 친밀감을 중요시하며, 깊이 있는 인간관계를 형성합니다. 타인과의 신뢰 관계 구축에 능숙합니다.',
      medium: '친밀함과 독립성 사이에서 균형을 유지합니다. 상황에 따라 가까운 관계와 적절한 거리를 조절할 수 있습니다.',
      low: '객관적이고 독립적인 관계를 선호합니다. 과도한 친밀감보다는 적절한 거리를 유지하는 것을 편안하게 느낍니다.'
    },
    ob: {
      high: '규칙과 질서를 중시하며, 체계적이고 안정적인 환경에서 최선의 성과를 냅니다. 책임감이 강하고 신뢰할 수 있습니다.',
      medium: '규칙 준수와 유연성 사이에서 균형을 유지합니다. 필요에 따라 규정을 따르거나 창의적인 접근을 시도할 수 있습니다.',
      low: '자유롭고 창의적인 사고를 추구합니다. 기존의 틀에 얽매이지 않고 새로운 방법을 시도하는 것을 선호합니다.'
    },
    gu: {
      high: '리더십이 뛰어나며 주도적으로 일을 추진합니다. 책임감이 강하고 타인을 이끄는 데 자신감이 있습니다.',
      medium: '상황에 따라 리더와 팔로워의 역할을 유연하게 수행합니다. 필요시 주도권을 잡거나 타인을 지원할 수 있습니다.',
      low: '협력적이고 지원적인 역할을 선호합니다. 타인과의 조화를 중시하며 과도한 책임보다는 팀워크를 중요시합니다.'
    },
    sd: {
      high: '자기 확신이 강하고 독립적입니다. 자신의 판단을 신뢰하며 주체적으로 결정하고 행동합니다.',
      medium: '자신감과 겸손함 사이에서 균형을 유지합니다. 자신의 의견을 가지면서도 타인의 조언을 수용할 수 있습니다.',
      low: '겸손하고 수용적인 태도를 보입니다. 타인의 의견을 존중하며 협력적인 의사결정을 선호합니다.'
    }
  }

  const level = percentile >= 70 ? 'high' : percentile >= 30 ? 'medium' : 'low'
  return interpretations[scale]?.[level] || '해당 척도에 대한 해석을 준비 중입니다.'
}

export default InterpretationSection
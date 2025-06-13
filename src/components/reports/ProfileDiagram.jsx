import { useEffect, useRef } from 'react'
import './ProfileDiagram.css'

const ProfileDiagram = ({ scores, size = 400, showLabels = true }) => {
  const canvasRef = useRef(null)
  
  // 척도 순서 및 레이블
  const dimensions = [
    { key: 'co', label: 'CO', fullName: '협조성' },
    { key: 'cl', label: 'CL', fullName: '근접성' },
    { key: 'ob', label: 'OB', fullName: '순종성' },
    { key: 'gu', label: 'GU', fullName: '지도성' },
    { key: 'sd', label: 'SD', fullName: '자기신뢰' }
  ]

  useEffect(() => {
    drawDiagram()
  }, [scores, size])

  const drawDiagram = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const center = size / 2
    const radius = size * 0.35
    const angleStep = (2 * Math.PI) / dimensions.length

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // 배경 원 그리기
    drawBackgroundCircles(ctx, center, radius)

    // 축 그리기
    drawAxes(ctx, center, radius, angleStep)

    // 레이블 그리기
    if (showLabels) {
      drawLabels(ctx, center, radius, angleStep)
    }

    // 데이터 다각형 그리기
    drawDataPolygon(ctx, center, radius, angleStep)

    // 데이터 포인트 그리기
    drawDataPoints(ctx, center, radius, angleStep)
  }

  const drawBackgroundCircles = (ctx, center, radius) => {
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1

    // 20, 40, 60, 80, 100 레벨 원 그리기
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath()
      ctx.arc(center, center, (radius * i) / 5, 0, 2 * Math.PI)
      ctx.stroke()
    }
  }

  const drawAxes = (ctx, center, radius, angleStep) => {
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 1

    dimensions.forEach((_, index) => {
      const angle = index * angleStep - Math.PI / 2
      const x = center + radius * Math.cos(angle)
      const y = center + radius * Math.sin(angle)

      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.lineTo(x, y)
      ctx.stroke()
    })
  }

  const drawLabels = (ctx, center, radius, angleStep) => {
    ctx.font = 'bold 14px Arial'
    ctx.fillStyle = '#333'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    dimensions.forEach((dim, index) => {
      const angle = index * angleStep - Math.PI / 2
      const labelRadius = radius + 30
      const x = center + labelRadius * Math.cos(angle)
      const y = center + labelRadius * Math.sin(angle)

      // 척도 약어
      ctx.font = 'bold 16px Arial'
      ctx.fillText(dim.label, x, y - 8)
      
      // 척도 이름
      ctx.font = '12px Arial'
      ctx.fillText(dim.fullName, x, y + 8)
      
      // 백분위 값
      const score = scores[dim.key]
      if (score) {
        ctx.font = 'bold 12px Arial'
        ctx.fillStyle = '#667eea'
        ctx.fillText(`${score.percentile}%`, x, y + 24)
        ctx.fillStyle = '#333'
      }
    })
  }

  const drawDataPolygon = (ctx, center, radius, angleStep) => {
    ctx.beginPath()
    ctx.strokeStyle = '#667eea'
    ctx.fillStyle = 'rgba(102, 126, 234, 0.2)'
    ctx.lineWidth = 2

    dimensions.forEach((dim, index) => {
      const score = scores[dim.key]
      if (!score) return

      const angle = index * angleStep - Math.PI / 2
      const r = (score.percentile / 100) * radius
      const x = center + r * Math.cos(angle)
      const y = center + r * Math.sin(angle)

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  const drawDataPoints = (ctx, center, radius, angleStep) => {
    ctx.fillStyle = '#667eea'

    dimensions.forEach((dim, index) => {
      const score = scores[dim.key]
      if (!score) return

      const angle = index * angleStep - Math.PI / 2
      const r = (score.percentile / 100) * radius
      const x = center + r * Math.cos(angle)
      const y = center + r * Math.sin(angle)

      ctx.beginPath()
      ctx.arc(x, y, 5, 0, 2 * Math.PI)
      ctx.fill()
    })
  }

  return (
    <div className="profile-diagram">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="profile-canvas"
      />
      <div className="diagram-scale">
        <span>0</span>
        <span>20</span>
        <span>40</span>
        <span>60</span>
        <span>80</span>
        <span>100</span>
      </div>
    </div>
  )
}

export default ProfileDiagram
import { useState } from 'react'
import './NoticePage.css'

const NoticePage = () => {
  const [notices] = useState([
    {
      id: 1,
      title: 'IBPI 심리검사 시스템 업데이트 안내',
      content: '시스템이 React 기반으로 전면 개편되었습니다.',
      date: '2025-01-06',
      important: true
    },
    {
      id: 2,
      title: '검사 결과 PDF 출력 기능 개선',
      content: 'PDF 출력 시 레이아웃이 개선되었습니다.',
      date: '2025-01-05',
      important: false
    },
    {
      id: 3,
      title: '시스템 정기 점검 안내',
      content: '매주 화요일 새벽 2시-4시 정기 점검이 진행됩니다.',
      date: '2025-01-03',
      important: false
    }
  ])

  return (
    <div className="notice-page">
      <div className="page-header">
        <h1>공지사항</h1>
        <p className="page-subtitle">IBPI 검사 시스템 관련 공지사항입니다</p>
      </div>

      <div className="notice-list">
        {notices.map(notice => (
          <div key={notice.id} className="notice-item">
            <div className="notice-header">
              <h3>
                {notice.important && <span className="badge bg-danger me-2">중요</span>}
                {notice.title}
              </h3>
              <span className="notice-date">{notice.date}</span>
            </div>
            <p className="notice-content">{notice.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NoticePage
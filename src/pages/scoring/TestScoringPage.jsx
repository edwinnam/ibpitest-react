import { useState } from 'react'
import { useAuth } from '../../modules/auth/AuthContext'
import { useSupabaseQuery, useSupabaseMutation } from '../../core/hooks/useSupabaseQuery'
import { testCodeService } from '../../core/services/testCodeService'
import { supabase } from '../../core/services/supabase'
import './TestScoringPage.css'

const TestScoringPage = () => {
  const { user } = useAuth()
  const [selectedTests, setSelectedTests] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [isScoring, setIsScoring] = useState(false)
  
  const orgNumber = user?.user_metadata?.org_number || sessionStorage.getItem('orgNumber')

  // 채점 대기 중인 검사 목록 조회
  const { data: pendingTests = [], isLoading, refetch } = useSupabaseQuery(
    ['pendingScoring', orgNumber],
    async () => {
      const { data, error } = await supabase
        .from('customer_info')
        .select(`
          *,
          test_codes!inner(test_code, test_type)
        `)
        .eq('org_number', orgNumber)
        .eq('is_scored', false)
        .eq('is_test_completed', true)
        .order('test_completed_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    { enabled: !!orgNumber }
  )

  // 채점 처리 뮤테이션
  const scoringMutation = useSupabaseMutation(
    async (customerIds) => {
      const results = await Promise.all(
        customerIds.map(async (customerId) => {
          try {
            // 고객 정보 및 응답 데이터 조회
            const { data: customer, error: customerError } = await supabase
              .from('customer_info')
              .select(`
                *,
                test_responses(*)
              `)
              .eq('id', customerId)
              .single()
            
            if (customerError) throw customerError

            // 점수 계산 로직 (실제 채점 알고리즘 구현 필요)
            const scores = calculateScores(customer.test_responses)
            
            // 채점 결과 저장
            const { data: result, error: resultError } = await supabase
              .from('test_results')
              .insert({
                customer_id: customerId,
                org_number: orgNumber,
                test_type: customer.test_codes.test_type,
                scores: scores,
                interpretation: generateInterpretation(scores, customer.test_codes.test_type),
                scored_at: new Date().toISOString()
              })
            
            if (resultError) throw resultError

            // 고객 정보 업데이트
            const { error: updateError } = await supabase
              .from('customer_info')
              .update({
                is_scored: true,
                scored_at: new Date().toISOString()
              })
              .eq('id', customerId)
            
            if (updateError) throw updateError

            return { success: true, customerId }
          } catch (error) {
            console.error(`채점 오류 (ID: ${customerId}):`, error)
            return { success: false, customerId, error: error.message }
          }
        })
      )

      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length

      return { successCount, failCount, results }
    },
    {
      onSuccess: (data) => {
        alert(`채점 완료: 성공 ${data.successCount}건, 실패 ${data.failCount}건`)
        setSelectedTests([])
        setSelectAll(false)
        refetch()
      },
      onError: (error) => {
        alert(`채점 오류: ${error.message}`)
      }
    }
  )

  // 점수 계산 함수 (실제 로직 구현 필요)
  const calculateScores = (responses) => {
    // TODO: 실제 채점 알고리즘 구현
    return {
      total: Math.floor(Math.random() * 100),
      subscales: {
        scale1: Math.floor(Math.random() * 100),
        scale2: Math.floor(Math.random() * 100),
        scale3: Math.floor(Math.random() * 100),
        scale4: Math.floor(Math.random() * 100)
      }
    }
  }

  // 해석 생성 함수 (실제 로직 구현 필요)
  const generateInterpretation = (scores, testType) => {
    // TODO: 실제 해석 로직 구현
    return {
      overall: '정상 범위',
      details: '전반적으로 양호한 수준을 보이고 있습니다.'
    }
  }

  const handleSelectAll = (checked) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedTests(pendingTests.map(test => test.id))
    } else {
      setSelectedTests([])
    }
  }

  const handleSelectTest = (testId, checked) => {
    if (checked) {
      setSelectedTests([...selectedTests, testId])
    } else {
      setSelectedTests(selectedTests.filter(id => id !== testId))
      setSelectAll(false)
    }
  }

  const handleScoring = () => {
    if (selectedTests.length === 0) {
      alert('채점할 검사를 선택해주세요.')
      return
    }

    if (confirm(`선택한 ${selectedTests.length}개의 검사를 채점하시겠습니까?`)) {
      scoringMutation.mutate(selectedTests)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="scoring-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>채점 대기 목록 로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="test-scoring-page">
      <div className="page-header">
        <h1>검사 채점</h1>
        <p className="page-subtitle">완료된 검사를 채점하고 결과를 생성합니다</p>
      </div>

      <div className="scoring-content">
        <div className="scoring-stats mb-4">
          <div className="alert alert-info">
            <i className="fas fa-info-circle me-2"></i>
            채점 대기: <strong>{pendingTests.length}</strong>건
          </div>
        </div>

        {pendingTests.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-clipboard-check fa-3x text-muted mb-3"></i>
            <h4>채점 대기 중인 검사가 없습니다</h4>
            <p className="text-muted">검사가 완료되면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th>검사종류</th>
                    <th>이름</th>
                    <th>검사코드</th>
                    <th>소속기관</th>
                    <th>완료일시</th>
                    <th>소요시간</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTests.map(test => (
                    <tr key={test.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedTests.includes(test.id)}
                          onChange={(e) => handleSelectTest(test.id, e.target.checked)}
                        />
                      </td>
                      <td>
                        <span className="badge bg-primary">
                          {test.test_codes?.test_type || '알 수 없음'}
                        </span>
                      </td>
                      <td>{test.name}</td>
                      <td className="text-monospace">{test.test_codes?.test_code}</td>
                      <td>{test.institution1}</td>
                      <td>{formatDate(test.test_completed_at)}</td>
                      <td>
                        {test.test_duration 
                          ? `${Math.floor(test.test_duration / 60)}분 ${test.test_duration % 60}초`
                          : '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="action-buttons mt-4">
              <button
                className="btn btn-primary btn-lg"
                onClick={handleScoring}
                disabled={selectedTests.length === 0 || scoringMutation.isLoading}
              >
                {scoringMutation.isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    채점 중... ({selectedTests.length}건)
                  </>
                ) : (
                  <>
                    <i className="fas fa-calculator me-2"></i>
                    선택 항목 채점 ({selectedTests.length}건)
                  </>
                )}
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => refetch()}
              >
                <i className="fas fa-sync me-2"></i>
                새로고침
              </button>
            </div>
          </>
        )}
      </div>

      <div className="page-footer mt-5">
        <a href="/test-results" className="btn btn-outline-primary">
          채점 결과 보기
        </a>
        <a href="/dashboard" className="btn btn-outline-secondary">
          대시보드로 이동
        </a>
      </div>
    </div>
  )
}

export default TestScoringPage
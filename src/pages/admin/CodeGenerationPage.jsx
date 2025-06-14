import { useState } from 'react'
import { useAuth } from '../../modules/auth/AuthContext'
import { useOrganization } from '../../modules/organization/OrganizationContext'
import { testCodeService } from '../../core/services/testCodeService'
import './CodeGenerationPage.css'

const CodeGenerationPage = () => {
  const { user } = useAuth()
  const { getOrgNumber, refreshStats } = useOrganization()
  const [codeCount, setCodeCount] = useState(10)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResult, setGenerationResult] = useState(null)

  const handleGenerateCodes = async () => {
    if (codeCount < 1 || codeCount > 1000) {
      alert('생성할 코드 수는 1개 이상 1000개 이하여야 합니다.')
      return
    }

    setIsGenerating(true)
    setGenerationResult(null)

    try {
      const orgNumber = getOrgNumber()
      if (!orgNumber) {
        throw new Error('기관 정보를 찾을 수 없습니다.')
      }

      // 미사용 코드 생성
      const generatedCodes = await testCodeService.generateUnusedCodes(orgNumber, codeCount)
      
      // 통계 업데이트
      await refreshStats()

      setGenerationResult({
        success: true,
        count: generatedCodes.length,
        message: `${generatedCodes.length}개의 검사코드가 생성되었습니다.`
      })

      // 입력 필드 초기화
      setCodeCount(10)
    } catch (error) {
      console.error('코드 생성 오류:', error)
      setGenerationResult({
        success: false,
        message: `코드 생성 중 오류가 발생했습니다: ${error.message}`
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // 관리자 권한 체크 (실제 구현시 적절한 권한 체크 필요)
  const isAdmin = user?.email?.includes('admin') || true // 임시로 모든 사용자에게 허용

  if (!isAdmin) {
    return (
      <div className="code-generation-page">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          관리자 권한이 필요합니다.
        </div>
      </div>
    )
  }

  return (
    <div className="code-generation-page">
      <div className="page-header">
        <h1>검사코드 대량 생성</h1>
        <p className="page-subtitle">기관에서 사용할 검사코드를 미리 생성합니다.</p>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="alert alert-info mb-4">
            <i className="fas fa-info-circle me-2"></i>
            생성된 코드는 unused_codes 테이블에 저장되며, 수검자 정보 입력 시 자동으로 할당됩니다.
          </div>

          <div className="generation-form">
            <div className="form-group mb-4">
              <label htmlFor="codeCount" className="form-label">
                생성할 코드 수
              </label>
              <div className="input-group">
                <input
                  type="number"
                  id="codeCount"
                  className="form-control"
                  value={codeCount}
                  onChange={(e) => setCodeCount(Number(e.target.value))}
                  min="1"
                  max="1000"
                  disabled={isGenerating}
                />
                <span className="input-group-text">개</span>
              </div>
              <small className="form-text text-muted">
                1개 이상 1000개 이하로 입력해주세요.
              </small>
            </div>

            <button
              className="btn btn-primary btn-lg"
              onClick={handleGenerateCodes}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  생성 중...
                </>
              ) : (
                <>
                  <i className="fas fa-plus-circle me-2"></i>
                  코드 생성
                </>
              )}
            </button>
          </div>

          {generationResult && (
            <div className={`alert mt-4 ${generationResult.success ? 'alert-success' : 'alert-danger'}`}>
              {generationResult.success ? (
                <i className="fas fa-check-circle me-2"></i>
              ) : (
                <i className="fas fa-exclamation-circle me-2"></i>
              )}
              {generationResult.message}
            </div>
          )}

          <div className="mt-5">
            <h5>코드 생성 규칙</h5>
            <ul className="text-muted">
              <li>코드 형식: XXXXX-XXXXXX (날짜 기반 5자리 + 랜덤 6자리)</li>
              <li>중복 방지를 위한 자동 검증</li>
              <li>생성된 코드는 기관에 자동 할당</li>
              <li>사용 가능한 코드 수가 자동으로 업데이트됨</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CodeGenerationPage
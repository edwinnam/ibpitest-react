import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../core/services/supabase'
import './CustomerLoginPage.css'

const CustomerLoginPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    testCode: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.testCode) {
      setError('이름과 검사코드를 모두 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 검사 코드 유효성 확인
      const { data: testCodeData, error: codeError } = await supabase
        .from('used_codes')
        .select('*')
        .eq('test_code', formData.testCode)
        .eq('name', formData.name)
        .single()

      if (codeError || !testCodeData) {
        setError('이름 또는 검사코드가 올바르지 않습니다.')
        setLoading(false)
        return
      }

      // 이미 완료된 검사인지 확인
      if (testCodeData.status === '완료') {
        setError('이미 완료된 검사입니다.')
        setLoading(false)
        return
      }

      // 고객 정보 조회 또는 생성
      let customerId = testCodeData.customer_id

      if (!customerId) {
        // 새 고객 정보 생성
        const { data: newCustomer, error: customerError } = await supabase
          .from('customer_info')
          .insert({
            name: formData.name,
            test_code: formData.testCode,
            org_number: testCodeData.org_number,
            test_type: testCodeData.test_type,
            standard_group: testCodeData.standard_group,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (customerError) throw customerError
        customerId = newCustomer.id

        // used_codes 테이블 업데이트
        await supabase
          .from('used_codes')
          .update({ 
            customer_id: customerId,
            status: '진행중',
            last_access: new Date().toISOString()
          })
          .eq('id', testCodeData.id)
      } else {
        // 기존 고객 - 마지막 접속 시간 업데이트
        await supabase
          .from('used_codes')
          .update({ 
            status: '진행중',
            last_access: new Date().toISOString()
          })
          .eq('id', testCodeData.id)
      }

      // 세션 스토리지에 정보 저장
      sessionStorage.setItem('customerInfo', JSON.stringify({
        customerId,
        name: formData.name,
        testCode: formData.testCode,
        testType: testCodeData.test_type,
        orgNumber: testCodeData.org_number,
        standardGroup: testCodeData.standard_group
      }))

      // 검사 시작 페이지로 이동
      navigate('/customer/test-intro')
    } catch (error) {
      console.error('로그인 오류:', error)
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="customer-login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <img src="/images/ibpi-logo.png" alt="IBPI" className="logo" />
            <h1>IBPI 심리검사</h1>
            <p>검사를 시작하려면 아래 정보를 입력해주세요</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="alert alert-danger">
                <i className="fas fa-exclamation-circle me-2"></i>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">이름</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="실명을 입력해주세요"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="testCode">검사코드</label>
              <input
                type="text"
                id="testCode"
                name="testCode"
                className="form-control"
                value={formData.testCode}
                onChange={handleInputChange}
                placeholder="받으신 검사코드를 입력해주세요"
                required
                disabled={loading}
              />
              <small className="form-text text-muted">
                검사코드는 문자나 이메일로 전송된 코드입니다
              </small>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  확인 중...
                </>
              ) : (
                '검사 시작하기'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p className="text-muted">
              검사코드가 없으신가요?<br />
              검사를 신청하신 기관에 문의해주세요.
            </p>
          </div>
        </div>
      </div>

      <div className="page-footer">
        <p>&copy; 2025 IBPI. All rights reserved.</p>
      </div>
    </div>
  )
}

export default CustomerLoginPage
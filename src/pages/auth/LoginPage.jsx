import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../modules/auth/AuthContext'
import './LoginPage.css'

const LoginPage = ({ type = 'partner' }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await signIn(email, password)
      
      if (error) {
        setError(error.message === 'Invalid login credentials' 
          ? '이메일 또는 비밀번호가 올바르지 않습니다.' 
          : error.message)
        return
      }

      // 로그인 성공
      navigate(from, { replace: true })
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <h2 className="login-title">
        {type === 'partner' ? '검사기관 로그인' : '수검자 로그인'}
      </h2>
      
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="email">이메일</label>
          <input
            type="email"
            id="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 입력하세요"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">비밀번호</label>
          <input
            type="password"
            id="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            required
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          className="btn-login"
          disabled={loading}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <div className="login-footer">
        <a 
          href="/auth/reset-password" 
          onClick={(e) => {
            e.preventDefault()
            navigate('/auth/reset-password')
          }}
          className="link"
        >
          비밀번호 찾기
        </a>
        <span className="separator">|</span>
        <a href="#" className="link">회원가입</a>
      </div>

      {type === 'partner' && (
        <div className="login-switch">
          <a 
            href="/customer-login"
            onClick={(e) => {
              e.preventDefault()
              navigate('/customer-login')
            }}
            className="switch-link"
          >
            수검자 로그인으로 전환
          </a>
        </div>
      )}
    </div>
  )
}

export default LoginPage
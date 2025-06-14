import { Outlet } from 'react-router-dom'
import './AuthLayout.css'

const AuthLayout = () => {
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-header">
          <h1>IBPI 검사시스템</h1>
          <p>심리검사 전문 플랫폼</p>
        </div>
        <div className="auth-content">
          <Outlet />
        </div>
        <div className="auth-footer">
          <p>&copy; 2024 IBPI. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../modules/auth/AuthContext'

const PublicRoute = () => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    // 로딩 중 표시
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>로딩 중...</div>
      </div>
    )
  }

  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />
}

export default PublicRoute
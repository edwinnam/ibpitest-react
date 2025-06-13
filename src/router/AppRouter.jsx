import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../modules/auth/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import PublicRoute from './PublicRoute'

// 레이아웃
import MainLayout from '../core/layouts/MainLayout'
import AuthLayout from '../core/layouts/AuthLayout'

// 페이지 (임시 컴포넌트)
import LoginPage from '../pages/auth/LoginPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'
import UpdatePasswordPage from '../pages/auth/UpdatePasswordPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import TestManagementPage from '../pages/test/TestManagementPage'
import TestScoringPage from '../pages/scoring/TestScoringPage'
import TestResultsPage from '../pages/results/TestResultsPage'
import GroupTestPage from '../pages/test/GroupTestPage'
import MyPage from '../pages/user/MyPage'
import CustomerInfoPage from '../pages/user/CustomerInfoPage'
import BizPartnerInfoPage from '../pages/organization/BizPartnerInfoPage'
import DataManagementPage from '../pages/admin/DataManagementPage'
import NoticePage from '../pages/notice/NoticePage'
import ReportViewPage from '../pages/reports/ReportViewPage'
import ReportDemo from '../pages/reports/ReportDemo'

// 고객용 페이지
import CustomerLoginPage from '../pages/customer/CustomerLoginPage'
import TestIntroPage from '../pages/customer/TestIntroPage'
import TestPage from '../pages/customer/TestPage'
import TestCompletePage from '../pages/customer/TestCompletePage'

const AppRouter = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* 공개 라우트 (로그인하지 않은 사용자) */}
        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/customer-login" element={<LoginPage type="customer" />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
          </Route>
        </Route>

        {/* 보호된 라우트 (로그인한 사용자) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/test-management" element={<TestManagementPage />} />
            <Route path="/test-scoring" element={<TestScoringPage />} />
            <Route path="/test-results" element={<TestResultsPage />} />
            <Route path="/group-test" element={<GroupTestPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/customer-info" element={<CustomerInfoPage />} />
            <Route path="/biz-partner-info" element={<BizPartnerInfoPage />} />
            <Route path="/data-management" element={<DataManagementPage />} />
            <Route path="/notice" element={<NoticePage />} />
            <Route path="/reports/:customerId/:testId" element={<ReportViewPage />} />
            <Route path="/reports/demo" element={<ReportDemo />} />
          </Route>
        </Route>

        {/* 고객용 라우트 (검사 수행) */}
        <Route path="/customer">
          <Route path="login" element={<CustomerLoginPage />} />
          <Route path="test-intro" element={<TestIntroPage />} />
          <Route path="test" element={<TestPage />} />
          <Route path="test-complete" element={<TestCompletePage />} />
        </Route>

        {/* 루트 경로 리다이렉트 */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 페이지 */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </AuthProvider>
  )
}

export default AppRouter
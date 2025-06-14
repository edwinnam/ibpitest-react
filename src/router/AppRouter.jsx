import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../modules/auth/AuthContext'
import { OrganizationProvider } from '../modules/organization/OrganizationContext'
import AnalyticsProvider from '../components/AnalyticsProvider'
import ProtectedRoute from './ProtectedRoute'
import PublicRoute from './PublicRoute'
import './PageLoader.css'

// 레이아웃 (자주 사용되므로 lazy loading 하지 않음)
import MainLayout from '../core/layouts/MainLayout'
import AuthLayout from '../core/layouts/AuthLayout'

// 페이지 컴포넌트를 lazy loading으로 import
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'))
const UpdatePasswordPage = lazy(() => import('../pages/auth/UpdatePasswordPage'))
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'))
const TestManagementPage = lazy(() => import('../pages/test/TestManagementPage'))
const TestScoringPage = lazy(() => import('../pages/scoring/TestScoringPage'))
const ManualScoringPage = lazy(() => import('../pages/scoring/ManualScoringPage'))
const TestResultsPage = lazy(() => import('../pages/results/TestResultsPage'))
const GroupTestPage = lazy(() => import('../pages/test/GroupTestPage'))
const MyPage = lazy(() => import('../pages/user/MyPage'))
const CustomerInfoPage = lazy(() => import('../pages/user/CustomerInfoPage'))
const BizPartnerInfoPage = lazy(() => import('../pages/organization/BizPartnerInfoPage'))
const DataManagementPage = lazy(() => import('../pages/admin/DataManagementPage'))
const CodeGenerationPage = lazy(() => import('../pages/admin/CodeGenerationPage'))
const NoticePage = lazy(() => import('../pages/notice/NoticePage'))
const ReportViewPage = lazy(() => import('../pages/reports/ReportViewPage'))
const ReportDemo = lazy(() => import('../pages/reports/ReportDemo'))
const UserGuidePage = lazy(() => import('../pages/guide/UserGuidePage'))
const OrganizationDiagramPage = lazy(() => import('../pages/diagram/OrganizationDiagramPage'))
const DataAnalysisPage = lazy(() => import('../pages/analytics/DataAnalysisPage'))

// 고객용 페이지
const CustomerLoginPage = lazy(() => import('../pages/customer/CustomerLoginPage'))
const TestIntroPage = lazy(() => import('../pages/customer/TestIntroPage'))
const TestPage = lazy(() => import('../pages/customer/TestPage'))
const TestCompletePage = lazy(() => import('../pages/customer/TestCompletePage'))

// Loading 컴포넌트
const PageLoader = () => (
  <div className="page-loader">
    <div className="loader-spinner">
      <i className="fas fa-spinner fa-spin"></i>
    </div>
    <p>페이지를 불러오는 중...</p>
  </div>
)

const AppRouter = () => {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <AnalyticsProvider>
          <Suspense fallback={<PageLoader />}>
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
                <Route path="/manual-scoring" element={<ManualScoringPage />} />
                <Route path="/test-results" element={<TestResultsPage />} />
                <Route path="/group-test" element={<GroupTestPage />} />
                <Route path="/mypage" element={<MyPage />} />
                <Route path="/customer-info" element={<CustomerInfoPage />} />
                <Route path="/biz-partner-info" element={<BizPartnerInfoPage />} />
                <Route path="/data-management" element={<DataManagementPage />} />
                <Route path="/admin/code-generation" element={<CodeGenerationPage />} />
                <Route path="/notice" element={<NoticePage />} />
                <Route path="/user-guide" element={<UserGuidePage />} />
                <Route path="/reports/:customerId/:testId" element={<ReportViewPage />} />
                <Route path="/reports/demo" element={<ReportDemo />} />
                <Route path="/diagram" element={<OrganizationDiagramPage />} />
                <Route path="/diagram/:customerId/:testId" element={<OrganizationDiagramPage />} />
                <Route path="/data-analysis" element={<DataAnalysisPage />} />
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
            <Route path="*" element={<div className="error-page">404 - Page Not Found</div>} />
          </Routes>
        </Suspense>
        </AnalyticsProvider>
      </OrganizationProvider>
    </AuthProvider>
  )
}

export default AppRouter
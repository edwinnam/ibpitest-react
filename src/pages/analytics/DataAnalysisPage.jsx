import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataExportTool from '../../components/dataAnalysis/DataExportTool';
import DataComparisonTool from '../../components/dataAnalysis/DataComparisonTool';
import AnalyticsDashboard from '../../components/dashboard/AnalyticsDashboard';
import UserBehaviorDashboard from '../../components/analytics/UserBehaviorDashboard';
import './DataAnalysisPage.css';

const DataAnalysisPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: '분석 대시보드', icon: 'fas fa-chart-line' },
    { id: 'behavior', label: '사용자 행동', icon: 'fas fa-user-chart' },
    { id: 'comparison', label: '데이터 비교', icon: 'fas fa-balance-scale' },
    { id: 'export', label: '데이터 내보내기', icon: 'fas fa-download' }
  ];

  return (
    <div className="data-analysis-page">
      <div className="page-header">
        <div className="header-content">
          <h1>데이터 분석 도구</h1>
          <p className="page-subtitle">
            검사 데이터를 다양한 방식으로 분석하고 인사이트를 얻으세요
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={() => navigate('/dashboard')}
          >
            <i className="fas fa-arrow-left"></i>
            대시보드로 돌아가기
          </button>
        </div>
      </div>

      <div className="analysis-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={tab.icon}></i>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="analysis-content">
        {activeTab === 'dashboard' && (
          <div className="tab-content">
            <AnalyticsDashboard />
          </div>
        )}

        {activeTab === 'behavior' && (
          <div className="tab-content">
            <UserBehaviorDashboard />
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="tab-content">
            <DataComparisonTool />
            
            <div className="insights-section">
              <h3>분석 인사이트</h3>
              <div className="insights-grid">
                <div className="insight-card">
                  <div className="insight-icon">
                    <i className="fas fa-lightbulb"></i>
                  </div>
                  <div className="insight-content">
                    <h4>기간별 트렌드</h4>
                    <p>월별, 분기별 성과 변화를 파악하여 개선 방향을 설정하세요.</p>
                  </div>
                </div>
                
                <div className="insight-card">
                  <div className="insight-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="insight-content">
                    <h4>그룹간 차이</h4>
                    <p>연령대별, 성별 차이를 분석하여 맞춤형 접근 전략을 수립하세요.</p>
                  </div>
                </div>
                
                <div className="insight-card">
                  <div className="insight-icon">
                    <i className="fas fa-chart-line"></i>
                  </div>
                  <div className="insight-content">
                    <h4>개인 성장 추적</h4>
                    <p>개인별 점수 변화를 추적하여 발전 과정을 모니터링하세요.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="tab-content">
            <DataExportTool />
            
            <div className="export-templates">
              <h3>자주 사용하는 내보내기 템플릿</h3>
              <div className="templates-grid">
                <button className="template-card">
                  <i className="fas fa-file-excel"></i>
                  <h4>월간 보고서</h4>
                  <p>이번 달 전체 검사 결과 요약</p>
                </button>
                
                <button className="template-card">
                  <i className="fas fa-file-csv"></i>
                  <h4>고객 명단</h4>
                  <p>전체 고객 정보 및 검사 이력</p>
                </button>
                
                <button className="template-card">
                  <i className="fas fa-file-alt"></i>
                  <h4>통계 보고서</h4>
                  <p>종합 통계 및 분석 결과</p>
                </button>
                
                <button className="template-card">
                  <i className="fas fa-file-archive"></i>
                  <h4>전체 백업</h4>
                  <p>모든 데이터 압축 파일</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="analysis-footer">
        <div className="footer-info">
          <i className="fas fa-info-circle"></i>
          <p>
            데이터 분석 결과는 의사결정의 참고 자료로 활용하시되, 
            전문적인 판단이 필요한 경우 전문가와 상담하시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataAnalysisPage;
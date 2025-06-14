import React, { useState, useEffect } from 'react';
import { useAuth } from '../../modules/auth/AuthContext';
import analyticsService from '../../core/services/analyticsService';
import LineChart from '../charts/LineChart';
import BarChart from '../charts/BarChart';
import PieChart from '../charts/PieChart';
import './UserBehaviorDashboard.css';

const UserBehaviorDashboard = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('30days');
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchInsights();
    }
  }, [user?.id, dateRange]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getUserInsights(user.id, dateRange);
      setInsights(data);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="behavior-dashboard-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>사용자 행동 데이터를 분석하는 중...</p>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="behavior-dashboard-error">
        <i className="fas fa-exclamation-circle"></i>
        <p>데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  // Prepare chart data
  const deviceData = Object.entries(insights.deviceBreakdown).map(([device, count]) => ({
    label: device,
    value: count
  }));

  const hourlyData = insights.timePatterns.byHour.map((count, hour) => ({
    label: `${hour}시`,
    value: count
  }));

  const dailyData = insights.timePatterns.byDay.map((count, day) => ({
    label: getDayName(day),
    value: count
  }));

  const topPagesData = insights.topPages.map(page => ({
    label: page.page,
    value: page.count
  }));

  const topActionsData = insights.topActions.map(action => ({
    label: formatActionName(action.action),
    value: action.count
  }));

  return (
    <div className="user-behavior-dashboard">
      <div className="behavior-header">
        <h2>사용자 행동 분석</h2>
        <select
          className="date-range-select"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
        >
          <option value="7days">최근 7일</option>
          <option value="30days">최근 30일</option>
          <option value="90days">최근 90일</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="behavior-summary">
        <div className="summary-card">
          <div className="summary-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="summary-content">
            <h4>총 세션</h4>
            <p className="summary-value">{insights.totalSessions}</p>
            <span className="summary-label">방문 횟수</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="summary-content">
            <h4>평균 세션 시간</h4>
            <p className="summary-value">{formatDuration(insights.avgSessionDuration)}</p>
            <span className="summary-label">체류 시간</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <i className="fas fa-mouse-pointer"></i>
          </div>
          <div className="summary-content">
            <h4>세션당 이벤트</h4>
            <p className="summary-value">{insights.avgEventsPerSession}</p>
            <span className="summary-label">평균 활동</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="summary-content">
            <h4>총 이벤트</h4>
            <p className="summary-value">{insights.totalEvents}</p>
            <span className="summary-label">전체 활동</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="behavior-charts">
        {/* Device Breakdown */}
        <div className="chart-section">
          <h3>기기별 사용 현황</h3>
          {deviceData.length > 0 ? (
            <PieChart
              data={deviceData}
              height={300}
              showLegend={true}
              showPercentages={true}
              animated={true}
              donut={true}
            />
          ) : (
            <div className="no-data">데이터가 없습니다</div>
          )}
        </div>

        {/* Top Pages */}
        <div className="chart-section">
          <h3>인기 페이지</h3>
          {topPagesData.length > 0 ? (
            <BarChart
              data={topPagesData}
              height={300}
              horizontal={true}
              showValues={true}
              animated={true}
              color="#17a2b8"
            />
          ) : (
            <div className="no-data">데이터가 없습니다</div>
          )}
        </div>

        {/* Usage by Hour */}
        <div className="chart-section full-width">
          <h3>시간대별 사용 패턴</h3>
          <LineChart
            data={hourlyData}
            height={300}
            xLabel="시간"
            yLabel="세션 수"
            showGrid={true}
            showDots={true}
            animated={true}
            color="#28a745"
          />
        </div>

        {/* Usage by Day */}
        <div className="chart-section">
          <h3>요일별 사용 패턴</h3>
          <BarChart
            data={dailyData}
            height={300}
            showValues={true}
            animated={true}
            color="#ffc107"
          />
        </div>

        {/* Top Actions */}
        <div className="chart-section">
          <h3>주요 활동</h3>
          {topActionsData.length > 0 ? (
            <BarChart
              data={topActionsData}
              height={300}
              horizontal={true}
              showValues={true}
              animated={true}
              color="#dc3545"
            />
          ) : (
            <div className="no-data">데이터가 없습니다</div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="behavior-insights">
        <h3>행동 인사이트</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <i className="fas fa-lightbulb"></i>
            <h4>피크 시간대</h4>
            <p>{getPeakHour(insights.timePatterns.byHour)}에 가장 활발하게 사용합니다.</p>
          </div>

          <div className="insight-card">
            <i className="fas fa-calendar-check"></i>
            <h4>활동적인 요일</h4>
            <p>{getPeakDay(insights.timePatterns.byDay)}에 가장 많이 방문합니다.</p>
          </div>

          <div className="insight-card">
            <i className="fas fa-mobile-alt"></i>
            <h4>주 사용 기기</h4>
            <p>{getMainDevice(insights.deviceBreakdown)}를 주로 사용합니다.</p>
          </div>

          <div className="insight-card">
            <i className="fas fa-star"></i>
            <h4>관심 페이지</h4>
            <p>{insights.topPages[0]?.page || '대시보드'} 페이지를 가장 자주 방문합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const formatDuration = (seconds) => {
  if (seconds < 60) return `${seconds}초`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분`;
  return `${Math.floor(seconds / 3600)}시간 ${Math.floor((seconds % 3600) / 60)}분`;
};

const getDayName = (day) => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[day] + '요일';
};

const formatActionName = (action) => {
  const actionLabels = {
    'click': '클릭',
    'form_submit': '폼 제출',
    'test_started': '검사 시작',
    'test_completed': '검사 완료',
    'report_viewed': '보고서 조회',
    'code_generated': '코드 생성',
    'code_sent': '코드 발송',
    'page_hidden': '페이지 이탈',
    'page_visible': '페이지 복귀'
  };
  return actionLabels[action] || action;
};

const getPeakHour = (hourData) => {
  const maxIndex = hourData.indexOf(Math.max(...hourData));
  return `${maxIndex}시 ~ ${maxIndex + 1}시`;
};

const getPeakDay = (dayData) => {
  const maxIndex = dayData.indexOf(Math.max(...dayData));
  return getDayName(maxIndex);
};

const getMainDevice = (deviceBreakdown) => {
  const devices = Object.entries(deviceBreakdown);
  if (devices.length === 0) return '알 수 없음';
  
  const sorted = devices.sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
};

export default UserBehaviorDashboard;
import React, { useState, useEffect } from 'react';
import { useOrganization } from '../../modules/organization/OrganizationContext';
import { useSupabaseQuery } from '../../core/hooks/useSupabaseQuery';
import { supabase } from '../../core/services/supabase';
import LineChart from '../charts/LineChart';
import BarChart from '../charts/BarChart';
import PieChart from '../charts/PieChart';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const { organization, getOrgNumber } = useOrganization();
  const orgNumber = getOrgNumber();
  
  const [dateRange, setDateRange] = useState('7days');
  const [selectedTestType, setSelectedTestType] = useState('all');

  // Fetch test completion trends
  const { data: trendsData, isLoading: trendsLoading } = useSupabaseQuery(
    ['testTrends', orgNumber, dateRange],
    async () => {
      const endDate = new Date();
      let startDate = new Date();
      
      switch(dateRange) {
        case '7days':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      const { data, error } = await supabase
        .from('test_results')
        .select('created_at')
        .eq('org_number', orgNumber)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at');

      if (error) throw error;

      // Group by date
      const grouped = {};
      data?.forEach(test => {
        const date = new Date(test.created_at).toLocaleDateString('ko-KR');
        grouped[date] = (grouped[date] || 0) + 1;
      });

      // Fill in missing dates
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const result = [];
      
      for (let i = 0; i <= days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toLocaleDateString('ko-KR');
        
        result.push({
          label: dateStr.slice(5), // Remove year
          value: grouped[dateStr] || 0
        });
      }

      return result;
    },
    { enabled: !!orgNumber }
  );

  // Fetch test type distribution
  const { data: typeDistribution, isLoading: typeLoading } = useSupabaseQuery(
    ['testTypeDistribution', orgNumber],
    async () => {
      const { data, error } = await supabase
        .from('test_results')
        .select('test_type')
        .eq('org_number', orgNumber);

      if (error) throw error;

      const counts = {};
      data?.forEach(test => {
        counts[test.test_type] = (counts[test.test_type] || 0) + 1;
      });

      return Object.entries(counts).map(([type, count]) => ({
        label: type === 'adult' ? '성인' : type === 'youth' ? '청소년' : '아동',
        value: count,
        color: type === 'adult' ? '#007bff' : type === 'youth' ? '#28a745' : '#ffc107'
      }));
    },
    { enabled: !!orgNumber }
  );

  // Fetch completion rate by test type
  const { data: completionRates, isLoading: completionLoading } = useSupabaseQuery(
    ['completionRates', orgNumber],
    async () => {
      const { data: codes, error } = await supabase
        .from('used_codes')
        .select('test_type, status')
        .eq('org_number', orgNumber);

      if (error) throw error;

      const stats = {};
      codes?.forEach(code => {
        if (!stats[code.test_type]) {
          stats[code.test_type] = { total: 0, completed: 0 };
        }
        stats[code.test_type].total++;
        if (code.status === '완료') {
          stats[code.test_type].completed++;
        }
      });

      return Object.entries(stats).map(([type, stat]) => ({
        label: type === 'adult' ? '성인' : type === 'youth' ? '청소년' : '아동',
        value: Math.round((stat.completed / stat.total) * 100),
        color: type === 'adult' ? '#007bff' : type === 'youth' ? '#28a745' : '#ffc107'
      }));
    },
    { enabled: !!orgNumber }
  );

  // Fetch score distribution
  const { data: scoreDistribution, isLoading: scoreLoading } = useSupabaseQuery(
    ['scoreDistribution', orgNumber, selectedTestType],
    async () => {
      let query = supabase
        .from('test_scores')
        .select('total_score, test_type')
        .eq('org_number', orgNumber);

      if (selectedTestType !== 'all') {
        query = query.eq('test_type', selectedTestType);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Create score ranges
      const ranges = [
        { min: 0, max: 20, label: '0-20' },
        { min: 21, max: 40, label: '21-40' },
        { min: 41, max: 60, label: '41-60' },
        { min: 61, max: 80, label: '61-80' },
        { min: 81, max: 100, label: '81-100' }
      ];

      const distribution = ranges.map(range => ({
        label: range.label,
        value: 0
      }));

      data?.forEach(score => {
        const rangeIndex = ranges.findIndex(r => 
          score.total_score >= r.min && score.total_score <= r.max
        );
        if (rangeIndex !== -1) {
          distribution[rangeIndex].value++;
        }
      });

      return distribution;
    },
    { enabled: !!orgNumber }
  );

  // Calculate summary statistics
  const summaryStats = {
    totalTests: trendsData?.reduce((sum, day) => sum + day.value, 0) || 0,
    avgTestsPerDay: trendsData?.length ? 
      Math.round(trendsData.reduce((sum, day) => sum + day.value, 0) / trendsData.length * 10) / 10 : 0,
    peakDay: trendsData?.reduce((max, day) => day.value > max.value ? day : max, { value: 0 }) || { value: 0 },
    growthRate: trendsData && trendsData.length > 1 ? 
      Math.round(((trendsData[trendsData.length - 1].value - trendsData[0].value) / (trendsData[0].value || 1)) * 100) : 0
  };

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>검사 분석 대시보드</h2>
        <div className="analytics-controls">
          <select 
            className="date-range-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7days">최근 7일</option>
            <option value="30days">최근 30일</option>
            <option value="90days">최근 90일</option>
            <option value="1year">최근 1년</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon">
            <i className="fas fa-clipboard-check"></i>
          </div>
          <div className="summary-content">
            <h4>총 검사 수</h4>
            <p className="summary-value">{summaryStats.totalTests}</p>
            <span className="summary-label">선택 기간 내</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="summary-content">
            <h4>일평균 검사</h4>
            <p className="summary-value">{summaryStats.avgTestsPerDay}</p>
            <span className="summary-label">건/일</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <i className="fas fa-trophy"></i>
          </div>
          <div className="summary-content">
            <h4>최다 검사일</h4>
            <p className="summary-value">{summaryStats.peakDay.value}</p>
            <span className="summary-label">건</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <i className="fas fa-percentage"></i>
          </div>
          <div className="summary-content">
            <h4>성장률</h4>
            <p className="summary-value">{summaryStats.growthRate > 0 ? '+' : ''}{summaryStats.growthRate}%</p>
            <span className="summary-label">첫날 대비</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Test Completion Trends */}
        <div className="chart-section full-width">
          <h3>검사 완료 추이</h3>
          {trendsLoading ? (
            <div className="chart-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>데이터 로딩 중...</p>
            </div>
          ) : (
            <LineChart
              data={trendsData || []}
              title=""
              xLabel="날짜"
              yLabel="검사 수"
              height={300}
              color="var(--primary-color)"
              showGrid={true}
              showDots={true}
              animated={true}
            />
          )}
        </div>

        {/* Test Type Distribution */}
        <div className="chart-section">
          <h3>검사 유형 분포</h3>
          {typeLoading ? (
            <div className="chart-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>데이터 로딩 중...</p>
            </div>
          ) : (
            <PieChart
              data={typeDistribution || []}
              title=""
              height={300}
              showLegend={true}
              showPercentages={true}
              animated={true}
              donut={true}
              donutWidth={60}
            />
          )}
        </div>

        {/* Completion Rate by Type */}
        <div className="chart-section">
          <h3>유형별 완료율</h3>
          {completionLoading ? (
            <div className="chart-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>데이터 로딩 중...</p>
            </div>
          ) : (
            <BarChart
              data={completionRates || []}
              title=""
              xLabel="검사 유형"
              yLabel="완료율 (%)"
              height={300}
              showGrid={true}
              animated={true}
              showValues={true}
            />
          )}
        </div>

        {/* Score Distribution */}
        <div className="chart-section full-width">
          <div className="chart-header">
            <h3>점수 분포</h3>
            <select
              className="test-type-select"
              value={selectedTestType}
              onChange={(e) => setSelectedTestType(e.target.value)}
            >
              <option value="all">전체</option>
              <option value="adult">성인</option>
              <option value="youth">청소년</option>
              <option value="child">아동</option>
            </select>
          </div>
          {scoreLoading ? (
            <div className="chart-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>데이터 로딩 중...</p>
            </div>
          ) : (
            <BarChart
              data={scoreDistribution || []}
              title=""
              xLabel="점수 범위"
              yLabel="검사 수"
              height={300}
              color="#17a2b8"
              showGrid={true}
              animated={true}
              showValues={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
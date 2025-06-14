import React, { useState, useEffect } from 'react';
import { useOrganization } from '../../modules/organization/OrganizationContext';
import { useSupabaseQuery } from '../../core/hooks/useSupabaseQuery';
import { supabase } from '../../core/services/supabase';
import BarChart from '../charts/BarChart';
import LineChart from '../charts/LineChart';
import './DataComparisonTool.css';

const DataComparisonTool = () => {
  const { getOrgNumber } = useOrganization();
  const [comparisonType, setComparisonType] = useState('period'); // period, group, individual
  const [selectedPeriods, setSelectedPeriods] = useState(['current', 'previous']);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedIndividuals, setSelectedIndividuals] = useState([]);
  const [metric, setMetric] = useState('averageScore');
  const [comparisonData, setComparisonData] = useState(null);

  const orgNumber = getOrgNumber();

  // Fetch available groups
  const { data: availableGroups } = useSupabaseQuery(
    ['availableGroups', orgNumber],
    async () => {
      const { data, error } = await supabase
        .from('test_results')
        .select('test_type')
        .eq('org_number', orgNumber)
        .limit(1000);

      if (error) throw error;

      // Get unique test types
      const types = [...new Set(data?.map(d => d.test_type) || [])];
      return types.map(type => ({
        value: type,
        label: type === 'adult' ? '성인' : type === 'youth' ? '청소년' : '아동'
      }));
    },
    { enabled: !!orgNumber }
  );

  // Fetch available individuals for comparison
  const { data: availableIndividuals } = useSupabaseQuery(
    ['availableIndividuals', orgNumber],
    async () => {
      const { data, error } = await supabase
        .from('customers_info')
        .select('id, name, customer_number')
        .eq('org_number', orgNumber)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    { enabled: !!orgNumber && comparisonType === 'individual' }
  );

  // Perform comparison
  useEffect(() => {
    if (!orgNumber) return;

    const performComparison = async () => {
      try {
        let data = null;

        switch (comparisonType) {
          case 'period':
            data = await comparePeriods();
            break;
          case 'group':
            data = await compareGroups();
            break;
          case 'individual':
            data = await compareIndividuals();
            break;
        }

        setComparisonData(data);
      } catch (error) {
        console.error('Comparison error:', error);
      }
    };

    performComparison();
  }, [comparisonType, selectedPeriods, selectedGroups, selectedIndividuals, metric, orgNumber]);

  const comparePeriods = async () => {
    const periods = {
      current: { start: new Date(), end: new Date() },
      previous: { start: new Date(), end: new Date() },
      lastYear: { start: new Date(), end: new Date() }
    };

    // Set period ranges
    periods.current.start.setMonth(periods.current.start.getMonth() - 1);
    periods.previous.start.setMonth(periods.previous.start.getMonth() - 2);
    periods.previous.end.setMonth(periods.previous.end.getMonth() - 1);
    periods.lastYear.start.setFullYear(periods.lastYear.start.getFullYear() - 1);
    periods.lastYear.end.setFullYear(periods.lastYear.end.getFullYear() - 1);

    const results = [];

    for (const periodKey of selectedPeriods) {
      const period = periods[periodKey];
      
      const { data: scores } = await supabase
        .from('test_scores')
        .select('total_score, created_at')
        .eq('org_number', orgNumber)
        .gte('created_at', period.start.toISOString())
        .lte('created_at', period.end.toISOString());

      const { data: tests } = await supabase
        .from('test_results')
        .select('status, created_at')
        .eq('org_number', orgNumber)
        .gte('created_at', period.start.toISOString())
        .lte('created_at', period.end.toISOString());

      const metrics = calculateMetrics(scores, tests);
      
      results.push({
        label: getPeriodLabel(periodKey),
        value: metrics[metric] || 0,
        color: getPeriodColor(periodKey),
        details: metrics
      });
    }

    return {
      type: 'bar',
      data: results,
      title: `기간별 ${getMetricLabel(metric)} 비교`
    };
  };

  const compareGroups = async () => {
    if (selectedGroups.length === 0) return null;

    const results = [];

    for (const group of selectedGroups) {
      const { data: scores } = await supabase
        .from('test_scores')
        .select('total_score')
        .eq('org_number', orgNumber)
        .eq('test_type', group);

      const { data: tests } = await supabase
        .from('test_results')
        .select('status')
        .eq('org_number', orgNumber)
        .eq('test_type', group);

      const metrics = calculateMetrics(scores, tests);
      
      results.push({
        label: group === 'adult' ? '성인' : group === 'youth' ? '청소년' : '아동',
        value: metrics[metric] || 0,
        color: getGroupColor(group),
        details: metrics
      });
    }

    return {
      type: 'bar',
      data: results,
      title: `그룹별 ${getMetricLabel(metric)} 비교`
    };
  };

  const compareIndividuals = async () => {
    if (selectedIndividuals.length === 0) return null;

    const results = [];

    for (const customerId of selectedIndividuals) {
      const { data: customer } = await supabase
        .from('customers_info')
        .select('name')
        .eq('id', customerId)
        .single();

      const { data: scores } = await supabase
        .from('test_scores')
        .select('total_score, created_at')
        .eq('customer_id', customerId)
        .order('created_at');

      if (scores && scores.length > 0) {
        if (metric === 'progress') {
          // Show progress over time
          const progressData = scores.map((score, index) => ({
            label: `검사 ${index + 1}`,
            value: score.total_score
          }));

          results.push({
            name: customer?.name || 'Unknown',
            data: progressData
          });
        } else {
          // Show single metric
          const metrics = calculateMetrics(scores, []);
          
          results.push({
            label: customer?.name || 'Unknown',
            value: metrics[metric] || 0,
            details: metrics
          });
        }
      }
    }

    if (metric === 'progress') {
      return {
        type: 'line',
        data: results,
        title: '개인별 점수 변화 추이'
      };
    }

    return {
      type: 'bar',
      data: results,
      title: `개인별 ${getMetricLabel(metric)} 비교`
    };
  };

  const calculateMetrics = (scores, tests) => {
    const totalScores = scores?.map(s => s.total_score) || [];
    const completedTests = tests?.filter(t => t.status === '완료').length || 0;
    const totalTests = tests?.length || 0;

    return {
      averageScore: totalScores.length > 0 
        ? Math.round(totalScores.reduce((a, b) => a + b, 0) / totalScores.length)
        : 0,
      maxScore: totalScores.length > 0 ? Math.max(...totalScores) : 0,
      minScore: totalScores.length > 0 ? Math.min(...totalScores) : 0,
      totalCount: totalTests,
      completionRate: totalTests > 0 
        ? Math.round((completedTests / totalTests) * 100)
        : 0,
      scoreRange: totalScores.length > 0 
        ? Math.max(...totalScores) - Math.min(...totalScores)
        : 0
    };
  };

  const getPeriodLabel = (period) => {
    const labels = {
      current: '이번 달',
      previous: '지난 달',
      lastYear: '작년 같은 기간'
    };
    return labels[period] || period;
  };

  const getPeriodColor = (period) => {
    const colors = {
      current: '#007bff',
      previous: '#28a745',
      lastYear: '#ffc107'
    };
    return colors[period] || '#6c757d';
  };

  const getGroupColor = (group) => {
    const colors = {
      adult: '#007bff',
      youth: '#28a745',
      child: '#ffc107'
    };
    return colors[group] || '#6c757d';
  };

  const getMetricLabel = (metric) => {
    const labels = {
      averageScore: '평균 점수',
      maxScore: '최고 점수',
      minScore: '최저 점수',
      totalCount: '총 검사 수',
      completionRate: '완료율 (%)',
      scoreRange: '점수 범위',
      progress: '진행 상황'
    };
    return labels[metric] || metric;
  };

  return (
    <div className="data-comparison-tool">
      <h3>데이터 비교 분석</h3>

      <div className="comparison-controls">
        <div className="control-group">
          <label>비교 유형</label>
          <div className="comparison-type-buttons">
            <button
              className={`type-btn ${comparisonType === 'period' ? 'active' : ''}`}
              onClick={() => setComparisonType('period')}
            >
              <i className="fas fa-calendar"></i>
              기간별
            </button>
            <button
              className={`type-btn ${comparisonType === 'group' ? 'active' : ''}`}
              onClick={() => setComparisonType('group')}
            >
              <i className="fas fa-users"></i>
              그룹별
            </button>
            <button
              className={`type-btn ${comparisonType === 'individual' ? 'active' : ''}`}
              onClick={() => setComparisonType('individual')}
            >
              <i className="fas fa-user"></i>
              개인별
            </button>
          </div>
        </div>

        <div className="control-group">
          <label>측정 지표</label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
          >
            <option value="averageScore">평균 점수</option>
            <option value="maxScore">최고 점수</option>
            <option value="minScore">최저 점수</option>
            <option value="totalCount">총 검사 수</option>
            <option value="completionRate">완료율</option>
            <option value="scoreRange">점수 범위</option>
            {comparisonType === 'individual' && (
              <option value="progress">진행 상황</option>
            )}
          </select>
        </div>

        {comparisonType === 'period' && (
          <div className="control-group">
            <label>비교 기간</label>
            <div className="multi-select">
              {['current', 'previous', 'lastYear'].map(period => (
                <label key={period} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedPeriods.includes(period)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPeriods([...selectedPeriods, period]);
                      } else {
                        setSelectedPeriods(selectedPeriods.filter(p => p !== period));
                      }
                    }}
                  />
                  {getPeriodLabel(period)}
                </label>
              ))}
            </div>
          </div>
        )}

        {comparisonType === 'group' && (
          <div className="control-group">
            <label>비교 그룹</label>
            <div className="multi-select">
              {availableGroups?.map(group => (
                <label key={group.value} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes(group.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGroups([...selectedGroups, group.value]);
                      } else {
                        setSelectedGroups(selectedGroups.filter(g => g !== group.value));
                      }
                    }}
                  />
                  {group.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {comparisonType === 'individual' && (
          <div className="control-group">
            <label>비교 대상 (최대 5명)</label>
            <select
              multiple
              className="individual-select"
              value={selectedIndividuals}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                if (selected.length <= 5) {
                  setSelectedIndividuals(selected);
                }
              }}
            >
              {availableIndividuals?.map(individual => (
                <option key={individual.id} value={individual.id}>
                  {individual.name} ({individual.customer_number})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="comparison-chart">
        {comparisonData ? (
          <>
            {comparisonData.type === 'bar' ? (
              <BarChart
                data={comparisonData.data}
                title={comparisonData.title}
                height={400}
                showGrid={true}
                animated={true}
                showValues={true}
              />
            ) : comparisonData.type === 'line' ? (
              <div className="line-charts">
                {comparisonData.data.map((individual, index) => (
                  <div key={index} className="individual-chart">
                    <h4>{individual.name}</h4>
                    <LineChart
                      data={individual.data}
                      height={200}
                      color={`hsl(${index * 60}, 70%, 50%)`}
                      showGrid={true}
                      animated={true}
                      showDots={true}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {comparisonData.data && comparisonData.data[0]?.details && (
              <div className="comparison-details">
                <h4>상세 정보</h4>
                <table className="details-table">
                  <thead>
                    <tr>
                      <th>항목</th>
                      {comparisonData.data.map((item, index) => (
                        <th key={index}>{item.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(comparisonData.data[0].details).map(key => (
                      <tr key={key}>
                        <td>{getMetricLabel(key)}</td>
                        {comparisonData.data.map((item, index) => (
                          <td key={index}>
                            {typeof item.details[key] === 'number' 
                              ? item.details[key].toLocaleString()
                              : item.details[key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="no-data">
            <i className="fas fa-chart-bar"></i>
            <p>비교할 데이터를 선택해주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataComparisonTool;
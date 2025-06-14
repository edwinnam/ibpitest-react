import React, { useState } from 'react';
import { useOrganization } from '../../modules/organization/OrganizationContext';
import { supabase } from '../../core/services/supabase';
import { exportToExcel, exportToCSV } from '../../core/services/exportService';
import './DataExportTool.css';

const DataExportTool = () => {
  const { getOrgNumber } = useOrganization();
  const [exporting, setExporting] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    dataType: 'test_results',
    format: 'excel',
    dateRange: '30days',
    includePersonalInfo: true,
    includeScores: true,
    includeResponses: false,
    groupBy: 'none'
  });

  const handleExport = async () => {
    setExporting(true);
    const orgNumber = getOrgNumber();

    try {
      // Calculate date range
      const endDate = new Date();
      let startDate = new Date();
      
      switch(exportConfig.dateRange) {
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
        case 'all':
          startDate = new Date('2020-01-01');
          break;
      }

      let data = [];
      
      // Fetch data based on type
      switch(exportConfig.dataType) {
        case 'test_results':
          const { data: results, error: resultsError } = await supabase
            .from('test_results')
            .select(`
              *,
              customers_info (
                name,
                phone,
                birth_date,
                gender,
                email
              ),
              test_scores (
                total_score,
                category_scores
              )
            `)
            .eq('org_number', orgNumber)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: false });

          if (resultsError) throw resultsError;
          data = formatTestResults(results);
          break;

        case 'customers':
          const { data: customers, error: customersError } = await supabase
            .from('customers_info')
            .select(`
              *,
              test_results (
                test_type,
                created_at,
                completed_at
              ),
              test_scores (
                total_score
              )
            `)
            .eq('org_number', orgNumber)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: false });

          if (customersError) throw customersError;
          data = formatCustomers(customers);
          break;

        case 'codes':
          const { data: codes, error: codesError } = await supabase
            .from('used_codes')
            .select('*')
            .eq('org_number', orgNumber)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: false });

          if (codesError) throw codesError;
          data = formatCodes(codes);
          break;

        case 'statistics':
          data = await generateStatisticsReport(orgNumber, startDate, endDate);
          break;
      }

      // Apply grouping if needed
      if (exportConfig.groupBy !== 'none') {
        data = groupData(data, exportConfig.groupBy);
      }

      // Filter columns based on config
      if (!exportConfig.includePersonalInfo) {
        data = data.map(row => {
          const { name, phone, email, birth_date, ...rest } = row;
          return rest;
        });
      }

      // Export data
      const filename = `${exportConfig.dataType}_${new Date().toISOString().split('T')[0]}`;
      
      if (exportConfig.format === 'excel') {
        await exportToExcel(data, filename, {
          sheetName: getSheetName(exportConfig.dataType),
          includeTimestamp: true
        });
      } else if (exportConfig.format === 'csv') {
        exportToCSV(data, filename);
      } else if (exportConfig.format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }

      alert('데이터 내보내기가 완료되었습니다.');
    } catch (error) {
      console.error('Export error:', error);
      alert('데이터 내보내기 중 오류가 발생했습니다.');
    } finally {
      setExporting(false);
    }
  };

  const formatTestResults = (results) => {
    return results.map(result => ({
      '검사일': new Date(result.created_at).toLocaleDateString('ko-KR'),
      '이름': result.customers_info?.name || '-',
      '성별': result.customers_info?.gender || '-',
      '연령': calculateAge(result.customers_info?.birth_date),
      '검사유형': getTestTypeLabel(result.test_type),
      '총점': result.test_scores?.[0]?.total_score || '-',
      '상태': result.status,
      '완료시간': result.completed_at ? new Date(result.completed_at).toLocaleString('ko-KR') : '-'
    }));
  };

  const formatCustomers = (customers) => {
    return customers.map(customer => ({
      '등록일': new Date(customer.created_at).toLocaleDateString('ko-KR'),
      '이름': customer.name,
      '성별': customer.gender,
      '생년월일': customer.birth_date,
      '연락처': customer.phone,
      '이메일': customer.email || '-',
      '검사횟수': customer.test_results?.length || 0,
      '최근검사': customer.test_results?.[0]?.created_at 
        ? new Date(customer.test_results[0].created_at).toLocaleDateString('ko-KR') 
        : '-',
      '평균점수': customer.test_scores?.length 
        ? Math.round(customer.test_scores.reduce((sum, score) => sum + score.total_score, 0) / customer.test_scores.length)
        : '-'
    }));
  };

  const formatCodes = (codes) => {
    return codes.map(code => ({
      '생성일': new Date(code.created_at).toLocaleDateString('ko-KR'),
      '코드': code.code,
      '이름': code.name,
      '연락처': code.phone,
      '검사유형': getTestTypeLabel(code.test_type),
      '상태': code.status,
      '발송상태': code.send_status || '-',
      '발송일': code.sent_at ? new Date(code.sent_at).toLocaleDateString('ko-KR') : '-',
      '만료일': code.expires_at ? new Date(code.expires_at).toLocaleDateString('ko-KR') : '-'
    }));
  };

  const generateStatisticsReport = async (orgNumber, startDate, endDate) => {
    // Fetch various statistics
    const { data: testStats } = await supabase
      .from('test_results')
      .select('test_type, status')
      .eq('org_number', orgNumber)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { data: scoreStats } = await supabase
      .from('test_scores')
      .select('total_score, test_type')
      .eq('org_number', orgNumber)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Calculate statistics
    const stats = {
      '기간': `${startDate.toLocaleDateString('ko-KR')} ~ ${endDate.toLocaleDateString('ko-KR')}`,
      '총 검사 수': testStats?.length || 0,
      '완료된 검사': testStats?.filter(t => t.status === '완료').length || 0,
      '진행중 검사': testStats?.filter(t => t.status === '진행중').length || 0,
      '평균 점수': scoreStats?.length 
        ? Math.round(scoreStats.reduce((sum, s) => sum + s.total_score, 0) / scoreStats.length)
        : 0,
      '최고 점수': scoreStats?.length 
        ? Math.max(...scoreStats.map(s => s.total_score))
        : 0,
      '최저 점수': scoreStats?.length 
        ? Math.min(...scoreStats.map(s => s.total_score))
        : 0
    };

    // Group by test type
    const byType = {};
    ['adult', 'youth', 'child'].forEach(type => {
      const typeTests = testStats?.filter(t => t.test_type === type) || [];
      const typeScores = scoreStats?.filter(s => s.test_type === type) || [];
      
      byType[getTestTypeLabel(type)] = {
        '검사 수': typeTests.length,
        '완료율': typeTests.length 
          ? Math.round((typeTests.filter(t => t.status === '완료').length / typeTests.length) * 100) + '%'
          : '0%',
        '평균 점수': typeScores.length
          ? Math.round(typeScores.reduce((sum, s) => sum + s.total_score, 0) / typeScores.length)
          : 0
      };
    });

    return [stats, ...Object.entries(byType).map(([type, data]) => ({
      '검사 유형': type,
      ...data
    }))];
  };

  const groupData = (data, groupBy) => {
    const grouped = {};
    
    data.forEach(row => {
      const key = row[groupBy] || '기타';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(row);
    });

    // Format grouped data for export
    const result = [];
    Object.entries(grouped).forEach(([group, items]) => {
      result.push({ [groupBy]: group, '건수': items.length });
      result.push(...items);
      result.push({}); // Empty row for separation
    });

    return result;
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getTestTypeLabel = (type) => {
    const labels = {
      'adult': '성인',
      'youth': '청소년',
      'child': '아동'
    };
    return labels[type] || type;
  };

  const getSheetName = (dataType) => {
    const names = {
      'test_results': '검사결과',
      'customers': '고객정보',
      'codes': '검사코드',
      'statistics': '통계'
    };
    return names[dataType] || dataType;
  };

  return (
    <div className="data-export-tool">
      <h3>데이터 내보내기</h3>
      
      <div className="export-config">
        <div className="config-group">
          <label>데이터 유형</label>
          <select
            value={exportConfig.dataType}
            onChange={(e) => setExportConfig({...exportConfig, dataType: e.target.value})}
          >
            <option value="test_results">검사 결과</option>
            <option value="customers">고객 정보</option>
            <option value="codes">검사 코드</option>
            <option value="statistics">통계 보고서</option>
          </select>
        </div>

        <div className="config-group">
          <label>기간</label>
          <select
            value={exportConfig.dateRange}
            onChange={(e) => setExportConfig({...exportConfig, dateRange: e.target.value})}
          >
            <option value="7days">최근 7일</option>
            <option value="30days">최근 30일</option>
            <option value="90days">최근 90일</option>
            <option value="1year">최근 1년</option>
            <option value="all">전체</option>
          </select>
        </div>

        <div className="config-group">
          <label>파일 형식</label>
          <select
            value={exportConfig.format}
            onChange={(e) => setExportConfig({...exportConfig, format: e.target.value})}
          >
            <option value="excel">Excel (.xlsx)</option>
            <option value="csv">CSV (.csv)</option>
            <option value="json">JSON (.json)</option>
          </select>
        </div>

        {exportConfig.dataType !== 'statistics' && (
          <div className="config-group">
            <label>그룹화</label>
            <select
              value={exportConfig.groupBy}
              onChange={(e) => setExportConfig({...exportConfig, groupBy: e.target.value})}
            >
              <option value="none">없음</option>
              <option value="검사유형">검사 유형별</option>
              <option value="상태">상태별</option>
              <option value="성별">성별</option>
            </select>
          </div>
        )}

        <div className="config-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={exportConfig.includePersonalInfo}
              onChange={(e) => setExportConfig({...exportConfig, includePersonalInfo: e.target.checked})}
            />
            개인정보 포함
          </label>
          
          {exportConfig.dataType === 'test_results' && (
            <>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={exportConfig.includeScores}
                  onChange={(e) => setExportConfig({...exportConfig, includeScores: e.target.checked})}
                />
                점수 포함
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={exportConfig.includeResponses}
                  onChange={(e) => setExportConfig({...exportConfig, includeResponses: e.target.checked})}
                />
                응답 내용 포함
              </label>
            </>
          )}
        </div>
      </div>

      <div className="export-actions">
        <button
          className="btn-export"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              내보내는 중...
            </>
          ) : (
            <>
              <i className="fas fa-download"></i>
              내보내기
            </>
          )}
        </button>
      </div>

      <div className="export-info">
        <p className="info-text">
          <i className="fas fa-info-circle"></i>
          내보낸 데이터는 개인정보보호법에 따라 안전하게 관리해주세요.
        </p>
      </div>
    </div>
  );
};

export default DataExportTool;
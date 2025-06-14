import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../core/services/supabase';
import './DataManagementPage.css';

const DataManagementPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('customers');
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrganizations: 0,
    totalTests: 0,
    totalCodes: 0,
  });

  useEffect(() => {
    fetchStats();
    fetchData();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const [
        { count: customerCount },
        { count: orgCount },
        { count: testCount },
        { count: codeCount }
      ] = await Promise.all([
        supabase.from('customers_info').select('*', { count: 'exact', head: true }),
        supabase.from('biz_partner_info').select('*', { count: 'exact', head: true }),
        supabase.from('test_results').select('*', { count: 'exact', head: true }),
        supabase.from('test_codes').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        totalCustomers: customerCount || 0,
        totalOrganizations: orgCount || 0,
        totalTests: testCount || 0,
        totalCodes: codeCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      let query;
      
      switch (activeTab) {
        case 'customers':
          query = supabase
            .from('customers_info')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
          break;
          
        case 'organizations':
          query = supabase
            .from('biz_partner_info')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
          break;
          
        case 'tests':
          query = supabase
            .from('test_results')
            .select('*, customers_info(name, customer_number)')
            .order('created_at', { ascending: false })
            .limit(100);
          break;
          
        case 'codes':
          query = supabase
            .from('test_codes')
            .select('*, biz_partner_info(org_name)')
            .order('created_at', { ascending: false })
            .limit(100);
          break;
          
        default:
          return;
      }
      
      const { data: result, error } = await query;
      
      if (error) throw error;
      setData(result || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({
        type: 'error',
        text: '데이터를 불러오는 중 오류가 발생했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    switch (activeTab) {
      case 'customers':
        return (
          item.name?.toLowerCase().includes(searchLower) ||
          item.email?.toLowerCase().includes(searchLower) ||
          item.customer_number?.toLowerCase().includes(searchLower)
        );
        
      case 'organizations':
        return (
          item.org_name?.toLowerCase().includes(searchLower) ||
          item.org_email?.toLowerCase().includes(searchLower) ||
          item.org_number?.toLowerCase().includes(searchLower)
        );
        
      case 'tests':
        return (
          item.test_id?.toLowerCase().includes(searchLower) ||
          item.customers_info?.name?.toLowerCase().includes(searchLower)
        );
        
      case 'codes':
        return (
          item.code?.toLowerCase().includes(searchLower) ||
          item.biz_partner_info?.org_name?.toLowerCase().includes(searchLower)
        );
        
      default:
        return true;
    }
  });

  const handleSelectItem = (id) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredData.map(item => item.id || item.customer_number || item.org_number));
    }
  };

  const handleExport = async () => {
    if (selectedItems.length === 0) {
      setMessage({
        type: 'error',
        text: '내보낼 항목을 선택해주세요.',
      });
      return;
    }

    try {
      const exportData = filteredData.filter(item => {
        const id = item.id || item.customer_number || item.org_number;
        return selectedItems.includes(id);
      });

      const csv = convertToCSV(exportData);
      downloadCSV(csv, `${activeTab}_export_${new Date().toISOString().split('T')[0]}.csv`);

      setMessage({
        type: 'success',
        text: `${selectedItems.length}개 항목이 성공적으로 내보내졌습니다.`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      setMessage({
        type: 'error',
        text: '데이터 내보내기 중 오류가 발생했습니다.',
      });
    }
  };

  const convertToCSV = (data) => {
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return `"${value || ''}"`;
      }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderDataTable = () => {
    if (isLoading) {
      return <div className="loading">데이터를 불러오는 중...</div>;
    }

    if (!filteredData.length) {
      return <div className="no-data">표시할 데이터가 없습니다.</div>;
    }

    switch (activeTab) {
      case 'customers':
        return (
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredData.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>고객번호</th>
                <th>이름</th>
                <th>이메일</th>
                <th>성별</th>
                <th>가입일</th>
                <th>검사 횟수</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(customer => (
                <tr key={customer.customer_number}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(customer.customer_number)}
                      onChange={() => handleSelectItem(customer.customer_number)}
                    />
                  </td>
                  <td>{customer.customer_number}</td>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.gender === 'male' ? '남성' : '여성'}</td>
                  <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                  <td>{customer.test_count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'organizations':
        return (
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredData.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>기관코드</th>
                <th>기관명</th>
                <th>이메일</th>
                <th>담당자</th>
                <th>가입일</th>
                <th>발급 코드</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(org => (
                <tr key={org.org_number}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(org.org_number)}
                      onChange={() => handleSelectItem(org.org_number)}
                    />
                  </td>
                  <td>{org.org_number}</td>
                  <td>{org.org_name}</td>
                  <td>{org.org_email}</td>
                  <td>{org.org_manager}</td>
                  <td>{new Date(org.created_at).toLocaleDateString()}</td>
                  <td>{(org.unused_codes_count || 0) + (org.used_codes_count || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'tests':
        return (
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredData.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>검사 ID</th>
                <th>고객명</th>
                <th>검사 유형</th>
                <th>검사일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(test => (
                <tr key={test.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(test.id)}
                      onChange={() => handleSelectItem(test.id)}
                    />
                  </td>
                  <td>{test.test_id}</td>
                  <td>{test.customers_info?.name}</td>
                  <td>{test.test_type}</td>
                  <td>{new Date(test.test_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`status ${test.status}`}>
                      {test.status === 'completed' ? '완료' : '진행중'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'codes':
        return (
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredData.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>코드</th>
                <th>기관명</th>
                <th>상태</th>
                <th>생성일</th>
                <th>사용일</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(code => (
                <tr key={code.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(code.id)}
                      onChange={() => handleSelectItem(code.id)}
                    />
                  </td>
                  <td>{code.code}</td>
                  <td>{code.biz_partner_info?.org_name}</td>
                  <td>
                    <span className={`status ${code.is_used ? 'used' : 'unused'}`}>
                      {code.is_used ? '사용됨' : '미사용'}
                    </span>
                  </td>
                  <td>{new Date(code.created_at).toLocaleDateString()}</td>
                  <td>{code.used_at ? new Date(code.used_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      default:
        return null;
    }
  };

  return (
    <div className="data-management-page">
      <div className="data-management-container">
        <div className="page-header">
          <h1>데이터 관리</h1>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="back-button"
          >
            대시보드로 돌아가기
          </button>
        </div>

        <div className="stats-cards">
          <div className="stat-card">
            <h3>전체 고객</h3>
            <p>{stats.totalCustomers.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h3>전체 기관</h3>
            <p>{stats.totalOrganizations.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h3>전체 검사</h3>
            <p>{stats.totalTests.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h3>전체 코드</h3>
            <p>{stats.totalCodes.toLocaleString()}</p>
          </div>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="data-tabs">
          <button
            className={`tab ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            고객 관리
          </button>
          <button
            className={`tab ${activeTab === 'organizations' ? 'active' : ''}`}
            onClick={() => setActiveTab('organizations')}
          >
            기관 관리
          </button>
          <button
            className={`tab ${activeTab === 'tests' ? 'active' : ''}`}
            onClick={() => setActiveTab('tests')}
          >
            검사 관리
          </button>
          <button
            className={`tab ${activeTab === 'codes' ? 'active' : ''}`}
            onClick={() => setActiveTab('codes')}
          >
            코드 관리
          </button>
        </div>

        <div className="data-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
          <div className="action-buttons">
            <button
              onClick={handleExport}
              className="export-button"
              disabled={selectedItems.length === 0}
            >
              선택 항목 내보내기 ({selectedItems.length})
            </button>
            <button
              onClick={fetchData}
              className="refresh-button"
            >
              새로고침
            </button>
          </div>
        </div>

        <div className="data-content">
          {renderDataTable()}
        </div>
      </div>
    </div>
  );
};

export default DataManagementPage;
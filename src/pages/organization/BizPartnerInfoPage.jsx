import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../core/services/supabase';
import './BizPartnerInfoPage.css';

const BizPartnerInfoPage = () => {
  const navigate = useNavigate();
  const [bizInfo, setBizInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    org_name: '',
    org_email: '',
    org_phone: '',
    org_manager: '',
    org_address: '',
    postcode: '',
    road_address: '',
    detail_address: '',
    province: '',
    city: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchBizInfo();
  }, []);

  const fetchBizInfo = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth/login');
        return;
      }

      // Fetch organization info
      const { data: orgData, error: orgError } = await supabase
        .from('biz_partner_info')
        .select('*')
        .eq('org_email', user.email)
        .single();

      if (orgError) throw orgError;

      setBizInfo(orgData);
      setFormData({
        org_name: orgData.org_name || '',
        org_email: orgData.org_email || '',
        org_phone: orgData.org_phone || '',
        org_manager: orgData.org_manager || '',
        org_address: orgData.org_address || '',
        postcode: orgData.postcode || '',
        road_address: orgData.road_address || '',
        detail_address: orgData.detail_address || '',
        province: orgData.province || '',
        city: orgData.city || '',
      });
    } catch (error) {
      console.error('Error fetching biz info:', error);
      setMessage({
        type: 'error',
        text: '기관 정보를 불러오는 중 오류가 발생했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth/login');
        return;
      }

      // Update organization info
      const { error: updateError } = await supabase
        .from('biz_partner_info')
        .update({
          org_name: formData.org_name,
          org_phone: formData.org_phone,
          org_manager: formData.org_manager,
          org_address: formData.org_address,
          postcode: formData.postcode,
          road_address: formData.road_address,
          detail_address: formData.detail_address,
          province: formData.province,
          city: formData.city,
          updated_at: new Date().toISOString(),
        })
        .eq('org_number', bizInfo.org_number);

      if (updateError) throw updateError;

      setMessage({
        type: 'success',
        text: '기관 정보가 성공적으로 업데이트되었습니다.',
      });
      setIsEditing(false);
      fetchBizInfo();
    } catch (error) {
      console.error('Error updating biz info:', error);
      setMessage({
        type: 'error',
        text: '정보 업데이트 중 오류가 발생했습니다.',
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original values
    if (bizInfo) {
      setFormData({
        org_name: bizInfo.org_name || '',
        org_email: bizInfo.org_email || '',
        org_phone: bizInfo.org_phone || '',
        org_manager: bizInfo.org_manager || '',
        org_address: bizInfo.org_address || '',
        postcode: bizInfo.postcode || '',
        road_address: bizInfo.road_address || '',
        detail_address: bizInfo.detail_address || '',
        province: bizInfo.province || '',
        city: bizInfo.city || '',
      });
    }
    setMessage({ type: '', text: '' });
  };

  if (isLoading) {
    return (
      <div className="biz-info-page">
        <div className="loading">정보를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="biz-info-page">
      <div className="biz-info-container">
        <div className="page-header">
          <h1>기관 정보 관리</h1>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="back-button"
          >
            대시보드로 돌아가기
          </button>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="biz-info-card">
          <div className="card-header">
            <h2>기관 정보</h2>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)} 
                className="edit-button"
              >
                수정
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="biz-info-form">
            <div className="form-section">
              <h3>기본 정보</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="org_name">기관명</label>
                  <input
                    type="text"
                    id="org_name"
                    name="org_name"
                    value={formData.org_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="org_email">이메일</label>
                  <input
                    type="email"
                    id="org_email"
                    name="org_email"
                    value={formData.org_email}
                    disabled
                    title="이메일은 변경할 수 없습니다"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="org_phone">전화번호</label>
                  <input
                    type="tel"
                    id="org_phone"
                    name="org_phone"
                    value={formData.org_phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="02-0000-0000"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="org_manager">담당자명</label>
                  <input
                    type="text"
                    id="org_manager"
                    name="org_manager"
                    value={formData.org_manager}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="담당자 성함"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>주소 정보</h3>
              
              <div className="form-row">
                <div className="form-group postcode-group">
                  <label htmlFor="postcode">우편번호</label>
                  <input
                    type="text"
                    id="postcode"
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="12345"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="province">시/도</label>
                  <input
                    type="text"
                    id="province"
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="서울특별시"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="city">시/군/구</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="강남구"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="road_address">도로명 주소</label>
                <input
                  type="text"
                  id="road_address"
                  name="road_address"
                  value={formData.road_address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="도로명 주소를 입력하세요"
                />
              </div>

              <div className="form-group">
                <label htmlFor="detail_address">상세 주소</label>
                <input
                  type="text"
                  id="detail_address"
                  name="detail_address"
                  value={formData.detail_address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="상세 주소를 입력하세요"
                />
              </div>

              <div className="form-group">
                <label htmlFor="org_address">전체 주소</label>
                <input
                  type="text"
                  id="org_address"
                  name="org_address"
                  value={formData.org_address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="전체 주소"
                />
              </div>
            </div>

            {isEditing && (
              <div className="form-actions">
                <button type="submit" className="save-button">
                  저장
                </button>
                <button 
                  type="button" 
                  onClick={handleCancel} 
                  className="cancel-button"
                >
                  취소
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="info-cards">
          <div className="info-card">
            <h3>기관 코드</h3>
            <p>{bizInfo?.org_number}</p>
          </div>
          <div className="info-card">
            <h3>가입일</h3>
            <p>{bizInfo?.created_at ? new Date(bizInfo.created_at).toLocaleDateString() : '-'}</p>
          </div>
          <div className="info-card">
            <h3>사용 가능한 코드</h3>
            <p>{bizInfo?.unused_codes_count || 0}개</p>
          </div>
          <div className="info-card">
            <h3>사용된 코드</h3>
            <p>{bizInfo?.used_codes_count || 0}개</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BizPartnerInfoPage;
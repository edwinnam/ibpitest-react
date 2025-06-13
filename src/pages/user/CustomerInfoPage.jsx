import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../core/services/supabase';
import './CustomerInfoPage.css';

const CustomerInfoPage = () => {
  const navigate = useNavigate();
  const [customerInfo, setCustomerInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birth_date: '',
    gender: '',
    address: '',
    postcode: '',
    road_address: '',
    detail_address: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchCustomerInfo();
  }, []);

  const fetchCustomerInfo = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/customer/login');
        return;
      }

      // Fetch customer info
      const { data: customerData, error: customerError } = await supabase
        .from('customers_info')
        .select('*')
        .eq('email', user.email)
        .single();

      if (customerError) throw customerError;

      // Fetch address info
      const { data: addressData, error: addressError } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customerData.id)
        .single();

      if (!addressError && addressData) {
        setCustomerInfo({ ...customerData, ...addressData });
        setFormData({
          name: customerData.name || '',
          email: customerData.email || '',
          phone: customerData.phone || '',
          birth_date: customerData.birth_date || '',
          gender: customerData.gender || '',
          address: addressData.address || '',
          postcode: addressData.postcode || '',
          road_address: addressData.road_address || '',
          detail_address: addressData.detail_address || '',
        });
      } else {
        setCustomerInfo(customerData);
        setFormData({
          name: customerData.name || '',
          email: customerData.email || '',
          phone: customerData.phone || '',
          birth_date: customerData.birth_date || '',
          gender: customerData.gender || '',
          address: '',
          postcode: '',
          road_address: '',
          detail_address: '',
        });
      }
    } catch (error) {
      console.error('Error fetching customer info:', error);
      setMessage({
        type: 'error',
        text: '고객 정보를 불러오는 중 오류가 발생했습니다.',
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
        navigate('/customer/login');
        return;
      }

      // Update customer info
      const { error: updateError } = await supabase
        .from('customers_info')
        .update({
          name: formData.name,
          phone: formData.phone,
          birth_date: formData.birth_date,
          gender: formData.gender,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerInfo.id);

      if (updateError) throw updateError;

      // Update or insert address
      if (formData.address || formData.postcode || formData.road_address) {
        const addressData = {
          customer_id: customerInfo.id,
          address: formData.address,
          postcode: formData.postcode,
          road_address: formData.road_address,
          detail_address: formData.detail_address,
          updated_at: new Date().toISOString(),
        };

        const { error: addressError } = await supabase
          .from('customer_addresses')
          .upsert(addressData, {
            onConflict: 'customer_id',
          });

        if (addressError) throw addressError;
      }

      setMessage({
        type: 'success',
        text: '정보가 성공적으로 업데이트되었습니다.',
      });
      setIsEditing(false);
      fetchCustomerInfo();
    } catch (error) {
      console.error('Error updating customer info:', error);
      setMessage({
        type: 'error',
        text: '정보 업데이트 중 오류가 발생했습니다.',
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original values
    if (customerInfo) {
      setFormData({
        name: customerInfo.name || '',
        email: customerInfo.email || '',
        phone: customerInfo.phone || '',
        birth_date: customerInfo.birth_date || '',
        gender: customerInfo.gender || '',
        address: customerInfo.address || '',
        postcode: customerInfo.postcode || '',
        road_address: customerInfo.road_address || '',
        detail_address: customerInfo.detail_address || '',
      });
    }
    setMessage({ type: '', text: '' });
  };

  if (isLoading) {
    return (
      <div className="customer-info-page">
        <div className="loading">정보를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="customer-info-page">
      <div className="customer-info-container">
        <div className="page-header">
          <h1>내 정보 관리</h1>
          <button 
            onClick={() => navigate('/mypage')} 
            className="back-button"
          >
            마이페이지로 돌아가기
          </button>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="customer-info-card">
          <div className="card-header">
            <h2>개인 정보</h2>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)} 
                className="edit-button"
              >
                수정
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="customer-info-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">이름</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">이메일</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  title="이메일은 변경할 수 없습니다"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">전화번호</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="010-0000-0000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="birth_date">생년월일</label>
                <input
                  type="date"
                  id="birth_date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="form-group">
              <label>성별</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                  남성
                </label>
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                  여성
                </label>
              </div>
            </div>

            <div className="address-section">
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

        <div className="info-footer">
          <p>고객번호: {customerInfo?.customer_number}</p>
          <p>가입일: {customerInfo?.created_at ? new Date(customerInfo.created_at).toLocaleDateString() : '-'}</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerInfoPage;
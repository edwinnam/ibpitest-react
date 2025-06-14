import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../core/services/supabase';
import './ResetPasswordPage.css';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: '비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을 확인해 주세요.',
      });
    } catch (error) {
      console.error('Password reset error:', error);
      setMessage({
        type: 'error',
        text: '비밀번호 재설정 중 오류가 발생했습니다. 다시 시도해 주세요.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-card">
          <h2 className="reset-password-title">비밀번호 재설정</h2>
          
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="reset-password-form">
            <div className="form-group">
              <label htmlFor="email">이메일 주소</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="가입하신 이메일 주소를 입력하세요"
                required
                disabled={isLoading}
              />
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? '전송 중...' : '재설정 링크 전송'}
            </button>
          </form>

          <div className="form-footer">
            <button 
              onClick={() => navigate('/auth/login')} 
              className="back-to-login"
            >
              로그인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
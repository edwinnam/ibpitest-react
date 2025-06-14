import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../core/services/supabase';
import PasswordInput from '../../components/PasswordInput';
import { validatePassword } from '../../utils/passwordPolicy';
import './UpdatePasswordPage.css';

const UpdatePasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordValidation, setPasswordValidation] = useState({ isValid: false, errors: [] });
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Check if user has a valid session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/login');
      } else {
        setUserEmail(session.user.email);
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password with new policy
    const validation = validatePassword(password, userEmail);
    if (!validation.isValid) {
      setMessage({
        type: 'error',
        text: validation.errors[0], // Show first error
      });
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: '비밀번호가 일치하지 않습니다.',
      });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: '비밀번호가 성공적으로 변경되었습니다.',
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    } catch (error) {
      console.error('Password update error:', error);
      setMessage({
        type: 'error',
        text: '비밀번호 변경 중 오류가 발생했습니다. 다시 시도해 주세요.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="update-password-page">
      <div className="update-password-container">
        <div className="update-password-card">
          <h2 className="update-password-title">새 비밀번호 설정</h2>
          
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="update-password-form">
            <PasswordInput
              value={password}
              onChange={setPassword}
              onValidation={setPasswordValidation}
              email={userEmail}
              placeholder="새 비밀번호를 입력하세요"
              label="새 비밀번호"
              id="password"
              disabled={isLoading}
              showPolicy={true}
              showStrength={true}
            />

            <div className="form-group">
              <label htmlFor="confirmPassword">
                비밀번호 확인
                <span className="required">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                className={`form-control ${password && confirmPassword && password !== confirmPassword ? 'invalid' : ''}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                required
                disabled={isLoading}
              />
              {password && confirmPassword && password !== confirmPassword && (
                <p className="error-text">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading || !passwordValidation.isValid || password !== confirmPassword}
            >
              {isLoading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;
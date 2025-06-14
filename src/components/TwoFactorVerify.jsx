import React, { useState } from 'react';
import { mfaService } from '../core/services/mfaService';
import Button from '../shared/components/Button/Button';
import './TwoFactorVerify.css';

const TwoFactorVerify = ({ factors, onVerifySuccess, onCancel }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('6자리 인증 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use the first available TOTP factor
      const factor = factors[0];
      const challengeId = await mfaService.createChallenge(factor.id);
      await mfaService.verifyChallenge(factor.id, challengeId, verificationCode);
      
      onVerifySuccess();
    } catch (error) {
      setError('인증 코드가 올바르지 않습니다. 다시 시도해주세요.');
      console.error('2FA verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && verificationCode.length === 6) {
      handleVerify();
    }
  };

  return (
    <div className="tfa-verify">
      <div className="tfa-verify-icon">
        <i className="fas fa-shield-alt"></i>
      </div>
      
      <h2>2단계 인증</h2>
      <p>인증 앱에 표시된 6자리 코드를 입력하세요</p>

      <div className="tfa-verify-form">
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyPress={handleKeyPress}
          placeholder="000000"
          maxLength="6"
          className="tfa-code-input"
          autoFocus
        />

        {error && <p className="tfa-error">{error}</p>}

        <div className="tfa-verify-actions">
          <Button 
            onClick={handleVerify} 
            disabled={loading || verificationCode.length !== 6}
            variant="primary"
          >
            {loading ? '확인 중...' : '확인'}
          </Button>
          
          <Button 
            onClick={onCancel}
            variant="secondary"
            disabled={loading}
          >
            취소
          </Button>
        </div>
      </div>

      <div className="tfa-verify-help">
        <p>코드를 찾을 수 없나요?</p>
        <ul>
          <li>인증 앱(Google Authenticator, Authy 등)을 확인하세요</li>
          <li>시간이 동기화되어 있는지 확인하세요</li>
          <li>30초마다 새로운 코드가 생성됩니다</li>
        </ul>
      </div>
    </div>
  );
};

export default TwoFactorVerify;
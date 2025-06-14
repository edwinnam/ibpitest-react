import React, { useState, useEffect } from 'react';
import { mfaService } from '../core/services/mfaService';
import Modal from '../shared/components/Modal/Modal';
import Button from '../shared/components/Button/Button';
import LazyImage from './LazyImage';
import './TwoFactorSetup.css';

const TwoFactorSetup = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState('initial'); // initial, enrolling, verifying, success
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [enrolledFactors, setEnrolledFactors] = useState([]);

  useEffect(() => {
    if (isOpen) {
      checkExistingFactors();
    }
  }, [isOpen]);

  const checkExistingFactors = async () => {
    try {
      const factors = await mfaService.listFactors();
      setEnrolledFactors(factors);
      if (factors.length > 0) {
        setStep('enrolled');
      }
    } catch (error) {
      console.error('Error checking factors:', error);
    }
  };

  const handleEnroll = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { id, qr, secret: mfaSecret } = await mfaService.enrollMFA();
      setFactorId(id);
      setQrCode(qr);
      setSecret(mfaSecret);
      setStep('enrolling');
    } catch (error) {
      setError('2단계 인증 설정 중 오류가 발생했습니다.');
      console.error('Enrollment error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('6자리 인증 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await mfaService.verifyEnrollment(factorId, verificationCode);
      setStep('success');
      
      // Refresh factors list
      const factors = await mfaService.listFactors();
      setEnrolledFactors(factors);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setError('인증 코드가 올바르지 않습니다. 다시 시도해주세요.');
      console.error('Verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (factorId) => {
    if (!window.confirm('2단계 인증을 비활성화하시겠습니까? 계정 보안이 약해질 수 있습니다.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await mfaService.unenrollMFA(factorId);
      setEnrolledFactors([]);
      setStep('initial');
    } catch (error) {
      setError('2단계 인증 비활성화 중 오류가 발생했습니다.');
      console.error('Unenroll error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('initial');
    setQrCode('');
    setSecret('');
    setFactorId('');
    setVerificationCode('');
    setError('');
    onClose();
  };

  const renderContent = () => {
    switch (step) {
      case 'initial':
        return (
          <div className="tfa-content">
            <h3>2단계 인증 설정</h3>
            <p>2단계 인증을 사용하면 계정 보안을 크게 향상시킬 수 있습니다.</p>
            <p>Google Authenticator, Authy 등의 인증 앱이 필요합니다.</p>
            <div className="tfa-actions">
              <Button onClick={handleEnroll} disabled={loading}>
                2단계 인증 설정하기
              </Button>
            </div>
          </div>
        );

      case 'enrolling':
        return (
          <div className="tfa-content">
            <h3>인증 앱 설정</h3>
            <ol className="tfa-steps">
              <li>스마트폰에서 인증 앱을 실행하세요</li>
              <li>아래 QR 코드를 스캔하거나 수동 입력 키를 사용하세요</li>
              <li>앱에 표시된 6자리 코드를 입력하세요</li>
            </ol>
            
            <div className="tfa-qr-section">
              {qrCode ? (
                <LazyImage 
                  src={qrCode} 
                  alt="2FA QR Code" 
                  className="tfa-qr-code"
                  width={250}
                  height={250}
                  loading="eager"
                />
              ) : (
                <div className="tfa-qr-loading">
                  <div className="spinner"></div>
                  <p>QR 코드 생성 중...</p>
                </div>
              )}
              <details className="tfa-manual-entry">
                <summary>QR 코드를 스캔할 수 없나요?</summary>
                <div className="tfa-secret">
                  <p>수동 입력 키:</p>
                  <code>{secret}</code>
                </div>
              </details>
            </div>

            <div className="tfa-verify-section">
              <label htmlFor="verification-code">인증 코드</label>
              <input
                id="verification-code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6자리 코드 입력"
                maxLength="6"
                className="tfa-code-input"
              />
              <Button 
                onClick={handleVerify} 
                disabled={loading || verificationCode.length !== 6}
              >
                확인
              </Button>
            </div>

            {error && <p className="tfa-error">{error}</p>}
          </div>
        );

      case 'success':
        return (
          <div className="tfa-content">
            <h3>2단계 인증 설정 완료</h3>
            <div className="tfa-success">
              <p>✅ 2단계 인증이 성공적으로 설정되었습니다.</p>
              <p>다음 로그인부터 인증 앱의 코드가 필요합니다.</p>
            </div>
            <div className="tfa-actions">
              <Button onClick={handleClose}>확인</Button>
            </div>
          </div>
        );

      case 'enrolled':
        return (
          <div className="tfa-content">
            <h3>2단계 인증 관리</h3>
            <p>✅ 2단계 인증이 활성화되어 있습니다.</p>
            
            <div className="tfa-factors">
              {enrolledFactors.map((factor) => (
                <div key={factor.id} className="tfa-factor">
                  <div className="tfa-factor-info">
                    <span className="tfa-factor-type">TOTP</span>
                    <span className="tfa-factor-date">
                      등록일: {new Date(factor.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button 
                    variant="secondary" 
                    onClick={() => handleDisable(factor.id)}
                    disabled={loading}
                  >
                    비활성화
                  </Button>
                </div>
              ))}
            </div>

            {error && <p className="tfa-error">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      {renderContent()}
    </Modal>
  );
};

export default TwoFactorSetup;
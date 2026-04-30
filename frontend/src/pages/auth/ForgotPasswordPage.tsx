import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

type Step = 'email' | 'reset' | 'done';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep('reset');
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      setStep('done');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left brand panel */}
      <div className="auth-left">
        <div className="auth-left-glow1" />
        <div className="auth-left-glow2" />
        <div className="auth-left-content">
          <div className="auth-logo">
            <div className="auth-logo-icon">🏥</div>
            <div>
              <div className="auth-logo-name">BGS E-Learning</div>
              <div className="auth-logo-sub">ระบบ E-Learning สำหรับ รพ.สต. และ รพ.</div>
            </div>
          </div>
          <h1 className="auth-tagline">
            ลืมรหัสผ่าน?
            <br />
            ไม่ต้องกังวล
          </h1>
          <p className="auth-tagline-sub">
            ระบบจะส่งรหัส OTP ไปที่อีเมลของคุณ
            <br />
            เพื่อตั้งรหัสผ่านใหม่
          </p>
          <div className="auth-feature">
            <span className="auth-feature-icon">📧</span>
            <span className="auth-feature-text">OTP ส่งไปที่อีเมลที่ลงทะเบียน</span>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">⏱️</span>
            <span className="auth-feature-text">รหัส OTP หมดอายุใน 10 นาที</span>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">🔒</span>
            <span className="auth-feature-text">รหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <div className="auth-form-box anim-up">
          {step === 'email' && (
            <>
              <h2 className="auth-form-title">ลืมรหัสผ่าน 🔑</h2>
              <p className="auth-form-sub">กรอกอีเมลที่ลงทะเบียนไว้ เราจะส่งรหัส OTP ให้</p>

              {error && (
                <div className="alert-error" role="alert">
                  <span>⚠️</span> {error}
                </div>
              )}

              <form
                onSubmit={handleSendOtp}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    อีเมล
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    placeholder="example@bgs.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                      กำลังส่ง OTP...
                    </>
                  ) : (
                    'ส่งรหัส OTP'
                  )}
                </button>
              </form>
            </>
          )}

          {step === 'reset' && (
            <>
              <h2 className="auth-form-title">ตั้งรหัสผ่านใหม่ 🔐</h2>
              <p className="auth-form-sub">
                ส่งรหัส OTP ไปที่ <strong>{email}</strong> แล้ว
              </p>

              {error && (
                <div className="alert-error" role="alert">
                  <span>⚠️</span> {error}
                </div>
              )}

              <form
                onSubmit={handleReset}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                <div className="form-group">
                  <label className="form-label" htmlFor="otp">
                    รหัส OTP (6 หลัก)
                  </label>
                  <input
                    id="otp"
                    type="text"
                    className="form-input"
                    placeholder="______"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    inputMode="numeric"
                    required
                    style={{ letterSpacing: 8, fontSize: 22, textAlign: 'center' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="new-password">
                    รหัสผ่านใหม่
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="อย่างน้อย 6 ตัวอักษร"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      style={{ paddingRight: 40 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 16,
                        color: 'var(--text-muted)',
                        padding: 2,
                      }}
                      tabIndex={-1}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="confirm-password">
                    ยืนยันรหัสผ่านใหม่
                  </label>
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                      กำลังเปลี่ยนรหัสผ่าน...
                    </>
                  ) : (
                    'เปลี่ยนรหัสผ่าน'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtp('');
                    handleSendOtp({ preventDefault: () => {} } as React.FormEvent);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    textDecoration: 'underline',
                  }}
                >
                  ส่งรหัส OTP อีกครั้ง
                </button>
              </form>
            </>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <h2 className="auth-form-title" style={{ marginBottom: 8 }}>
                เปลี่ยนรหัสผ่านสำเร็จ
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
                รหัสผ่านของคุณถูกเปลี่ยนแล้ว
                <br />
                สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้เลย
              </p>
              <button className="btn-primary" onClick={() => navigate('/login')}>
                ไปหน้าเข้าสู่ระบบ
              </button>
            </div>
          )}

          {step !== 'done' && (
            <p
              style={{
                textAlign: 'center',
                marginTop: 20,
                fontSize: 13,
                color: 'var(--text-muted)',
              }}
            >
              จำรหัสผ่านได้แล้ว?{' '}
              <Link to="/login" className="auth-link">
                เข้าสู่ระบบ
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

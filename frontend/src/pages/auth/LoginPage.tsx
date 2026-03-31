import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const REMEMBER_KEY = 'bgs_remember_email';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_KEY) ?? '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem(REMEMBER_KEY));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ─── Left brand panel ─── */}
      <div className="auth-left">
        <div className="auth-left-glow1" />
        <div className="auth-left-glow2" />
        <div className="auth-left-content">
          {/* Logo */}
          <div className="auth-logo">
            <div className="auth-logo-icon">🏥</div>
            <div>
              <div className="auth-logo-name">รพ.สต. Learning Hub</div>
              <div className="auth-logo-sub">แพลตฟอร์มสื่อการสอนออนไลน์</div>
            </div>
          </div>

          <h1 className="auth-tagline">
            เรียนรู้ทักษะใหม่
            <br />
            สำหรับเจ้าหน้าที่
            <br />
            รพ.สต. ทั่วประเทศ
          </h1>
          <p className="auth-tagline-sub">
            พัฒนาศักยภาพด้านสาธารณสุขชุมชน
            <br />
            ด้วยคอร์สเรียนออนไลน์คุณภาพสูง
          </p>

          <div className="auth-feature">
            <span className="auth-feature-icon">🎓</span>
            <span className="auth-feature-text">คอร์สเรียนครบครันสำหรับ รพ.สต.</span>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">🏆</span>
            <span className="auth-feature-text">ใบประกาศรับรองผลการเรียน</span>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">📊</span>
            <span className="auth-feature-text">ติดตามความก้าวหน้าการเรียน</span>
          </div>
        </div>
      </div>

      {/* ─── Right form panel ─── */}
      <div className="auth-right">
        <div className="auth-form-box anim-up">
          <h2 className="auth-form-title">ยินดีต้อนรับกลับ 👋</h2>
          <p className="auth-form-sub">เข้าสู่ระบบเพื่อเริ่มเรียนต่อ</p>

          {error && (
            <div className="alert-error" role="alert">
              <span>⚠️</span> {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                อีเมล
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="example@bgs.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                รหัสผ่าน
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                fontSize: 13,
                color: 'var(--text-muted)',
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--primary)' }}
              />
              จดจำอีเมลของฉัน
            </label>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>
          </form>

          <p
            style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}
          >
            ยังไม่มีบัญชี?{' '}
            <Link to="/register" className="auth-link">
              สมัครสมาชิกฟรี
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

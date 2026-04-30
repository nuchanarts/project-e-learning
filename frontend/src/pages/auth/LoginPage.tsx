import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage, LANGUAGES } from '../../contexts/LanguageContext';

const REMEMBER_KEY = 'bgs_remember_email';

export default function LoginPage() {
  const { login } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_KEY) ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem(REMEMBER_KEY));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

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
      setError(t.login_error);
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
              <div className="auth-logo-name">BGS E-Learning</div>
              <div className="auth-logo-sub">{t.nav_platform_sub}</div>
            </div>
          </div>

          <h1 className="auth-tagline">
            {t.login_tagline.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < 2 && <br />}
              </span>
            ))}
          </h1>
          <p className="auth-tagline-sub">
            {t.login_tagline_sub.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i === 0 && <br />}
              </span>
            ))}
          </p>

          <div className="auth-feature">
            <span className="auth-feature-icon">🎓</span>
            <span className="auth-feature-text">{t.login_feat1}</span>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">🏆</span>
            <span className="auth-feature-text">{t.login_feat2}</span>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">📊</span>
            <span className="auth-feature-text">{t.login_feat3}</span>
          </div>

          {/* ─── Logos ─── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginTop: 36,
              paddingTop: 20,
              borderTop: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <img
              src="/logos/bgs-logo.png"
              alt="Bangkok Global Software"
              style={{ height: 36, width: 'auto', objectFit: 'contain', opacity: 0.85 }}
            />
            <img
              src="/logos/bms-icon.png"
              alt="BMS"
              style={{ height: 36, width: 'auto', objectFit: 'contain', opacity: 0.85 }}
            />
          </div>
        </div>
      </div>

      {/* ─── Right form panel ─── */}
      <div className="auth-right" style={{ position: 'relative' }}>
        {/* Floating language picker — bottom-right */}
        <div ref={langRef} style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 50 }}>
          <button
            onClick={() => setLangOpen((o) => !o)}
            title="เปลี่ยนภาษา"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px 6px 8px',
              borderRadius: 20,
              border: `1.5px solid ${langOpen ? '#7B68EE' : '#D1D5DB'}`,
              background: '#fff',
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              fontSize: 13,
              fontWeight: 600,
              color: '#374151',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
          >
            <span style={{ fontSize: 18 }}>{currentLang.flag}</span>
            <span>{currentLang.code.toUpperCase()}</span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              style={{
                transform: langOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
                opacity: 0.5,
              }}
            >
              <path
                d="M2 3.5l3 3 3-3"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {langOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                right: 0,
                background: '#ffffff',
                border: '1px solid #E5E7EB',
                borderRadius: 14,
                boxShadow: '0 -8px 30px rgba(0,0,0,0.12)',
                zIndex: 100,
                minWidth: 175,
                maxHeight: 280,
                overflowY: 'auto',
                padding: '6px',
              }}
            >
              <div
                style={{
                  padding: '4px 10px 8px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#9CA3AF',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                🌐 Language
              </div>
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setLangOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '9px 10px',
                    border: 'none',
                    borderRadius: 9,
                    background: l.code === lang ? '#EDE9FE' : '#ffffff',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: l.code === lang ? 700 : 400,
                    color: l.code === lang ? '#7B68EE' : '#1F2937',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{l.flag}</span>
                  <span style={{ flex: 1 }}>{l.label}</span>
                  {l.code === lang && <span style={{ color: '#7B68EE' }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="auth-form-box anim-up">
          <h2 className="auth-form-title">{t.login_welcome}</h2>
          <p className="auth-form-sub">{t.login_subtitle}</p>

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
                {t.login_email}
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
                {t.login_password}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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
                    lineHeight: 1,
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                  style={{
                    width: 15,
                    height: 15,
                    cursor: 'pointer',
                    accentColor: 'var(--primary)',
                  }}
                />
                {t.login_remember}
              </label>
              <Link to="/forgot-password" className="auth-link" style={{ fontSize: 13 }}>
                ลืมรหัสผ่าน?
              </Link>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  {t.login_loading}
                </>
              ) : (
                t.login_submit
              )}
            </button>
          </form>

          <p
            style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}
          >
            {t.login_no_account}{' '}
            <Link to="/register" className="auth-link">
              {t.login_register_link}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage, LANGUAGES } from '../../contexts/LanguageContext';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { to: '/dashboard', icon: '🏠', label: t.nav_dashboard },
    { to: '/courses', icon: '🎓', label: t.nav_courses },
    { to: '/certificates', icon: '🏆', label: t.nav_certificates },
    { to: '/help', icon: '💬', label: t.nav_help },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allNav = [
    ...navItems,
    ...(user?.role === 'ADMIN' ? [{ to: '/admin', icon: '⚙️', label: t.nav_admin }] : []),
  ];

  const currentLang = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  // Close lang dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── TOP NAVBAR ── */}
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Mobile hamburger */}
          <button
            className="mobile-hamburger"
            onClick={() => setMobileOpen(true)}
            aria-label="เปิดเมนู"
          >
            ☰
          </button>

          {/* Logo */}
          <Link to="/dashboard" className="navbar-logo">
            <div className="navbar-logo-icon">🏥</div>
            <div className="navbar-logo-text">
              <span className="navbar-logo-title">รพ.สต. Learning Hub</span>
              <span className="navbar-logo-sub">{t.nav_platform_sub}</span>
            </div>
          </Link>

          {/* Desktop Nav links */}
          <nav className="navbar-links">
            {allNav.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`navbar-link ${active ? 'active' : ''}`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right area: User → Language (far-right) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* User area */}
            <div className="navbar-user">
              <div className="navbar-avatar" title={user?.name}>
                {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
              <span className="navbar-user-name">{user?.name}</span>
              <button data-testid="logout-button" className="navbar-logout" onClick={handleLogout}>
                {t.nav_logout}
              </button>
            </div>

            {/* ── Language Selector (far right) ── */}
            <div ref={langRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setLangOpen((o) => !o)}
                title="เปลี่ยนภาษา / Change Language"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 9px 5px 7px',
                  borderRadius: 10,
                  border: `1.5px solid ${langOpen ? 'var(--primary)' : 'var(--border)'}`,
                  background: langOpen ? 'rgba(123,104,238,0.08)' : 'var(--card)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <span style={{ fontSize: 17, lineHeight: 1 }}>{currentLang.flag}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: langOpen ? 'var(--primary)' : 'var(--text-primary)',
                    letterSpacing: '0.05em',
                  }}
                >
                  {currentLang.code.toUpperCase()}
                </span>
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  style={{
                    transform: langOpen ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s',
                    opacity: 0.45,
                  }}
                >
                  <path
                    d="M1 2.5l3 3 3-3"
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
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 14,
                    boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
                    zIndex: 300,
                    minWidth: 175,
                    overflow: 'hidden',
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
                        padding: '8px 10px',
                        border: 'none',
                        borderRadius: 9,
                        background: l.code === lang ? '#EDE9FE' : '#ffffff',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: l.code === lang ? 700 : 400,
                        color: l.code === lang ? '#7B68EE' : '#1F2937',
                        fontFamily: 'inherit',
                        textAlign: 'left',
                        transition: 'background 0.1s',
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{l.flag}</span>
                      <span style={{ flex: 1 }}>{l.label}</span>
                      {l.code === lang && (
                        <span style={{ fontSize: 13, color: 'var(--primary)' }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── MOBILE DRAWER ── */}
      <div className={`mobile-drawer ${mobileOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-overlay" onClick={() => setMobileOpen(false)} />
        <div className="mobile-drawer-panel">
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0 6px 20px',
              borderBottom: '1px solid var(--border)',
              marginBottom: 8,
            }}
          >
            <div
              className="navbar-logo-icon"
              style={{ width: 36, height: 36, borderRadius: 10, fontSize: 16 }}
            >
              🏥
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                รพ.สต. Learning Hub
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.nav_platform_sub}</div>
            </div>
          </div>

          {/* Language selector (mobile) */}
          <div
            style={{
              padding: '0 6px 12px',
              borderBottom: '1px solid var(--border)',
              marginBottom: 8,
            }}
          >
            <div
              style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}
            >
              🌐 ภาษา / Language
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    borderRadius: 16,
                    border: `1px solid ${l.code === lang ? 'var(--primary)' : 'var(--border)'}`,
                    background: l.code === lang ? 'var(--primary)' : 'transparent',
                    color: l.code === lang ? '#fff' : 'var(--text-primary)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          {allNav.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`mobile-nav-link ${active ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* User info */}
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 12,
                background: 'var(--bg)',
                marginBottom: 8,
              }}
            >
              <div className="navbar-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>
                {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {user?.role === 'ADMIN' ? t.nav_admin_role : t.nav_staff}
                </div>
              </div>
            </div>
            <button
              data-testid="logout-button-mobile"
              onClick={() => {
                setMobileOpen(false);
                handleLogout();
              }}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 10,
                border: '1px solid rgba(239,68,68,0.2)',
                background: 'rgba(239,68,68,0.06)',
                color: '#DC2626',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t.nav_logout}
            </button>
          </div>
        </div>
      </div>

      {/* ── PAGE CONTENT ── */}
      <main className="page-wrapper anim-in">{children}</main>
    </div>
  );
}

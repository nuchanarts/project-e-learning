import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, THEMES } from '../../contexts/ThemeContext';

// ── SVG Icons ──────────────────────────────────────────────
const IconDashboard = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const IconBook = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const IconAward = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);
const IconHelp = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconLogout = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IconBell = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const IconAdmin = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconMenu = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

// ── Breadcrumb map ─────────────────────────────────────────
const BREADCRUMB: Record<string, string> = {
  '/dashboard': 'แดชบอร์ด',
  '/courses': 'คอร์สเรียน',
  '/certificates': 'ประกาศนียบัตร',
  '/help': 'ช่วยเหลือ',
  '/admin': 'ผู้ดูแลระบบ',
  '/cart': 'ตะกร้าสินค้า',
  '/profile': 'โปรไฟล์',
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { themeId, setTheme } = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const mainNav = [
    { to: '/dashboard', icon: <IconDashboard />, label: 'แดชบอร์ด' },
    { to: '/courses', icon: <IconBook />, label: 'คอร์สเรียน' },
    { to: '/certificates', icon: <IconAward />, label: 'ประกาศนียบัตร' },
  ];

  const systemNav = [
    { to: '/help', icon: <IconHelp />, label: 'ช่วยเหลือ' },
    ...(user?.role === 'ADMIN'
      ? [{ to: '/admin', icon: <IconAdmin />, label: 'ผู้ดูแลระบบ' }]
      : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Breadcrumb: "กรมสนับสนุนบริการสุขภาพ / ..."
  const matchedPath = Object.keys(BREADCRUMB).find((k) => pathname.startsWith(k)) ?? '/dashboard';
  const pageName = BREADCRUMB[matchedPath] ?? 'หน้าหลัก';
  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? 'U';
  // Short workplace from name or default
  const workplace = 'รพ.สต.บ้านสวน';

  const SidebarContent = () => (
    <>
      {/* ── Logo ── */}
      <div className="sb-logo">
        <div className="sb-logo-icon">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div>
          <div className="sb-logo-title">BGS E-Learning</div>
          <div className="sb-logo-sub">ระบบ E-Learning</div>
        </div>
      </div>

      {/* ── User Profile ── */}
      <div className="sb-user">
        <div className="sb-user-avatar">{userInitial}</div>
        <div className="sb-user-info">
          <div className="sb-user-name">{user?.name}</div>
          <div className="sb-user-sub">{workplace}</div>
        </div>
      </div>

      {/* ── Main Nav ── */}
      <div className="sb-section-label">เมนูหลัก</div>
      {mainNav.map((item) => {
        const active = pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`sb-nav-item ${active ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <span className="sb-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}

      {/* ── System Nav ── */}
      <div className="sb-section-label" style={{ marginTop: 20 }}>
        ทั่วไป
      </div>
      {systemNav.map((item) => {
        const active = pathname.startsWith(item.to);
        return (
          <Link
            key={item.label}
            to={item.to}
            className={`sb-nav-item ${active ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <span className="sb-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
      {/* ── Theme Picker ── */}
      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <div
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.45)',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 8,
            paddingLeft: 4,
          }}
        >
          ธีมสี
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', paddingLeft: 2 }}>
          {THEMES.map((t) => (
            <button
              key={t.id}
              title={t.label}
              onClick={() => setTheme(t.id)}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: t.primary,
                border: themeId === t.id ? '2px solid #fff' : '2px solid transparent',
                outline: themeId === t.id ? `2px solid ${t.primary}` : 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'transform .15s',
                transform: themeId === t.id ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        {/* ── Logout ── */}
        <button
          data-testid="logout-button"
          className="sb-logout"
          style={{ marginTop: 12 }}
          onClick={() => {
            setMobileOpen(false);
            handleLogout();
          }}
        >
          <IconLogout />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="app-shell">
      {/* ── SIDEBAR (desktop) ── */}
      <aside className="sidebar">
        <SidebarContent />
      </aside>

      {/* ── MOBILE DRAWER ── */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)}>
          <aside className="sidebar sidebar-mobile" onClick={(e) => e.stopPropagation()}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── MAIN AREA ── */}
      <div className="main-area">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="topbar-hamburger"
              onClick={() => setMobileOpen(true)}
              aria-label="เมนู"
            >
              <IconMenu />
            </button>
            <div className="topbar-breadcrumb">
              <span className="topbar-bc-parent">กรมสนับสนุนบริการสุขภาพ</span>
              <span className="topbar-bc-sep">/</span>
              <span className="topbar-bc-current">{pageName}</span>
            </div>
          </div>
          <div className="topbar-right">
            <button className="topbar-bell" aria-label="การแจ้งเตือน">
              <IconBell />
              <span className="topbar-bell-dot" />
            </button>
            <div className="topbar-user" ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: 10,
                }}
              >
                <div className="topbar-avatar">{userInitial}</div>
                <div className="topbar-user-info">
                  <div className="topbar-user-name">{user?.name}</div>
                  <div className="topbar-user-role">
                    {user?.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'เจ้าพนักงานสาธารณสุข'}
                  </div>
                </div>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-muted)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: '#fff',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    minWidth: 220,
                    zIndex: 200,
                    overflow: 'hidden',
                  }}
                >
                  {/* User info header */}
                  <div
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--border)',
                      background: 'var(--bg)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                      {user?.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {user?.email}
                    </div>
                  </div>
                  {/* Menu items */}
                  <div style={{ padding: '6px 0' }}>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 16px',
                        fontSize: 14,
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      โปรไฟล์
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 16px',
                        fontSize: 14,
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                      ตั้งค่าบัญชี
                    </Link>
                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 16px',
                        fontSize: 14,
                        color: '#DC2626',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        width: '100%',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <IconLogout />
                      ออกจากระบบ
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content anim-in">{children}</main>

        {/* Footer */}
        <footer className="site-footer">
          <div className="site-footer-inner">
            <div className="site-footer-logos">
              <img
                src="/logos/bgs-logo.png"
                alt="Bangkok Global Software"
                className="site-footer-logo-img"
              />
              <img src="/logos/bms-icon.png" alt="BMS" className="site-footer-logo-img" />
              <div className="site-footer-copy">
                © {new Date().getFullYear()} Bangkok Global Software (BGS) · พัฒนาโดย BMS Group ·
                สงวนลิขสิทธิ์
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

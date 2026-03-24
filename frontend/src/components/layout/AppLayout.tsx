import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

interface AppLayoutProps { children: ReactNode }

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/courses', label: 'คอร์สเรียน' },
    { to: '/certificates', label: 'ใบประกาศ' },
    ...(user?.role === 'ADMIN' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold text-primary-700">BGS E-Learning</h1>
          <nav className="hidden md:flex gap-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`text-sm font-medium transition-colors ${
                  pathname.startsWith(item.to) ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">สวัสดี, {user?.name}</span>
          <Button data-testid="logout-button" variant="secondary" onClick={logout}>ออกจากระบบ</Button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  );
}

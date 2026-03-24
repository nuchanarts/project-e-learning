import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-center mb-6">เข้าสู่ระบบ</h1>
        {error && <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">อีเมล</label>
            <input name="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">รหัสผ่าน</label>
            <input name="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required />
          </div>
          <Button type="submit" isLoading={isLoading} className="w-full">เข้าสู่ระบบ</Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          ยังไม่มีบัญชี? <Link to="/register" className="text-primary-600 hover:underline">สมัครสมาชิก</Link>
        </p>
      </div>
    </div>
  );
}

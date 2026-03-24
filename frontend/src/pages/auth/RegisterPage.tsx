import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await register(form.email, form.password, form.name);
      navigate('/dashboard');
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-center mb-6">สมัครสมาชิก</h1>
        {error && <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {(['name', 'email', 'password'] as const).map(field => (
            <div key={field}>
              <label className="block text-sm font-medium mb-1 capitalize">{field === 'name' ? 'ชื่อ' : field === 'email' ? 'อีเมล' : 'รหัสผ่าน'}</label>
              <input name={field} type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required />
            </div>
          ))}
          <Button type="submit" isLoading={isLoading} className="w-full">สมัครสมาชิก</Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          มีบัญชีแล้ว? <Link to="/login" className="text-primary-600 hover:underline">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  );
}

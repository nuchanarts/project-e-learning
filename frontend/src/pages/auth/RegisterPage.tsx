import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    cid: '',
    hospital: '',
    position: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.cid && !/^\d{13}$/.test(form.cid)) {
      setError('เลขบัตรประชาชนต้องมี 13 หลัก');
      return;
    }
    setLoading(true);
    try {
      await register(
        form.email,
        form.password,
        form.name,
        form.cid || undefined,
        form.hospital || undefined,
        form.position || undefined,
      );
      navigate('/dashboard');
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
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
          <div className="auth-logo">
            <div className="auth-logo-icon">🏥</div>
            <div>
              <div className="auth-logo-name">รพ.สต. Learning Hub</div>
              <div className="auth-logo-sub">แพลตฟอร์มสื่อการสอนออนไลน์</div>
            </div>
          </div>

          <h1 className="auth-tagline">
            เริ่มต้นการเรียนรู้
            <br />
            วันนี้ได้เลย!
          </h1>
          <p className="auth-tagline-sub">
            เข้าร่วมกับเจ้าหน้าที่ รพ.สต. ทั่วประเทศ
            <br />
            ที่กำลังพัฒนาทักษะด้านสาธารณสุข
          </p>

          <div className="auth-feature">
            <span className="auth-feature-icon">✅</span>
            <span className="auth-feature-text">สมัครฟรี ไม่มีค่าใช้จ่าย</span>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">🎥</span>
            <span className="auth-feature-text">เรียนผ่านวิดีโอตลอด 24 ชั่วโมง</span>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">📜</span>
            <span className="auth-feature-text">รับใบประกาศเมื่อเรียนจบ</span>
          </div>
        </div>
      </div>

      {/* ─── Right form panel ─── */}
      <div className="auth-right">
        <div className="auth-form-box anim-up">
          <h2 className="auth-form-title">สร้างบัญชีใหม่ 🚀</h2>
          <p className="auth-form-sub">กรอกข้อมูลเพื่อเริ่มต้นใช้งาน</p>

          {error && (
            <div className="alert-error" role="alert">
              <span>⚠️</span> {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                ชื่อ-นามสกุล
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                placeholder="ชื่อของคุณ"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                autoComplete="name"
              />
            </div>

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
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
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
                placeholder="อย่างน้อย 8 ตัวอักษร"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cid">
                เลขบัตรประชาชน (ไม่บังคับ)
              </label>
              <input
                id="cid"
                name="cid"
                type="text"
                className="form-input"
                placeholder="13 หลัก"
                value={form.cid}
                onChange={(e) => setForm((p) => ({ ...p, cid: e.target.value }))}
                maxLength={13}
                inputMode="numeric"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="hospital">
                สถานพยาบาล (ไม่บังคับ)
              </label>
              <input
                id="hospital"
                name="hospital"
                type="text"
                className="form-input"
                placeholder="เช่น รพ.สต.บ้านใหม่"
                value={form.hospital}
                onChange={(e) => setForm((p) => ({ ...p, hospital: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="position">
                ตำแหน่ง (ไม่บังคับ)
              </label>
              <input
                id="position"
                name="position"
                type="text"
                className="form-input"
                placeholder="เช่น นักวิชาการสาธารณสุข"
                value={form.position}
                onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
              />
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
                  กำลังสมัคร...
                </>
              ) : (
                'สมัครสมาชิกฟรี'
              )}
            </button>
          </form>

          <p
            style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}
          >
            มีบัญชีแล้ว?{' '}
            <Link to="/login" className="auth-link">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

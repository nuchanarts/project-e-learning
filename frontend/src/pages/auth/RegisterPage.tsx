import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api';

interface HospitalResult {
  hospcode: string;
  name: string;
  province: string;
  district: string;
}

const POSITION_SUGGESTIONS = [
  'นักวิชาการสาธารณสุข',
  'พยาบาลวิชาชีพ',
  'เจ้าพนักงานสาธารณสุข',
  'เจ้าพนักงานทันตสาธารณสุข',
  'นักกายภาพบำบัด',
  'นักโภชนาการ',
  'เจ้าหน้าที่บันทึกข้อมูล',
  'แพทย์แผนไทย',
  'ผู้อำนวยการโรงพยาบาลส่งเสริมสุขภาพตำบล',
  'เภสัชกร',
  'นักวิเคราะห์นโยบายและแผน',
  'นักเทคนิคการแพทย์',
];

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    cid: '',
    hospital: '',
    hospcode: '',
    position: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // hospcode lookup (5-digit field)
  const [hospcodeInput, setHospcodeInput] = useState('');
  const [hospcodeStatus, setHospcodeStatus] = useState<'idle' | 'loading' | 'found' | 'notfound'>(
    'idle',
  );
  const codeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hospital name search (name field)
  const [hospitalQuery, setHospitalQuery] = useState('');
  const [hospitalResults, setHospitalResults] = useState<HospitalResult[]>([]);
  const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);
  const [hospitalLoading, setHospitalLoading] = useState(false);
  const hospitalRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (hospitalRef.current && !hospitalRef.current.contains(e.target as Node)) {
        setShowHospitalDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const lookupByCode = (code: string) => {
    setHospcodeInput(code);
    if (codeTimeout.current) clearTimeout(codeTimeout.current);
    if (!/^\d{5}$/.test(code)) {
      if (!/^\d+$/.test(code) || code.length > 5) {
        setHospcodeStatus('idle');
        setForm((p) => ({ ...p, hospcode: '' }));
      }
      return;
    }
    setHospcodeStatus('loading');
    codeTimeout.current = setTimeout(async () => {
      try {
        const { data } = await api.get<HospitalResult[]>(
          `/hospitals?q=${encodeURIComponent(code)}`,
        );
        const exact = data.find((h) => h.hospcode === code);
        if (exact) {
          setForm((p) => ({ ...p, hospcode: exact.hospcode, hospital: exact.name }));
          setHospitalQuery(exact.name);
          setHospcodeStatus('found');
        } else {
          setForm((p) => ({ ...p, hospcode: code, hospital: '' }));
          setHospitalQuery('');
          setHospcodeStatus('notfound');
        }
      } catch {
        setHospcodeStatus('notfound');
      }
    }, 400);
  };

  const searchHospitals = (query: string) => {
    setHospitalQuery(query);
    setForm((p) => ({ ...p, hospital: query, hospcode: '' }));
    setHospcodeInput('');
    setHospcodeStatus('idle');
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query.trim() || query.length < 2) {
      setHospitalResults([]);
      setShowHospitalDropdown(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setHospitalLoading(true);
      try {
        const { data } = await api.get(`/hospitals?q=${encodeURIComponent(query)}`);
        setHospitalResults(data);
        setShowHospitalDropdown(data.length > 0);
      } catch {
        // ignore
      } finally {
        setHospitalLoading(false);
      }
    }, 300);
  };

  const selectHospital = (h: HospitalResult) => {
    setForm((p) => ({ ...p, hospital: h.name, hospcode: h.hospcode }));
    setHospitalQuery(h.name);
    setHospcodeInput(h.hospcode);
    setHospcodeStatus('found');
    setShowHospitalDropdown(false);
  };

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{13}$/.test(form.cid)) {
      setError(t.register_error_cid || 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก');
      return;
    }
    if (!/^\d{5}$/.test(form.hospcode)) {
      setError('กรุณาระบุรหัสสถานพยาบาล 5 หลักให้ถูกต้อง');
      return;
    }
    if (!form.hospital.trim()) {
      setError('กรุณาระบุชื่อสถานพยาบาล');
      return;
    }
    if (!form.position.trim()) {
      setError('กรุณาระบุตำแหน่งงาน');
      return;
    }
    setLoading(true);
    try {
      await register(
        form.email,
        form.password,
        form.name,
        form.cid,
        form.hospital,
        form.position,
        form.hospcode,
      );
      navigate('/dashboard');
    } catch {
      setError(t.register_error_general);
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
              <div className="auth-logo-name">BGS E-Learning</div>
              <div className="auth-logo-sub">ระบบ E-Learning สำหรับ รพ.สต. และ รพ.</div>
            </div>
          </div>

          <h1 className="auth-tagline">
            ระบบ E-Learning
            <br />
            สำหรับบุคลากร
            <br />
            รพ.สต. และ รพ.
          </h1>
          <p className="auth-tagline-sub">
            โซลูชันซอฟต์แวร์สำหรับระบบสาธารณสุข
            <br />
            โดย Bangkok Global Software Co., Ltd.
          </p>

          <div className="auth-feature">
            <span className="auth-feature-icon">✅</span>
            <span className="auth-feature-text">สมัครฟรี ไม่มีค่าใช้จ่าย</span>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">🎥</span>
            <span className="auth-feature-text">คอร์สเรียนสำหรับบุคลากร รพ.สต. และ รพ.</span>
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
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
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
                    lineHeight: 1,
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cid">
                เลขบัตรประชาชน <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                id="cid"
                name="cid"
                type="text"
                className="form-input"
                placeholder="13 หลัก"
                value={form.cid}
                onChange={(e) =>
                  setForm((p) => ({ ...p, cid: e.target.value.replace(/\D/g, '').slice(0, 13) }))
                }
                maxLength={13}
                inputMode="numeric"
                required
              />
            </div>

            {/* ── Hospital: 2 separate fields ── */}
            <div className="form-group">
              <label className="form-label" htmlFor="hospcode">
                รหัสสถานพยาบาล 5 หลัก
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="hospcode"
                  name="hospcode"
                  type="text"
                  className="form-input"
                  placeholder="เช่น 10669"
                  value={hospcodeInput}
                  onChange={(e) => lookupByCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  maxLength={5}
                  inputMode="numeric"
                  autoComplete="off"
                  style={{ paddingRight: hospcodeStatus === 'loading' ? 36 : undefined }}
                />
                {hospcodeStatus === 'loading' && (
                  <span
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  >
                    <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  </span>
                )}
              </div>
              {hospcodeStatus === 'found' && (
                <div style={{ fontSize: 11, color: '#16A34A', marginTop: 3, fontWeight: 600 }}>
                  ✓ พบสถานพยาบาล
                </div>
              )}
              {hospcodeStatus === 'notfound' && (
                <div style={{ fontSize: 11, color: '#D97706', marginTop: 3 }}>
                  ไม่พบรหัสนี้ในระบบ — สามารถพิมพ์ชื่อด้านล่างได้
                </div>
              )}
            </div>

            <div className="form-group" ref={hospitalRef} style={{ position: 'relative' }}>
              <label className="form-label" htmlFor="hospital">
                ชื่อสถานพยาบาล
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="hospital"
                  name="hospital"
                  type="text"
                  className="form-input"
                  placeholder="พิมพ์ชื่อเพื่อค้นหา..."
                  value={hospitalQuery}
                  onChange={(e) => searchHospitals(e.target.value)}
                  onFocus={() => hospitalResults.length > 0 && setShowHospitalDropdown(true)}
                  autoComplete="off"
                />
                {hospitalLoading && (
                  <span
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  >
                    <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  </span>
                )}
              </div>
              {showHospitalDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    zIndex: 100,
                    maxHeight: 220,
                    overflowY: 'auto',
                  }}
                >
                  {hospitalResults.map((h) => (
                    <div
                      key={h.hospcode}
                      onMouseDown={() => selectHospital(h)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border)',
                        transition: 'background .15s',
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.background =
                          'rgba(99,102,241,0.08)')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.background = '')
                      }
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {h.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        รหัส {h.hospcode} · {h.district} · {h.province}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Position combobox */}
            <div className="form-group">
              <label className="form-label" htmlFor="position">
                ตำแหน่ง
              </label>
              <input
                id="position"
                name="position"
                type="text"
                list="positions-list"
                className="form-input"
                placeholder="เลือกหรือพิมพ์ตำแหน่ง..."
                value={form.position}
                onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
                autoComplete="off"
                required
              />
              <datalist id="positions-list">
                {POSITION_SUGGESTIONS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
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

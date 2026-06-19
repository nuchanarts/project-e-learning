import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  MOPH_REG_TOKEN_KEY,
  MOPH_REG_PREFILL_KEY,
  type MophPrefill,
} from '../../lib/moph';

export default function MophCompleteProfilePage() {
  const { mophComplete } = useAuth();
  const navigate = useNavigate();

  const regToken = useMemo(() => sessionStorage.getItem(MOPH_REG_TOKEN_KEY), []);
  const prefill = useMemo<MophPrefill | null>(() => {
    try {
      const raw = sessionStorage.getItem(MOPH_REG_PREFILL_KEY);
      return raw ? (JSON.parse(raw) as MophPrefill) : null;
    } catch {
      return null;
    }
  }, []);

  const orgs = prefill?.organizations ?? [];
  const [email, setEmail] = useState(prefill?.email ?? '');
  const [cid, setCid] = useState(prefill?.cid ?? '');
  const [hcode, setHcode] = useState(orgs[0]?.hcode ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // No registration session → nothing to complete.
  useEffect(() => {
    if (!regToken || !prefill) navigate('/login', { replace: true });
  }, [regToken, prefill, navigate]);

  if (!regToken || !prefill) return null;

  const selectedOrg = orgs.find((o) => o.hcode === hcode) ?? orgs[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('กรุณาระบุอีเมล');
      return;
    }
    if (cid && cid.length !== 13) {
      setError('เลขบัตรประชาชนต้องมี 13 หลัก');
      return;
    }
    setLoading(true);
    try {
      await mophComplete({
        registrationToken: regToken,
        email: email.trim(),
        cid: cid || undefined,
        hcode,
      });
      sessionStorage.removeItem(MOPH_REG_TOKEN_KEY);
      sessionStorage.removeItem(MOPH_REG_PREFILL_KEY);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'ลงทะเบียนไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-right" style={{ width: '100%' }}>
        <div className="auth-form-box anim-up">
          <h2 className="auth-form-title">ยืนยันข้อมูลบัญชี</h2>
          <p className="auth-form-sub">
            เข้าสู่ระบบด้วย MOPH สำเร็จ — กรอกข้อมูลเพิ่มเติมเพื่อสร้างบัญชี
          </p>

          {error && (
            <div className="alert-error" role="alert">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">ชื่อ-นามสกุล</label>
              <input className="form-input" value={prefill.name} readOnly disabled />
            </div>

            {orgs.length > 1 ? (
              <div className="form-group">
                <label className="form-label">หน่วยงาน</label>
                <select
                  className="form-input"
                  value={hcode}
                  onChange={(e) => setHcode(e.target.value)}
                >
                  {orgs.map((o) => (
                    <option key={o.hcode} value={o.hcode}>
                      {o.hname} ({o.hcode}) — {o.position}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">หน่วยงาน</label>
                <input
                  className="form-input"
                  value={selectedOrg ? `${selectedOrg.hname} (${selectedOrg.hcode})` : '-'}
                  readOnly
                  disabled
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="moph-email">
                อีเมล <span style={{ color: 'var(--danger, #DC2626)' }}>*</span>
              </label>
              <input
                id="moph-email"
                type="email"
                className="form-input"
                placeholder="example@hospital.go.th"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="moph-cid">
                เลขบัตรประชาชน (ไม่บังคับ)
              </label>
              <input
                id="moph-cid"
                className="form-input"
                placeholder="13 หลัก"
                value={cid}
                onChange={(e) => setCid(e.target.value.replace(/\D/g, '').slice(0, 13))}
                inputMode="numeric"
                maxLength={13}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />{' '}
                  กำลังสร้างบัญชี...
                </>
              ) : (
                'ยืนยันและเข้าสู่ระบบ'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

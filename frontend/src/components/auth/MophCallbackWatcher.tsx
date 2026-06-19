import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  readMophCallback,
  verifyAndClearState,
  clearCallbackQuery,
  MOPH_REG_TOKEN_KEY,
  MOPH_REG_PREFILL_KEY,
  MOPH_ERROR_KEY,
} from '../../lib/moph';

/**
 * Watches for a MOPH OAuth redirect (?code=&state= on the origin root).
 * Runs once on mount; on success either logs the user in or routes them to
 * the complete-profile page. Renders a full-screen overlay while working.
 */
export function MophCallbackWatcher() {
  const navigate = useNavigate();
  const { mophCallback } = useAuth();
  const ran = useRef(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (ran.current) return;
    const cb = readMophCallback();
    if (!cb) return;
    ran.current = true;
    setProcessing(true);
    clearCallbackQuery();

    (async () => {
      try {
        if (!verifyAndClearState(cb.state)) throw new Error('state mismatch');
        const result = await mophCallback(cb.code);
        if (result.status === 'logged_in') {
          navigate('/dashboard', { replace: true });
        } else {
          sessionStorage.setItem(MOPH_REG_TOKEN_KEY, result.registrationToken);
          sessionStorage.setItem(MOPH_REG_PREFILL_KEY, JSON.stringify(result.prefill));
          navigate('/auth/moph/complete', { replace: true });
        }
      } catch {
        sessionStorage.setItem(MOPH_ERROR_KEY, 'เข้าสู่ระบบด้วย MOPH ไม่สำเร็จ กรุณาลองใหม่');
        navigate('/login', { replace: true });
      } finally {
        setProcessing(false);
      }
    })();
  }, [navigate, mophCallback]);

  if (!processing) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: 'rgba(255,255,255,0.92)',
      }}
    >
      <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>กำลังเข้าสู่ระบบด้วย MOPH...</div>
    </div>
  );
}

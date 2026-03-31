import { useState } from 'react';
import { paymentService, type CardInput } from '../../services/paymentService';

interface PaymentModalProps {
  courseId: string;
  courseTitle: string;
  price: number;
  onSuccess: () => void;
  onClose: () => void;
}

function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

export function PaymentModal({
  courseId,
  courseTitle,
  price,
  onSuccess,
  onClose,
}: PaymentModalProps) {
  const [card, setCard] = useState<CardInput>({
    number: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await paymentService.purchase(courseId, card);
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'ชำระเงินไม่สำเร็จ กรุณาตรวจสอบข้อมูลบัตร';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg,#7B68EE,#9B8FFF)',
            padding: '20px 24px',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>
                ชำระเงินเพื่อเข้าเรียน
              </div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{courseTitle}</div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
          <div
            style={{
              marginTop: 12,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 10,
              padding: '8px 14px',
              display: 'inline-block',
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 800 }}>฿{price.toLocaleString()}</span>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {error && (
            <div className="alert-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Demo hint */}
          <div
            style={{
              padding: '8px 12px',
              background: '#FEF3C7',
              border: '1px solid #FDE68A',
              borderRadius: 8,
              fontSize: 12,
              color: '#92400E',
            }}
          >
            💡 <strong>Demo mode:</strong> ใช้หมายเลขบัตรใดก็ได้เพื่อทดสอบ (ปฏิเสธ:{' '}
            <code>4000 0000 0000 0002</code>)
          </div>

          {/* Card number */}
          <div className="form-group">
            <label className="form-label">หมายเลขบัตร</label>
            <input
              className="form-input"
              type="text"
              inputMode="numeric"
              placeholder="0000 0000 0000 0000"
              value={card.number}
              onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
              maxLength={19}
              required
            />
          </div>

          {/* Cardholder name */}
          <div className="form-group">
            <label className="form-label">ชื่อบนบัตร</label>
            <input
              className="form-input"
              type="text"
              placeholder="FIRSTNAME LASTNAME"
              value={card.name}
              onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase() })}
              required
            />
          </div>

          {/* Expiry + CVV */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">เดือน</label>
              <input
                className="form-input"
                type="text"
                inputMode="numeric"
                placeholder="MM"
                maxLength={2}
                value={card.expiryMonth}
                onChange={(e) =>
                  setCard({ ...card, expiryMonth: e.target.value.replace(/\D/g, '').slice(0, 2) })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">ปี</label>
              <input
                className="form-input"
                type="text"
                inputMode="numeric"
                placeholder="YY"
                maxLength={2}
                value={card.expiryYear}
                onChange={(e) =>
                  setCard({ ...card, expiryYear: e.target.value.replace(/\D/g, '').slice(0, 2) })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">CVV</label>
              <input
                className="form-input"
                type="text"
                inputMode="numeric"
                placeholder="123"
                maxLength={4}
                value={card.cvv}
                onChange={(e) =>
                  setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })
                }
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: 4 }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                กำลังดำเนินการ...
              </>
            ) : (
              <>💳 ชำระ ฿{price.toLocaleString()}</>
            )}
          </button>

          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
            🔒 ข้อมูลบัตรของคุณถูกเข้ารหัสอย่างปลอดภัย
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { paymentService, type CardInput } from '../services/paymentService';

function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

export default function CartPage() {
  const { items, remove, clear, total } = useCart();
  const navigate = useNavigate();

  const [card, setCard] = useState<CardInput>({
    number: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    name: '',
  });
  const [step, setStep] = useState<'cart' | 'payment' | 'success'>('cart');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paidCourses, setPaidCourses] = useState<string[]>([]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const results = await Promise.all(
        items.map((item) => paymentService.purchase(item.id, card)),
      );
      setPaidCourses(results.map((r) => r.courseId));
      clear();
      setStep('success');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'ชำระเงินไม่สำเร็จ กรุณาตรวจสอบข้อมูลบัตร';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Success ────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="anim-up" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '48px 32px' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h1
            style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}
          >
            ชำระเงินสำเร็จ!
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>
            คุณสามารถเริ่มเรียนได้ทันที — ซื้อไป {paidCourses.length} คอร์ส
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate('/courses')}>
              🎓 ไปหน้าคอร์สเรียน
            </button>
            <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
              📊 Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Payment form ───────────────────────────────────────────────────────
  if (step === 'payment') {
    return (
      <div className="anim-up" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="breadcrumb" style={{ marginBottom: 20 }}>
          <button
            onClick={() => setStep('cart')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            className="breadcrumb-link"
          >
            ← กลับไปตะกร้า
          </button>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          {/* Header summary */}
          <div
            style={{ background: 'var(--gradient-primary)', padding: '20px 24px', color: '#fff' }}
          >
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>สรุปรายการ</div>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 14,
                  marginBottom: 4,
                }}
              >
                <span style={{ opacity: 0.9 }}>{item.title}</span>
                <span style={{ fontWeight: 700 }}>฿{item.price.toLocaleString()}</span>
              </div>
            ))}
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.25)',
                paddingTop: 10,
                marginTop: 8,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontWeight: 700 }}>รวมทั้งหมด</span>
              <span style={{ fontSize: 22, fontWeight: 800 }}>฿{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Card form */}
          <form
            onSubmit={handleCheckout}
            style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {error && (
              <div className="alert-error">
                <span>⚠️</span> {error}
              </div>
            )}

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
              💡 <strong>Demo mode:</strong> ใช้หมายเลขบัตรใดก็ได้ (ปฏิเสธ:{' '}
              <code>4000 0000 0000 0002</code>)
            </div>

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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">เดือน MM</label>
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
                <label className="form-label">ปี YY</label>
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

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: 4 }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />{' '}
                  กำลังดำเนินการ...
                </>
              ) : (
                <>💳 ชำระ ฿{total.toLocaleString()}</>
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

  // ── Cart ────────────────────────────────────────────────────────────────
  return (
    <div className="anim-up">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
            🛒 ตะกร้าสินค้า
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {items.length === 0 ? 'ยังไม่มีคอร์สในตะกร้า' : `${items.length} คอร์ส`}
          </p>
        </div>
        <Link to="/courses" className="btn-secondary">
          ← เลือกคอร์สเพิ่ม
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🛒</div>
          <div
            style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}
          >
            ตะกร้าว่างเปล่า
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            เพิ่มคอร์สที่คุณสนใจก่อนชำระเงิน
          </div>
          <Link to="/courses" className="btn-primary">
            🎓 ดูคอร์สทั้งหมด
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 320px',
            gap: 24,
            alignItems: 'start',
          }}
          className="detail-grid"
        >
          {/* Cart items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((item) => (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'var(--gradient-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    flexShrink: 0,
                  }}
                >
                  🎓
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: 'var(--text-primary)',
                      marginBottom: 4,
                    }}
                  >
                    {item.title}
                  </div>
                  {item.category && <span className="badge badge-purple">{item.category}</span>}
                </div>
                <div
                  style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)', flexShrink: 0 }}
                >
                  ฿{item.price.toLocaleString()}
                </div>
                <button
                  onClick={() => remove(item.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(239,68,68,0.25)',
                    background: 'rgba(239,68,68,0.06)',
                    color: '#DC2626',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    flexShrink: 0,
                  }}
                >
                  🗑 ลบ
                </button>
              </div>
            ))}
          </div>

          {/* Summary + checkout */}
          <div className="card" style={{ padding: '20px 22px', position: 'sticky', top: 84 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: 16,
              }}
            >
              สรุปคำสั่งซื้อ
            </div>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    marginRight: 8,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.title}
                </span>
                <span style={{ fontWeight: 600, flexShrink: 0 }}>
                  ฿{item.price.toLocaleString()}
                </span>
              </div>
            ))}
            <div
              style={{
                borderTop: '1px solid var(--border)',
                paddingTop: 12,
                marginTop: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 15 }}>รวมทั้งหมด</span>
              <span style={{ fontWeight: 800, fontSize: 22, color: 'var(--primary)' }}>
                ฿{total.toLocaleString()}
              </span>
            </div>
            <button
              className="btn-primary"
              style={{ width: '100%' }}
              onClick={() => setStep('payment')}
            >
              💳 ดำเนินการชำระเงิน
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

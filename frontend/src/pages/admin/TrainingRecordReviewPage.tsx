import { useState, useEffect } from 'react';
import api from '../../lib/api';

interface RecordItem {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote: string | null;
  recordDate: string;
  createdAt: string;
  notes: string | null;
  user: { id: string; name: string; hospital: string | null; position: string | null };
  course: { id: string; title: string } | null;
}

interface RecordDetail extends RecordItem {
  imageData: string;
  imageMimeType: string;
}

const STATUS_OPTS = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'PENDING', label: 'รอตรวจสอบ' },
  { value: 'APPROVED', label: 'อนุมัติแล้ว' },
  { value: 'REJECTED', label: 'ไม่ผ่าน' },
];

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'รอตรวจสอบ', color: '#D97706', bg: '#FEF3C7' },
  APPROVED: { label: 'อนุมัติแล้ว', color: '#16A34A', bg: '#DCFCE7' },
  REJECTED: { label: 'ไม่ผ่าน', color: '#DC2626', bg: '#FEE2E2' },
};

export default function TrainingRecordReviewPage() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);

  // Selected record for review modal
  const [selected, setSelected] = useState<RecordDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async (status: string) => {
    setLoading(true);
    try {
      const params = status ? `?status=${status}` : '';
      const { data } = await api.get<RecordItem[]>(`/training-records${params}`);
      setRecords(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filterStatus);
  }, [filterStatus]);

  const openReview = async (id: string) => {
    setLoadingDetail(true);
    setAdminNote('');
    try {
      const { data } = await api.get<RecordDetail>(`/training-records/${id}`);
      setSelected(data);
      setAdminNote(data.adminNote ?? '');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selected) return;
    setSaving(true);
    try {
      const { data } = await api.put<RecordItem>(`/training-records/${selected.id}/review`, {
        status,
        adminNote: adminNote.trim() || undefined,
      });
      setRecords((prev) => prev.map((r) => (r.id === data.id ? data : r)));
      setSelected(null);
    } finally {
      setSaving(false);
    }
  };

  const pending = records.filter((r) => r.status === 'PENDING').length;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            ตรวจสอบผลการปฏิบัติหลังอบรม
          </h2>
          {pending > 0 && (
            <div style={{ fontSize: 13, color: '#D97706', fontWeight: 600, marginTop: 4 }}>
              ⏳ รอตรวจสอบ {pending} รายการ
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {STATUS_OPTS.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: '1px solid var(--border)',
                background: filterStatus === s.value ? 'var(--primary)' : 'var(--bg)',
                color: filterStatus === s.value ? '#fff' : 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Records table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
          กำลังโหลด...
        </div>
      ) : records.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 24px',
            background: 'var(--bg-card)',
            borderRadius: 14,
            border: '1px dashed var(--border)',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>ไม่มีรายการในสถานะนี้</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {records.map((r) => {
            const s = STATUS_STYLE[r.status];
            return (
              <div
                key={r.id}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 12,
                  padding: '14px 18px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  flexWrap: 'wrap',
                }}
              >
                {/* Status */}
                <span
                  style={{
                    background: s.bg,
                    color: s.color,
                    borderRadius: 20,
                    padding: '3px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {s.label}
                </span>

                {/* User info */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                    {r.user.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {r.user.position ?? ''} {r.user.hospital ? `· ${r.user.hospital}` : ''}
                  </div>
                </div>

                {/* Course */}
                <div
                  style={{ flex: 1, minWidth: 120, fontSize: 12, color: 'var(--text-secondary)' }}
                >
                  {r.course?.title ?? '—'}
                </div>

                {/* Date */}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(r.createdAt).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>

                {/* Action */}
                <button
                  onClick={() => openReview(r.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--primary)',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.status === 'PENDING' ? '🔍 ตรวจสอบ' : '👁 ดูรูป'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {(selected || loadingDetail) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 680,
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: 28,
              boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
            }}
          >
            {loadingDetail || !selected ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                กำลังโหลดรูปภาพ...
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
                      ตรวจสอบผลการปฏิบัติ
                    </h3>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                      <strong>{selected.user.name}</strong> · {selected.user.position} ·{' '}
                      {selected.user.hospital}
                    </div>
                    {selected.course && (
                      <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 2 }}>
                        📚 {selected.course.title}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      background: STATUS_STYLE[selected.status].bg,
                      color: STATUS_STYLE[selected.status].color,
                      borderRadius: 20,
                      padding: '4px 12px',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {STATUS_STYLE[selected.status].label}
                  </span>
                </div>

                {/* Image */}
                <div
                  style={{
                    marginBottom: 16,
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    background: '#000',
                    textAlign: 'center',
                  }}
                >
                  <img
                    src={`data:${selected.imageMimeType};base64,${selected.imageData}`}
                    alt="ผลการปฏิบัติ"
                    style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain' }}
                  />
                </div>

                {/* Notes */}
                {selected.notes && (
                  <div
                    style={{
                      background: 'var(--bg)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      marginBottom: 14,
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    หมายเหตุ: {selected.notes}
                  </div>
                )}

                {/* Admin note */}
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: 6,
                    }}
                  >
                    บันทึก Admin (ไม่บังคับ)
                  </label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="เหตุผลที่อนุมัติ/ไม่อนุมัติ..."
                    style={{ resize: 'vertical', fontSize: 13 }}
                  />
                </div>

                {/* Actions */}
                {selected.status === 'PENDING' ? (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => handleReview('APPROVED')}
                      disabled={saving}
                      style={{
                        flex: 1,
                        background: '#16A34A',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        padding: 12,
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.7 : 1,
                      }}
                    >
                      {saving ? 'กำลังบันทึก...' : '✓ อนุมัติ'}
                    </button>
                    <button
                      onClick={() => handleReview('REJECTED')}
                      disabled={saving}
                      style={{
                        flex: 1,
                        background: '#DC2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        padding: 12,
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.7 : 1,
                      }}
                    >
                      ✕ ไม่ผ่าน
                    </button>
                    <button
                      onClick={() => setSelected(null)}
                      style={{
                        padding: '12px 18px',
                        background: '#F3F4F6',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      ปิด
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelected(null)}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: '#F3F4F6',
                      border: 'none',
                      borderRadius: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    ปิด
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

interface TrainingRecord {
  id: string;
  recordDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote: string | null;
  course: { id: string; title: string } | null;
  notes: string | null;
  createdAt: string;
}

interface Course {
  id: string;
  title: string;
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'รอตรวจสอบ', color: '#D97706', bg: '#FEF3C7' },
  APPROVED: { label: 'อนุมัติแล้ว', color: '#16A34A', bg: '#DCFCE7' },
  REJECTED: { label: 'ไม่ผ่าน', color: '#DC2626', bg: '#FEE2E2' },
};

export default function TrainingRecordPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [notes, setNotes] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fetching, setFetching] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      api.get<TrainingRecord[]>('/training-records/my'),
      api.get<any>('/courses?limit=200'),
    ])
      .then(([recs, crs]) => {
        setRecords(recs.data);
        const list = Array.isArray(crs.data) ? crs.data : (crs.data?.data ?? []);
        setCourses(list);
      })
      .finally(() => setFetching(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, PDF)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('ไฟล์ต้องมีขนาดไม่เกิน 5 MB');
      return;
    }
    setImageFile(file);
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      setError('กรุณาแนบรูปภาพผลการปฏิบัติ');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1];
        const { data } = await api.post<TrainingRecord>('/training-records', {
          courseId: courseId || undefined,
          recordDate: new Date().toISOString(),
          imageData: base64,
          imageMimeType: imageFile.type,
          notes: notes || undefined,
        });
        setRecords((p) => [data, ...p]);
        setSuccess('ส่งผลการปฏิบัติสำเร็จ รอ Admin ตรวจสอบ');
        setShowForm(false);
        setCourseId('');
        setNotes('');
        setImageFile(null);
        setImagePreview('');
        setLoading(false);
      };
      reader.readAsDataURL(imageFile);
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบบันทึกนี้?')) return;
    await api.delete(`/training-records/${id}`);
    setRecords((p) => p.filter((r) => r.id !== id));
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            บันทึกผลการปฏิบัติหลังอบรม
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            แนบรูปภาพหลักฐานผลการปฏิบัติจริง — Admin จะตรวจสอบและอนุมัติ
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setError('');
            setSuccess('');
          }}
          style={{
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 20px',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          + แนบผลใหม่
        </button>
      </div>

      {success && (
        <div
          style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 10,
            padding: '12px 16px',
            color: '#15803D',
            marginBottom: 16,
            fontWeight: 600,
          }}
        >
          ✓ {success}
        </div>
      )}

      {/* Upload Modal */}
      {showForm && (
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
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 560,
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: 28,
              boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
            }}
          >
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>แนบผลการปฏิบัติ</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              ผู้ส่ง: <strong style={{ color: 'var(--primary)' }}>{user?.name}</strong>
            </p>

            {error && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                  padding: '10px 14px',
                  color: '#DC2626',
                  marginBottom: 14,
                  fontSize: 13,
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              {/* Course */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                  }}
                >
                  คอร์ส / หลักสูตรการอบรม
                </label>
                <select
                  className="form-input"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  style={{ fontSize: 13 }}
                >
                  <option value="">— ไม่ระบุคอร์ส —</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Upload */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                  }}
                >
                  รูปภาพผลการปฏิบัติ <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${imageFile ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 12,
                    padding: 20,
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: imageFile ? 'var(--primary-light)' : 'var(--bg)',
                    transition: 'all .2s',
                  }}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: 280,
                        borderRadius: 8,
                        objectFit: 'contain',
                      }}
                    />
                  ) : (
                    <>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        คลิกเพื่อเลือกรูปภาพ
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        รองรับ JPG, PNG — ขนาดสูงสุด 5 MB
                      </div>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>
                {imageFile && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    ไฟล์: {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      style={{
                        marginLeft: 8,
                        color: '#DC2626',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 11,
                      }}
                    >
                      ✕ ลบ
                    </button>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                  }}
                >
                  หมายเหตุ (ไม่บังคับ)
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  style={{ resize: 'vertical', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="submit"
                  disabled={loading || !imageFile}
                  style={{
                    flex: 1,
                    background: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: 12,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: loading || !imageFile ? 'not-allowed' : 'pointer',
                    opacity: loading || !imageFile ? 0.6 : 1,
                  }}
                >
                  {loading ? 'กำลังส่ง...' : 'ส่งผลการปฏิบัติ'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setImageFile(null);
                    setImagePreview('');
                    setError('');
                  }}
                  style={{
                    padding: '12px 20px',
                    background: '#F3F4F6',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Records list */}
      {fetching ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
          กำลังโหลด...
        </div>
      ) : records.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: 'var(--bg-card)',
            borderRadius: 16,
            border: '1px dashed var(--border)',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            ยังไม่มีบันทึก
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            กดปุ่ม "แนบผลใหม่" เพื่อส่งรูปภาพผลการปฏิบัติ
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {records.map((r) => {
            const s = STATUS_LABEL[r.status];
            return (
              <div
                key={r.id}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 12,
                  padding: '16px 18px',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                }}
              >
                {/* Status badge */}
                <div style={{ flexShrink: 0 }}>
                  <span
                    style={{
                      background: s.bg,
                      color: s.color,
                      borderRadius: 20,
                      padding: '4px 12px',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {s.label}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {r.course?.title ?? 'ไม่ระบุคอร์ส'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                    ส่งเมื่อ{' '}
                    {new Date(r.createdAt).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  {r.notes && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                      {r.notes}
                    </div>
                  )}
                  {r.adminNote && (
                    <div
                      style={{
                        marginTop: 6,
                        padding: '6px 10px',
                        background: r.status === 'APPROVED' ? '#F0FDF4' : '#FFF1F2',
                        borderRadius: 8,
                        fontSize: 12,
                        color: r.status === 'APPROVED' ? '#15803D' : '#DC2626',
                      }}
                    >
                      💬 Admin: {r.adminNote}
                    </div>
                  )}
                </div>

                {r.status === 'PENDING' && (
                  <button
                    onClick={() => handleDelete(r.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9CA3AF',
                      cursor: 'pointer',
                      fontSize: 16,
                      padding: 4,
                      flexShrink: 0,
                    }}
                  >
                    🗑
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info box */}
      <div
        style={{
          marginTop: 24,
          padding: '14px 18px',
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: 12,
          fontSize: 13,
          color: '#1E40AF',
          display: 'flex',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
        <span>
          แนบรูปภาพจากระบบ EHP หรือเอกสารที่แสดงว่าทำจริง — ชื่อของคุณ (
          <strong>{user?.name}</strong>) ต้องปรากฏในรูปด้วย Admin จะตรวจสอบและอนุมัติ
          จึงจะสามารถรับใบประกาศนียบัตรได้
        </span>
      </div>
    </div>
  );
}

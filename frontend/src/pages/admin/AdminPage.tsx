import { useEffect, useRef, useState } from 'react';
import api from '../../lib/api';
import TrainingRecordReviewPage from './TrainingRecordReviewPage';

interface Analytics {
  totalUsers: number;
  totalCourses: number;
  certificatesIssued: number;
  completedProgressCount: number;
  topLearners: {
    userId: string;
    name: string;
    hospital: string;
    totalSeconds: number;
    certCount: number;
  }[];
  courseCompletionRates: { courseId: string; title: string; rate: number }[];
}

interface Video {
  id: string;
  title: string;
  url: string;
  duration: number;
  order: number;
  section?: string | null;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  cid?: string | null;
  hospital?: string | null;
  position?: string | null;
  createdAt: string;
  isOnline: boolean;
  certCount: number;
  progressCount: number;
}

interface Document {
  id: string;
  title: string;
  url: string;
  order: number;
}

interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  order: number;
}

interface CourseItem {
  id: string;
  title: string;
  description: string;
  category?: string;
  thumbnailUrl?: string | null;
  isActive: boolean;
  order: number;
  price?: number | null;
  requireTrainingRecord: boolean;
  videos: Video[];
  documents: Document[];
}

const statCards = [
  {
    key: 'totalUsers',
    label: 'ผู้ใช้ทั้งหมด',
    icon: '👥',
    bar: 'linear-gradient(90deg,#7B68EE,#9B8FFF)',
  },
  {
    key: 'totalCourses',
    label: 'คอร์สทั้งหมด',
    icon: '📚',
    bar: 'linear-gradient(90deg,#3B82F6,#93C5FD)',
  },
  {
    key: 'certificatesIssued',
    label: 'ใบประกาศที่ออก',
    icon: '🏆',
    bar: 'linear-gradient(90deg,#10B981,#34D399)',
  },
  {
    key: 'completedProgressCount',
    label: 'หมวดที่เรียนจบ',
    icon: '✅',
    bar: 'linear-gradient(90deg,#F59E0B,#FCD34D)',
  },
];

interface ActivityEvent {
  type: 'new_user' | 'certificate' | 'payment';
  icon: string;
  title: string;
  detail: string;
  at: string;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
}

interface SiteSettings {
  contact_phone: string;
  contact_phone_label: string;
  contact_phone_detail: string;
  contact_email: string;
  contact_email_label: string;
  contact_email_detail: string;
  contact_line: string;
  contact_line_label: string;
  contact_line_detail: string;
  contact_facebook: string;
  contact_facebook_label: string;
  contact_facebook_detail: string;
  contact_address: string;
  cert_signer_name: string;
  cert_signer_title: string;
  cert_title_en: string;
  cert_title_th: string;
  cert_intro_text: string;
  cert_org_name: string;
  cert_course_label: string;
  cert_left_bg_from: string;
  cert_left_bg_to: string;
  categories: string;
}

type AdminTab = 'courses' | 'users' | 'training' | 'updates';

interface HospItem {
  hospcode: string;
  name: string;
  province: string;
  district: string;
  isCustom: boolean;
}

function HospitalManager() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HospItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState({ hospcode: '', name: '', province: '', district: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load all hospitals (admin mode) on mount
  useEffect(() => {
    api
      .get<HospItem[]>('/hospitals?admin=1')
      .then((r) => setResults(r.data))
      .catch(() => {
        /* ignore */
      })
      .finally(() => setLoading(false));
  }, []);

  const search = (q: string) => {
    setQuery(q);
    if (timeout.current) clearTimeout(timeout.current);
    if (!q.trim() || q.length < 2) {
      // reload all
      api
        .get<HospItem[]>('/hospitals?admin=1')
        .then((r) => setResults(r.data))
        .catch(() => {});
      return;
    }
    timeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get<HospItem[]>(`/hospitals?admin=1&q=${encodeURIComponent(q)}`);
        setResults(data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleToggleActive = async (h: HospItem) => {
    try {
      const { data } = await api.patch<HospItem>(`/hospitals/${h.hospcode}/active`);
      setResults((prev) =>
        prev.map((x) => (x.hospcode === h.hospcode ? { ...x, isActive: data.isActive } : x)),
      );
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'เกิดข้อผิดพลาด');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.hospcode.trim() || !addForm.name.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post<HospItem>('/hospitals', addForm);
      setResults((prev) => [data, ...prev]);
      setMsg('เพิ่มสถานพยาบาลสำเร็จ!');
      setAddForm({ hospcode: '', name: '', province: '', district: '' });
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      setMsg(err?.response?.data?.message ?? 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`ลบ ${code}?`)) return;
    try {
      await api.delete(`/hospitals/${code}`);
      setResults((r) => r.filter((h) => h.hospcode !== code));
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'ลบไม่สำเร็จ');
    }
  };

  const active = results.filter((h) => h.isActive);
  const inactive = results.filter((h) => !h.isActive);

  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
        🏥 จัดการสถานพยาบาล
      </h3>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        เปิด/ปิดสถานพยาบาลที่แสดงในหน้าสมัครสมาชิก · แสดง {active.length} เปิดใช้งาน /{' '}
        {inactive.length} ปิด
      </p>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <input
          className="form-input"
          placeholder="ค้นหาด้วยรหัสหรือชื่อ..."
          value={query}
          onChange={(e) => search(e.target.value)}
          style={{ fontSize: 12, padding: '7px 10px' }}
        />
        {loading && (
          <span
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}
          >
            <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          maxHeight: 280,
          overflowY: 'auto',
          marginBottom: 12,
        }}
      >
        {results.map((h) => (
          <div
            key={h.hospcode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 10px',
              borderRadius: 8,
              background: h.isActive ? 'var(--bg)' : 'rgba(239,68,68,0.04)',
              border: `1px solid ${h.isActive ? 'var(--border)' : 'rgba(239,68,68,0.15)'}`,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: h.isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {h.name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                รหัส {h.hospcode}
                {h.district ? ` · ${h.district}` : ''}
                {h.province ? ` · ${h.province}` : ''}
                {h.isCustom && (
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}> · เพิ่มเอง</span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleToggleActive(h)}
              style={{
                padding: '2px 8px',
                borderRadius: 6,
                border: `1px solid ${h.isActive ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.3)'}`,
                background: h.isActive ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.08)',
                color: h.isActive ? '#DC2626' : '#16A34A',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {h.isActive ? 'ปิด' : 'เปิด'}
            </button>
            {h.isCustom && (
              <button
                onClick={() => handleDelete(h.hospcode)}
                style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  border: '1px solid rgba(239,68,68,0.2)',
                  background: 'rgba(239,68,68,0.06)',
                  color: '#DC2626',
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  flexShrink: 0,
                }}
              >
                ลบ
              </button>
            )}
          </div>
        ))}
        {!loading && results.length === 0 && (
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '12px 0',
            }}
          >
            ไม่พบข้อมูล
          </p>
        )}
      </div>

      {/* Add custom */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <div
          style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}
        >
          ➕ เพิ่มสถานพยาบาลใหม่
        </div>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              className="form-input"
              placeholder="รหัส 5 หลัก"
              value={addForm.hospcode}
              onChange={(e) =>
                setAddForm((f) => ({
                  ...f,
                  hospcode: e.target.value.replace(/\D/g, '').slice(0, 5),
                }))
              }
              maxLength={5}
              required
              style={{ fontSize: 12, padding: '6px 9px', width: 90, flexShrink: 0 }}
            />
            <input
              className="form-input"
              placeholder="ชื่อสถานพยาบาล"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              required
              style={{ fontSize: 12, padding: '6px 9px', flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              className="form-input"
              placeholder="จังหวัด"
              value={addForm.province}
              onChange={(e) => setAddForm((f) => ({ ...f, province: e.target.value }))}
              style={{ fontSize: 12, padding: '6px 9px', flex: 1 }}
            />
            <input
              className="form-input"
              placeholder="อำเภอ"
              value={addForm.district}
              onChange={(e) => setAddForm((f) => ({ ...f, district: e.target.value }))}
              style={{ fontSize: 12, padding: '6px 9px', flex: 1 }}
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
            style={{ fontSize: 12, padding: '7px 14px' }}
          >
            {saving ? 'กำลังบันทึก...' : 'เพิ่มสถานพยาบาล'}
          </button>
          {msg && (
            <p
              style={{
                fontSize: 12,
                color: msg.includes('สำเร็จ') ? '#16A34A' : '#DC2626',
                fontWeight: 600,
                margin: 0,
              }}
            >
              {msg}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('courses');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState({ name: '', hospital: '', position: '' });
  const [savingUser, setSavingUser] = useState(false);
  const [loading, setLoading] = useState(true);

  // Course form state (create or edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    title: string;
    description: string;
    category: string;
    thumbnailUrl: string;
    isActive: boolean;
    price: number | null;
  }>({ title: '', description: '', category: '', thumbnailUrl: '', isActive: true, price: null });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Video management
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [videoForm, setVideoForm] = useState({
    title: '',
    url: '',
    duration: '',
    order: '',
    section: '',
  });
  const [savingVideo, setSavingVideo] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editVideoForm, setEditVideoForm] = useState({
    title: '',
    url: '',
    duration: '',
    order: '',
    section: '',
  });
  const [savingEditVideo, setSavingEditVideo] = useState(false);

  // Document management
  const [docForm, setDocForm] = useState({ title: '', url: '', order: '' });
  const [savingDoc, setSavingDoc] = useState(false);

  // Quiz management
  const [quizCourseId, setQuizCourseId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizForm, setQuizForm] = useState({
    text: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    order: '',
  });
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [editQuizForm, setEditQuizForm] = useState({
    text: '',
    options: ['', '', '', ''],
    correctIndex: 0,
  });
  const [savingEditQuiz, setSavingEditQuiz] = useState(false);

  // Reorder
  const [reordering, setReordering] = useState(false);

  // Updates tab state
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annForm, setAnnForm] = useState({ title: '', body: '', pinned: false });
  const [savingAnn, setSavingAnn] = useState(false);
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    contact_phone: '',
    contact_phone_label: 'โทรศัพท์',
    contact_phone_detail: 'จันทร์-ศุกร์ 9:00-18:00',
    contact_email: '',
    contact_email_label: 'Email',
    contact_email_detail: 'ตอบกลับภายใน 24 ชั่วโมง',
    contact_line: '',
    contact_line_label: 'LINE Official',
    contact_line_detail: 'ตอบเร็ว ตลอด 24 ชั่วโมง',
    contact_facebook: '',
    contact_facebook_label: 'Facebook',
    contact_facebook_detail: 'ติดตามข่าวสารและอัพเดท',
    contact_address: '',
    cert_signer_name: '',
    cert_signer_title: '',
    cert_title_en: 'Certificate of Completion',
    cert_title_th: 'ใบประกาศนียบัตร',
    cert_intro_text: 'ขอมอบใบประกาศนียบัตรฉบับนี้เพื่อรับรองว่า',
    cert_org_name: 'สื่อการสอน',
    cert_course_label: 'ได้ผ่านการศึกษาหลักสูตร',
    cert_left_bg_from: '#2D1B69',
    cert_left_bg_to: '#6D28D9',
    categories: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [exportingExcel, setExportingExcel] = useState(false);

  const loadData = async () => {
    const [a, c, setRes] = await Promise.all([
      api.get<Analytics>('/admin/analytics'),
      api.get<CourseItem[]>('/courses'),
      api.get<SiteSettings>('/admin/settings'),
    ]);
    setAnalytics(a.data);
    setCourses(c.data);
    setSiteSettings(setRes.data);
  };

  useEffect(() => {
    loadData()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleEdit = (c: CourseItem) => {
    setEditingId(c.id);
    setForm({
      title: c.title,
      description: c.description,
      category: c.category ?? '',
      thumbnailUrl: c.thumbnailUrl ?? '',
      isActive: c.isActive,
      price: c.price ?? null,
    });
    setExpandedCourseId(null);
    setQuizCourseId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      title: '',
      description: '',
      category: '',
      thumbnailUrl: '',
      isActive: true,
      price: null,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/courses/${editingId}`, {
          ...form,
          thumbnailUrl: form.thumbnailUrl || null,
        });
        showSuccess('อัปเดตคอร์สสำเร็จ!');
        setEditingId(null);
      } else {
        await api.post('/admin/courses', {
          title: form.title,
          description: form.description,
          category: form.category || undefined,
          thumbnailUrl: form.thumbnailUrl || null,
          price: form.price ?? null,
        });
        showSuccess('เพิ่มคอร์สสำเร็จ!');
      }
      setForm({
        title: '',
        description: '',
        category: '',
        thumbnailUrl: '',
        isActive: true,
        price: null,
      });
      await loadData();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบคอร์สนี้?')) return;
    await api.delete(`/admin/courses/${id}`);
    if (expandedCourseId === id) setExpandedCourseId(null);
    if (editingId === id) handleCancelEdit();
    await loadData();
  };

  const handleToggleExpand = (id: string) => {
    setExpandedCourseId((prev) => (prev === id ? null : id));
    if (editingId) handleCancelEdit();
    setVideoForm({ title: '', url: '', duration: '', order: '' });
    setDocForm({ title: '', url: '', order: '' });
    setQuizCourseId(null);
  };

  const handleAddDocument = async (e: React.FormEvent, courseId: string) => {
    e.preventDefault();
    setSavingDoc(true);
    try {
      await api.post(`/admin/courses/${courseId}/documents`, {
        title: docForm.title,
        url: docForm.url,
        order: parseInt(docForm.order) || 0,
      });
      setDocForm({ title: '', url: '', order: '' });
      await loadData();
    } catch {
      /* ignore */
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('ต้องการลบเอกสารนี้?')) return;
    await api.delete(`/admin/documents/${docId}`);
    await loadData();
  };

  const handleToggleRequireTraining = async (courseId: string, current: boolean) => {
    const next = !current;
    try {
      await api.put(`/admin/courses/${courseId}/require-training-record`, { required: next });
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, requireTrainingRecord: next } : c)),
      );
    } catch {
      /* ignore */
    }
  };

  const handleToggleQuiz = async (courseId: string) => {
    if (quizCourseId === courseId) {
      setQuizCourseId(null);
      return;
    }
    const { data } = await api.get<QuizQuestion[]>(`/admin/courses/${courseId}/quiz`);
    setQuizQuestions(data);
    setQuizCourseId(courseId);
    setQuizForm({ text: '', options: ['', '', '', ''], correctIndex: 0, order: '' });
  };

  const handleAddQuizQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizCourseId) return;
    setSavingQuiz(true);
    try {
      await api.post(`/admin/courses/${quizCourseId}/quiz`, {
        text: quizForm.text,
        options: quizForm.options.filter((o) => o.trim()),
        correctIndex: quizForm.correctIndex,
        order: parseInt(quizForm.order) || 0,
      });
      const { data } = await api.get<QuizQuestion[]>(`/admin/courses/${quizCourseId}/quiz`);
      setQuizQuestions(data);
      setQuizForm({ text: '', options: ['', '', '', ''], correctIndex: 0, order: '' });
    } catch {
      /* ignore */
    } finally {
      setSavingQuiz(false);
    }
  };

  const handleDeleteQuizQuestion = async (qId: string) => {
    if (!confirm('ต้องการลบคำถามนี้?')) return;
    await api.delete(`/admin/quiz/${qId}`);
    if (quizCourseId) {
      const { data } = await api.get<QuizQuestion[]>(`/admin/courses/${quizCourseId}/quiz`);
      setQuizQuestions(data);
    }
  };

  const handleStartEditQuiz = (q: QuizQuestion) => {
    setEditingQuizId(q.id);
    setEditQuizForm({
      text: q.text,
      options: [...q.options, '', '', '', ''].slice(0, 4),
      correctIndex: q.correctIndex,
    });
  };

  const handleSaveEditQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuizId) return;
    setSavingEditQuiz(true);
    try {
      await api.put(`/admin/quiz/${editingQuizId}`, {
        text: editQuizForm.text,
        options: editQuizForm.options.filter((o) => o.trim()),
        correctIndex: editQuizForm.correctIndex,
      });
      if (quizCourseId) {
        const { data } = await api.get<QuizQuestion[]>(`/admin/courses/${quizCourseId}/quiz`);
        setQuizQuestions(data);
      }
      setEditingQuizId(null);
    } catch {
      /* ignore */
    } finally {
      setSavingEditQuiz(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`ต้องการลบผู้ใช้ "${userName}" ออกจากระบบ?\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`))
      return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      /* ignore */
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const res = await api.get('/admin/export/excel', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `learners-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    } finally {
      setExportingExcel(false);
    }
  };

  const handleAddVideo = async (e: React.FormEvent, courseId: string) => {
    e.preventDefault();
    setSavingVideo(true);
    try {
      await api.post(`/admin/courses/${courseId}/videos`, {
        title: videoForm.title,
        url: videoForm.url,
        duration: parseInt(videoForm.duration) || 0,
        order: parseInt(videoForm.order) || 1,
        section: videoForm.section || undefined,
      });
      setVideoForm({ title: '', url: '', duration: '', order: '', section: '' });
      await loadData();
    } catch {
      /* ignore */
    } finally {
      setSavingVideo(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('ต้องการลบวิดีโอนี้?')) return;
    await api.delete(`/admin/videos/${videoId}`);
    await loadData();
  };

  const handleStartEditVideo = (v: Video) => {
    setEditingVideoId(v.id);
    setEditVideoForm({
      title: v.title,
      url: v.url,
      duration: String(v.duration),
      order: String(v.order),
      section: v.section ?? '',
    });
  };

  const handleSaveEditVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideoId) return;
    setSavingEditVideo(true);
    try {
      await api.put(`/admin/videos/${editingVideoId}`, {
        title: editVideoForm.title,
        url: editVideoForm.url,
        duration: parseInt(editVideoForm.duration) || 0,
        order: parseInt(editVideoForm.order) || 1,
        section: editVideoForm.section || null,
      });
      setEditingVideoId(null);
      await loadData();
    } catch {
      /* ignore */
    } finally {
      setSavingEditVideo(false);
    }
  };

  const loadUsers = async (search?: string) => {
    setLoadingUsers(true);
    try {
      const { data } = await api.get<UserItem[]>('/admin/users', {
        params: search ? { search } : undefined,
      });
      setUsers(data);
    } catch {
      /* ignore */
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRoleChange = async (userId: string, role: 'USER' | 'ADMIN') => {
    setUpdatingRole(userId);
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    } catch {
      /* ignore */
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/active`, { isActive });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive } : u)));
    } catch {
      /* ignore */
    }
  };

  const handleStartEditUser = (u: UserItem) => {
    setEditingUserId(u.id);
    setEditUserForm({ name: u.name, hospital: u.hospital ?? '', position: u.position ?? '' });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    setSavingUser(true);
    try {
      await api.put(`/admin/users/${editingUserId}/profile`, editUserForm);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUserId
            ? {
                ...u,
                name: editUserForm.name,
                hospital: editUserForm.hospital || null,
                position: editUserForm.position || null,
              }
            : u,
        ),
      );
      setEditingUserId(null);
    } catch {
      /* ignore */
    } finally {
      setSavingUser(false);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= courses.length) return;
    const reordered = [...courses];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    const items = reordered.map((c, i) => ({ id: c.id, order: i }));
    setCourses(reordered);
    setReordering(true);
    try {
      await api.put('/admin/courses/reorder', { items });
    } catch {
      await loadData(); // revert on error
    } finally {
      setReordering(false);
    }
  };

  const loadUpdatesTab = async () => {
    setLoadingActivity(true);
    try {
      const [actRes, annRes, setRes] = await Promise.all([
        api.get<ActivityEvent[]>('/admin/activity'),
        api.get<Announcement[]>('/admin/announcements'),
        api.get<SiteSettings>('/admin/settings'),
      ]);
      setActivity(actRes.data);
      setAnnouncements(annRes.data);
      setSiteSettings(setRes.data);
    } catch {
      /* ignore */
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAnn(true);
    try {
      if (editingAnnId) {
        const updated = await api.put<Announcement>(
          `/admin/announcements/${editingAnnId}`,
          annForm,
        );
        setAnnouncements((prev) => prev.map((a) => (a.id === editingAnnId ? updated.data : a)));
        setEditingAnnId(null);
      } else {
        const created = await api.post<Announcement>('/admin/announcements', annForm);
        setAnnouncements((prev) => [created.data, ...prev]);
      }
      setAnnForm({ title: '', body: '', pinned: false });
    } catch {
      /* ignore */
    } finally {
      setSavingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('ต้องการลบประกาศนี้?')) return;
    await api.delete(`/admin/announcements/${id}`);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  const handleStartEditAnn = (a: Announcement) => {
    setEditingAnnId(a.id);
    setAnnForm({ title: a.title, body: a.body, pinned: a.pinned });
  };

  const handleSaveSettings = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    setSavingSettings(true);
    try {
      await api.put('/admin/settings', siteSettings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch {
      /* ignore */
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExportSheets = async () => {
    setExporting(true);
    setExportMsg(null);
    try {
      await api.post('/admin/export/sheets');
      setExportMsg({ ok: true, text: 'Export ไป Google Sheets สำเร็จ!' });
    } catch {
      setExportMsg({ ok: false, text: 'Export ไม่สำเร็จ — ตรวจสอบ GOOGLE_SHEETS_CREDENTIALS' });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}
      >
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className="anim-up">
      {/* ─── Header ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
            ⚙️ Admin Panel
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            จัดการระบบ E-Learning รพ.สต.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleExportSheets} disabled={exporting} className="btn-secondary">
              {exporting ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />{' '}
                  Export...
                </>
              ) : (
                '📊 Google Sheets'
              )}
            </button>
            <button onClick={handleExportExcel} disabled={exportingExcel} className="btn-secondary">
              {exportingExcel ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />{' '}
                  Export...
                </>
              ) : (
                '📥 Excel'
              )}
            </button>
          </div>
          {exportMsg && (
            <p
              style={{ fontSize: 12, fontWeight: 600, color: exportMsg.ok ? '#16A34A' : '#DC2626' }}
            >
              {exportMsg.text}
            </p>
          )}
        </div>
      </div>

      {/* ─── Tab bar ─── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(
          [
            ['courses', '📚 จัดการคอร์ส'],
            ['users', '👥 ทะเบียนผู้ใช้'],
            ['training', '📋 ผลการปฏิบัติ'],
            ['updates', '📢 ประกาศ & อัปเดต'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              if (key === 'users' && users.length === 0) loadUsers();
              if (key === 'updates') loadUpdatesTab();
            }}
            style={{
              padding: '8px 20px',
              borderRadius: 10,
              border: `1.5px solid ${tab === key ? 'var(--primary)' : 'var(--border)'}`,
              background: tab === key ? 'var(--primary)' : 'var(--card)',
              color: tab === key ? '#fff' : 'var(--text-primary)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div>
          {/* Search bar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              className="form-input"
              placeholder="🔍 ค้นหา ชื่อ / อีเมล / โรงพยาบาล"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadUsers(userSearch)}
              style={{ flex: 1 }}
            />
            <button
              onClick={() => loadUsers(userSearch)}
              className="btn-primary"
              style={{ padding: '0 20px' }}
            >
              ค้นหา
            </button>
            <button
              onClick={() => {
                setUserSearch('');
                loadUsers();
              }}
              className="btn-secondary"
              style={{ padding: '0 14px' }}
            >
              รีเซ็ต
            </button>
            <button
              onClick={() => setShowOnlineOnly((v) => !v)}
              style={{
                padding: '0 14px',
                borderRadius: 8,
                border: `1.5px solid ${showOnlineOnly ? '#22C55E' : 'var(--border)'}`,
                background: showOnlineOnly ? 'rgba(34,197,94,0.1)' : 'var(--card)',
                color: showOnlineOnly ? '#16A34A' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: 38,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#22C55E',
                  boxShadow: showOnlineOnly ? '0 0 6px #22C55E' : 'none',
                  display: 'inline-block',
                }}
              />
              Online เท่านั้น
            </button>
          </div>

          {loadingUsers ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <div className="spinner spinner-lg" />
            </div>
          ) : (
            <div className="card table-scroll" style={{ padding: 0, overflow: 'hidden' }}>
              <table
                style={{ width: '100%', minWidth: 800, borderCollapse: 'collapse', fontSize: 13 }}
              >
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                    {[
                      '#',
                      'สถานะ',
                      'ชื่อ',
                      'อีเมล',
                      'โรงพยาบาล',
                      'ตำแหน่ง',
                      'Role',
                      'ใบ Cert',
                      'วันสมัคร',
                      'จัดการ',
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 12px',
                          textAlign: 'left',
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter((u) => !showOnlineOnly || u.isOnline)
                    .sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0))
                    .map((u, i) => (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: i % 2 === 0 ? 'var(--card)' : 'var(--bg)',
                        }}
                      >
                        <td
                          style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: 11 }}
                        >
                          {i + 1}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span
                            title={u.isOnline ? 'Online (active < 5 min)' : 'Offline'}
                            style={{
                              display: 'inline-block',
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: u.isOnline ? '#22C55E' : '#D1D5DB',
                              boxShadow: u.isOnline ? '0 0 6px #22C55E' : 'none',
                            }}
                          />
                        </td>
                        <td
                          style={{
                            padding: '8px 12px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            minWidth: 160,
                          }}
                        >
                          {editingUserId === u.id ? (
                            <form
                              onSubmit={handleSaveUser}
                              style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                            >
                              <input
                                className="form-input"
                                value={editUserForm.name}
                                onChange={(e) =>
                                  setEditUserForm((f) => ({ ...f, name: e.target.value }))
                                }
                                placeholder="ชื่อ"
                                required
                                style={{ fontSize: 12, padding: '4px 8px' }}
                              />
                              <input
                                className="form-input"
                                list="admin-hospital-list"
                                value={editUserForm.hospital}
                                onChange={(e) =>
                                  setEditUserForm((f) => ({ ...f, hospital: e.target.value }))
                                }
                                placeholder="โรงพยาบาล / รหัสหรือชื่อ"
                                autoComplete="off"
                                style={{ fontSize: 12, padding: '4px 8px' }}
                              />
                              <select
                                className="form-input"
                                value={editUserForm.position}
                                onChange={(e) =>
                                  setEditUserForm((f) => ({ ...f, position: e.target.value }))
                                }
                                style={{ fontSize: 12, padding: '4px 8px' }}
                              >
                                <option value="">-- ตำแหน่ง --</option>
                                {[
                                  'นักวิชาการสาธารณสุข',
                                  'พยาบาลวิชาชีพ',
                                  'เจ้าพนักงานสาธารณสุข',
                                  'เจ้าพนักงานทันตสาธารณสุข',
                                  'นักกายภาพบำบัด',
                                  'นักโภชนาการ',
                                  'เภสัชกร',
                                  'แพทย์แผนไทย',
                                  'ผู้อำนวยการโรงพยาบาลส่งเสริมสุขภาพตำบล',
                                  'นักเทคนิคการแพทย์',
                                  'นักวิเคราะห์นโยบายและแผน',
                                  'นักทรัพยากรบุคคล',
                                  'เจ้าพนักงานธุรการ',
                                  'นักวิชาการคอมพิวเตอร์',
                                  'นายแพทย์',
                                  'ทันตแพทย์ชาย',
                                  'ทันตแพทย์หญิง',
                                  'อื่นๆ',
                                ].map((p) => (
                                  <option key={p} value={p}>
                                    {p}
                                  </option>
                                ))}
                              </select>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                  type="submit"
                                  className="btn-primary"
                                  disabled={savingUser}
                                  style={{ fontSize: 11, padding: '3px 10px' }}
                                >
                                  {savingUser ? '...' : '💾'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingUserId(null)}
                                  className="btn-secondary"
                                  style={{ fontSize: 11, padding: '3px 8px' }}
                                >
                                  ✕
                                </button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  flexWrap: 'nowrap',
                                }}
                              >
                                <button
                                  onClick={() => handleStartEditUser(u)}
                                  title="แก้ไขข้อมูล"
                                  style={{
                                    flexShrink: 0,
                                    fontSize: 13,
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '1px 2px',
                                    lineHeight: 1,
                                    opacity: 0.7,
                                  }}
                                >
                                  ✏️
                                </button>
                                <span style={{ opacity: u.isActive ? 1 : 0.5, fontWeight: 600 }}>
                                  {u.name}
                                </span>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: '1px 7px',
                                    borderRadius: 8,
                                    background: u.isActive ? '#DCFCE7' : '#FEE2E2',
                                    color: u.isActive ? '#16A34A' : '#DC2626',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                  }}
                                >
                                  {u.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                                </span>
                              </div>
                              {u.cid && (
                                <div
                                  style={{
                                    fontSize: 10,
                                    color: 'var(--text-muted)',
                                    fontWeight: 400,
                                    marginTop: 2,
                                    paddingLeft: 22,
                                  }}
                                >
                                  CID: {u.cid}
                                </div>
                              )}
                            </>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                          {u.email}
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                          {editingUserId === u.id ? '—' : (u.hospital ?? '-')}
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                          {editingUserId === u.id ? '—' : (u.position ?? '-')}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span
                            style={{
                              padding: '2px 10px',
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 700,
                              background: u.role === 'ADMIN' ? '#EDE9FE' : '#F0FDF4',
                              color: u.role === 'ADMIN' ? '#7B68EE' : '#16A34A',
                            }}
                          >
                            {u.role === 'ADMIN' ? 'Admin' : 'Staff'}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '8px 12px',
                            textAlign: 'center',
                            fontWeight: 700,
                            color: 'var(--primary)',
                          }}
                        >
                          {u.certCount}
                        </td>
                        <td
                          style={{
                            padding: '8px 12px',
                            color: 'var(--text-muted)',
                            fontSize: 11,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {new Date(u.createdAt).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <select
                              value={u.role}
                              disabled={updatingRole === u.id}
                              onChange={(e) =>
                                handleRoleChange(u.id, e.target.value as 'USER' | 'ADMIN')
                              }
                              style={{
                                padding: '5px 8px',
                                borderRadius: 7,
                                border: '1px solid var(--border)',
                                background: 'var(--card)',
                                fontSize: 12,
                                fontFamily: 'inherit',
                                cursor: 'pointer',
                                color: 'var(--text-primary)',
                              }}
                            >
                              <option value="USER">Staff</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                            <button
                              onClick={() => handleToggleActive(u.id, !u.isActive)}
                              title={u.isActive ? 'ระงับบัญชี' : 'เปิดใช้งานบัญชี'}
                              style={{
                                padding: '5px 10px',
                                borderRadius: 7,
                                border: `1px solid ${u.isActive ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.3)'}`,
                                background: u.isActive
                                  ? 'rgba(239,68,68,0.06)'
                                  : 'rgba(34,197,94,0.08)',
                                color: u.isActive ? '#DC2626' : '#16A34A',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {u.isActive ? '🔒 ปิดใช้งาน' : '✅ เปิดใช้งาน'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              title="ลบผู้ใช้ออกจากระบบ"
                              style={{
                                padding: '5px 9px',
                                borderRadius: 7,
                                border: '1px solid rgba(239,68,68,0.3)',
                                background: 'rgba(239,68,68,0.07)',
                                color: '#DC2626',
                                fontSize: 13,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {users.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}
                      >
                        {showOnlineOnly ? 'ไม่มีผู้ใช้ Online ขณะนี้' : 'ไม่พบผู้ใช้'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'updates' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* ── LEFT: Settings + Activity ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* ── Contact Settings ── */}
            <div className="card" style={{ padding: 20 }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 6,
                }}
              >
                📞 ช่องทางติดต่อ
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                กำหนดข้อมูลและเวลาทำการของแต่ละช่องทาง
              </p>
              <form
                onSubmit={handleSaveSettings}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                {[
                  {
                    key: 'contact_phone',
                    icon: '📞',
                    valuePlaceholder: '02-xxx-xxxx',
                    detailPlaceholder: 'เช่น จันทร์-ศุกร์ 9:00-18:00',
                  },
                  {
                    key: 'contact_email',
                    icon: '📧',
                    valuePlaceholder: 'info@example.com',
                    detailPlaceholder: 'เช่น ตอบกลับภายใน 24 ชั่วโมง',
                  },
                  {
                    key: 'contact_line',
                    icon: '💬',
                    valuePlaceholder: '@yourline',
                    detailPlaceholder: 'เช่น ตอบเร็ว ตลอด 24 ชั่วโมง',
                  },
                  {
                    key: 'contact_facebook',
                    icon: '📘',
                    valuePlaceholder: 'https://fb.com/...',
                    detailPlaceholder: 'เช่น ติดตามข่าวสาร',
                  },
                  {
                    key: 'contact_address',
                    icon: '📍',
                    valuePlaceholder: 'ที่อยู่...',
                    detailPlaceholder: '',
                  },
                ].map(({ key, icon, valuePlaceholder, detailPlaceholder }) => (
                  <div
                    key={key}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 2,
                      }}
                    >
                      {icon} {(siteSettings as Record<string, string>)[`${key}_label`] || key}
                    </div>
                    <input
                      className="form-input"
                      placeholder="ชื่อหัวข้อ (เช่น โทรศัพท์, Email)"
                      value={(siteSettings as Record<string, string>)[`${key}_label`] ?? ''}
                      onChange={(e) =>
                        setSiteSettings((s) => ({ ...s, [`${key}_label`]: e.target.value }))
                      }
                      style={{ fontSize: 11, padding: '5px 9px' }}
                    />
                    <input
                      className="form-input"
                      placeholder={valuePlaceholder}
                      value={(siteSettings as Record<string, string>)[key] ?? ''}
                      onChange={(e) => setSiteSettings((s) => ({ ...s, [key]: e.target.value }))}
                      style={{ fontSize: 12, padding: '7px 10px' }}
                    />
                    {detailPlaceholder && (
                      <input
                        className="form-input"
                        placeholder={detailPlaceholder}
                        value={(siteSettings as Record<string, string>)[`${key}_detail`] ?? ''}
                        onChange={(e) =>
                          setSiteSettings((s) => ({ ...s, [`${key}_detail`]: e.target.value }))
                        }
                        style={{ fontSize: 11, padding: '5px 9px', color: 'var(--text-muted)' }}
                      />
                    )}
                  </div>
                ))}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingSettings}
                  style={{ marginTop: 4 }}
                >
                  {savingSettings ? 'กำลังบันทึก...' : '💾 บันทึกข้อมูลติดต่อ'}
                </button>
                {settingsSaved && (
                  <p style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, margin: 0 }}>
                    บันทึกสำเร็จ!
                  </p>
                )}
              </form>
            </div>

            {/* ── Activity Feed ── */}
            <div className="card" style={{ padding: 20 }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 14,
                }}
              >
                ⚡ กิจกรรมล่าสุด (30 วัน)
              </h3>
              {loadingActivity ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                  <div className="spinner spinner-lg" />
                </div>
              ) : activity.length === 0 ? (
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    padding: '20px 0',
                  }}
                >
                  ยังไม่มีกิจกรรม
                </p>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    maxHeight: 360,
                    overflowY: 'auto',
                  }}
                >
                  {activity.map((ev, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{ev.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}
                        >
                          {ev.title}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ev.detail}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--text-muted)',
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        {new Date(ev.at).toLocaleDateString('th-TH', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Certificate Template ── */}
            <div className="card" style={{ padding: 20 }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 6,
                }}
              >
                📜 ตั้งค่าใบประกาศนียบัตร
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                กำหนดข้อความและรูปแบบที่ปรากฏบนใบ Certificate ทุกใบ
              </p>
              <form
                onSubmit={handleSaveSettings}
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                {[
                  {
                    key: 'cert_title_en',
                    label: 'หัวข้อ (อังกฤษ)',
                    placeholder: 'Certificate of Completion',
                  },
                  { key: 'cert_title_th', label: 'หัวข้อ (ไทย)', placeholder: 'ใบประกาศนียบัตร' },
                  {
                    key: 'cert_intro_text',
                    label: 'ข้อความนำ',
                    placeholder: 'ขอมอบใบประกาศนียบัตรฉบับนี้เพื่อรับรองว่า',
                  },
                  {
                    key: 'cert_org_name',
                    label: 'ชื่อหน่วยงาน (แสดงใต้ชื่อผู้เรียน)',
                    placeholder: 'กรมสนับสนุนบริการสุขภาพ',
                  },
                  {
                    key: 'cert_course_label',
                    label: 'ข้อความก่อนชื่อคอร์ส',
                    placeholder: 'ได้ผ่านการศึกษาหลักสูตร',
                  },
                  {
                    key: 'cert_signer_name',
                    label: 'ชื่อผู้ลงนาม',
                    placeholder: 'ผู้อำนวยการ BGS',
                  },
                  {
                    key: 'cert_signer_title',
                    label: 'ตำแหน่ง / องค์กร',
                    placeholder: 'Bangkok Global Software Co., Ltd.',
                  },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: 12 }}>
                      {label}
                    </label>
                    <input
                      className="form-input"
                      placeholder={placeholder}
                      value={(siteSettings as Record<string, string>)[key] ?? ''}
                      onChange={(e) => setSiteSettings((s) => ({ ...s, [key]: e.target.value }))}
                      style={{ fontSize: 12, padding: '7px 10px' }}
                    />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 10 }}>
                  <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                    <label className="form-label" style={{ fontSize: 12 }}>
                      สีพื้นหลังซ้าย (เริ่ม)
                    </label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="color"
                        value={siteSettings.cert_left_bg_from}
                        onChange={(e) =>
                          setSiteSettings((s) => ({ ...s, cert_left_bg_from: e.target.value }))
                        }
                        style={{
                          width: 36,
                          height: 32,
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          cursor: 'pointer',
                          padding: 2,
                        }}
                      />
                      <input
                        className="form-input"
                        value={siteSettings.cert_left_bg_from}
                        onChange={(e) =>
                          setSiteSettings((s) => ({ ...s, cert_left_bg_from: e.target.value }))
                        }
                        style={{ fontSize: 12, padding: '7px 10px', flex: 1 }}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                    <label className="form-label" style={{ fontSize: 12 }}>
                      สีพื้นหลังซ้าย (สิ้นสุด)
                    </label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="color"
                        value={siteSettings.cert_left_bg_to}
                        onChange={(e) =>
                          setSiteSettings((s) => ({ ...s, cert_left_bg_to: e.target.value }))
                        }
                        style={{
                          width: 36,
                          height: 32,
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          cursor: 'pointer',
                          padding: 2,
                        }}
                      />
                      <input
                        className="form-input"
                        value={siteSettings.cert_left_bg_to}
                        onChange={(e) =>
                          setSiteSettings((s) => ({ ...s, cert_left_bg_to: e.target.value }))
                        }
                        style={{ fontSize: 12, padding: '7px 10px', flex: 1 }}
                      />
                    </div>
                  </div>
                </div>
                {/* Live preview strip */}
                <div
                  style={{
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    height: 52,
                    marginTop: 4,
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      background: `linear-gradient(160deg,${siteSettings.cert_left_bg_from},${siteSettings.cert_left_bg_to})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      flexShrink: 0,
                    }}
                  >
                    🏥
                  </div>
                  <div
                    style={{
                      flex: 1,
                      background: 'var(--surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      padding: '0 12px',
                      gap: 2,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        letterSpacing: 2,
                        color: '#9CA3AF',
                        textTransform: 'uppercase',
                      }}
                    >
                      {siteSettings.cert_title_en || 'Certificate of Completion'}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1F2937' }}>
                      {siteSettings.cert_title_th || 'ใบประกาศนียบัตร'}
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingSettings}
                  style={{ marginTop: 4 }}
                >
                  {savingSettings ? 'กำลังบันทึก...' : '💾 บันทึกการตั้งค่าใบประกาศ'}
                </button>
                {settingsSaved && (
                  <p style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, margin: 0 }}>
                    บันทึกสำเร็จ!
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* ── RIGHT: Announcements ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 14,
                }}
              >
                {editingAnnId ? '✏️ แก้ไขประกาศ' : '📢 เพิ่มประกาศใหม่'}
              </h3>
              <form
                onSubmit={handleSaveAnnouncement}
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <input
                  className="form-input"
                  placeholder="หัวข้อประกาศ"
                  value={annForm.title}
                  onChange={(e) => setAnnForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  style={{ fontSize: 13 }}
                />
                <textarea
                  className="form-input"
                  placeholder="รายละเอียดประกาศ..."
                  rows={4}
                  value={annForm.body}
                  onChange={(e) => setAnnForm((f) => ({ ...f, body: e.target.value }))}
                  required
                  style={{ fontSize: 13, resize: 'vertical', minHeight: 80 }}
                />
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={annForm.pinned}
                    onChange={(e) => setAnnForm((f) => ({ ...f, pinned: e.target.checked }))}
                    style={{ width: 15, height: 15, accentColor: 'var(--primary)' }}
                  />
                  📌 ปักหมุด (แสดงบนสุด)
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={savingAnn}
                    style={{ flex: 1 }}
                  >
                    {savingAnn ? 'กำลังบันทึก...' : editingAnnId ? '💾 อัปเดต' : '➕ เพิ่มประกาศ'}
                  </button>
                  {editingAnnId && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setEditingAnnId(null);
                        setAnnForm({ title: '', body: '', pinned: false });
                      }}
                    >
                      ยกเลิก
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 14,
                }}
              >
                รายการประกาศ
                <span className="badge badge-purple" style={{ marginLeft: 8 }}>
                  {announcements.length}
                </span>
              </h3>
              {announcements.length === 0 ? (
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    padding: '20px 0',
                  }}
                >
                  ยังไม่มีประกาศ
                </p>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    maxHeight: 420,
                    overflowY: 'auto',
                  }}
                >
                  {announcements.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        background: 'var(--bg)',
                        border: `1px solid ${a.pinned ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 8,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginBottom: 4,
                            }}
                          >
                            {a.pinned && <span style={{ fontSize: 12 }}>📌</span>}
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                              }}
                            >
                              {a.title}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: 12,
                              color: 'var(--text-muted)',
                              margin: 0,
                              lineHeight: 1.5,
                            }}
                          >
                            {a.body}
                          </p>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                            {new Date(a.createdAt).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button
                            onClick={() => handleStartEditAnn(a)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              border: '1px solid rgba(123,104,238,0.25)',
                              background: 'rgba(123,104,238,0.06)',
                              color: 'var(--primary)',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleDeleteAnnouncement(a.id)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              border: '1px solid rgba(239,68,68,0.2)',
                              background: 'rgba(239,68,68,0.06)',
                              color: '#DC2626',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            ลบ
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Hospital Management ── */}
            <HospitalManager />
          </div>
        </div>
      )}

      {tab === 'courses' && (
        <>
          {/* ─── Analytics ─── */}
          {analytics && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 14,
                marginBottom: 28,
              }}
            >
              {statCards.map(({ key, label, icon, bar }) => (
                <div key={key} className="stat-card">
                  <div className="stat-card-bar" style={{ background: bar }} />
                  <div className="stat-card-icon">{icon}</div>
                  <div className="stat-label">{label}</div>
                  <div
                    className="stat-value"
                    style={{
                      background: bar,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontSize: 30,
                    }}
                  >
                    {(analytics as unknown as Record<string, number>)[key]}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── Categories ─── */}
          <div className="card" style={{ padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                }}
              >
                🏷️ หมวดหมู่คอร์ส
              </div>
              <input
                className="form-input"
                placeholder="เช่น สาธารณสุข, บริหาร, เภสัช, เวชระเบียน (คั่นด้วย ,)"
                value={siteSettings.categories}
                onChange={(e) => setSiteSettings((s) => ({ ...s, categories: e.target.value }))}
                style={{ fontSize: 12, padding: '6px 10px', flex: 1, minWidth: 240 }}
              />
              <button
                onClick={handleSaveSettings}
                className="btn-primary"
                disabled={savingSettings}
                style={{ fontSize: 12, padding: '6px 14px', whiteSpace: 'nowrap' }}
              >
                {savingSettings ? 'บันทึก...' : '💾 บันทึก'}
              </button>
            </div>
            {siteSettings.categories && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {siteSettings.categories
                  .split(',')
                  .map((c) => c.trim())
                  .filter(Boolean)
                  .map((cat) => (
                    <span
                      key={cat}
                      style={{
                        padding: '3px 12px',
                        borderRadius: 20,
                        background: 'rgba(123,104,238,0.12)',
                        color: 'var(--primary)',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {cat}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* ─── Two columns ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Create / Edit form */}
            <div className="card" style={{ padding: 24, order: 2 }}>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {editingId ? '✏️ แก้ไขคอร์ส' : '➕ เพิ่มคอร์สใหม่'}
              </h3>

              {successMsg && <div className="alert-success">{successMsg}</div>}

              <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                <div className="form-group">
                  <label className="form-label">ชื่อคอร์ส</label>
                  <input
                    className="form-input"
                    placeholder="ชื่อคอร์ส"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">คำอธิบาย</label>
                  <textarea
                    className="form-input"
                    placeholder="คำอธิบายคอร์ส"
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    required
                    style={{ resize: 'vertical', minHeight: 90 }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">หมวดหมู่ (ไม่บังคับ)</label>
                  <input
                    className="form-input"
                    list="category-options"
                    placeholder="เลือกหรือพิมพ์หมวดหมู่"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  />
                  <datalist id="category-options">
                    {siteSettings.categories
                      .split(',')
                      .map((c) => c.trim())
                      .filter(Boolean)
                      .map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                  </datalist>
                </div>
                <div className="form-group">
                  <label className="form-label">รูปหน้าปก (URL รูปภาพ — ไม่บังคับ)</label>
                  <input
                    className="form-input"
                    placeholder="https://example.com/image.jpg"
                    value={form.thumbnailUrl}
                    onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))}
                  />
                  {form.thumbnailUrl && (
                    <img
                      src={form.thumbnailUrl}
                      alt="preview"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                      onLoad={(e) => {
                        (e.target as HTMLImageElement).style.display = 'block';
                      }}
                      style={{
                        marginTop: 8,
                        width: '100%',
                        maxHeight: 160,
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        display: 'none',
                      }}
                    />
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">ราคา (บาท) — เว้นว่างหากฟรี</label>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="0 = ฟรี"
                    value={form.price ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        price: e.target.value === '' ? null : Number(e.target.value),
                      }))
                    }
                  />
                </div>
                {editingId && (
                  <div className="form-group">
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        cursor: 'pointer',
                        fontSize: 14,
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                        style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
                      />
                      เปิดใช้งานคอร์ส
                    </label>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
                    style={{ flex: 1 }}
                  >
                    {saving ? (
                      <>
                        <span
                          className="spinner"
                          style={{ width: 16, height: 16, borderWidth: 2 }}
                        />{' '}
                        กำลังบันทึก...
                      </>
                    ) : editingId ? (
                      '💾 อัปเดตคอร์ส'
                    ) : (
                      'บันทึกคอร์ส'
                    )}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="btn-secondary"
                      style={{ flexShrink: 0 }}
                    >
                      ยกเลิก
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Course list */}
            <div className="card" style={{ padding: 24, order: 1 }}>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                📋 คอร์สทั้งหมด
                <span className="badge badge-purple" style={{ marginLeft: 4 }}>
                  {courses.length}
                </span>
                {reordering && (
                  <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 400 }}>
                    กำลังบันทึก...
                  </span>
                )}
              </h3>

              {courses.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 0' }}>
                  <div className="empty-state-icon" style={{ fontSize: 36 }}>
                    📭
                  </div>
                  <div className="empty-state-title" style={{ fontSize: 14 }}>
                    ยังไม่มีคอร์ส
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    maxHeight: 480,
                    overflowY: 'auto',
                    paddingRight: 4,
                  }}
                >
                  {courses.map((c, idx) => (
                    <div key={c.id}>
                      {/* Course row */}
                      <div
                        className="table-row"
                        style={{
                          border: `1px solid ${editingId === c.id ? 'var(--primary)' : 'var(--border)'}`,
                          borderRadius: expandedCourseId === c.id ? '12px 12px 0 0' : 12,
                          background: editingId === c.id ? 'var(--primary-light)' : undefined,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 9,
                              background: 'linear-gradient(135deg,#7B68EE,#9B8FFF)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 14,
                              flexShrink: 0,
                            }}
                          >
                            🎬
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {c.title}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {c.videos?.length ?? 0} วิดีโอ ·{' '}
                              {c.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                          {/* Order up/down */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <button
                              onClick={() => handleMoveOrder(idx, 'up')}
                              disabled={idx === 0 || reordering}
                              title="เลื่อนขึ้น"
                              style={{
                                padding: '2px 6px',
                                borderRadius: 5,
                                border: '1px solid var(--border)',
                                background: 'var(--bg)',
                                color: idx === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                                fontSize: 10,
                                cursor: idx === 0 ? 'default' : 'pointer',
                                fontFamily: 'inherit',
                                lineHeight: 1,
                                opacity: idx === 0 ? 0.35 : 1,
                              }}
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => handleMoveOrder(idx, 'down')}
                              disabled={idx === courses.length - 1 || reordering}
                              title="เลื่อนลง"
                              style={{
                                padding: '2px 6px',
                                borderRadius: 5,
                                border: '1px solid var(--border)',
                                background: 'var(--bg)',
                                color:
                                  idx === courses.length - 1
                                    ? 'var(--text-muted)'
                                    : 'var(--text-primary)',
                                fontSize: 10,
                                cursor: idx === courses.length - 1 ? 'default' : 'pointer',
                                fontFamily: 'inherit',
                                lineHeight: 1,
                                opacity: idx === courses.length - 1 ? 0.35 : 1,
                              }}
                            >
                              ▼
                            </button>
                          </div>
                          <button
                            onClick={() => handleToggleExpand(c.id)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 8,
                              border: '1px solid rgba(59,130,246,0.25)',
                              background:
                                expandedCourseId === c.id
                                  ? 'rgba(59,130,246,0.12)'
                                  : 'rgba(59,130,246,0.06)',
                              color: '#3B82F6',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            {expandedCourseId === c.id ? '▲ วิดีโอ' : '▼ วิดีโอ'}
                          </button>
                          <button
                            onClick={() => handleEdit(c)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 8,
                              border: '1px solid rgba(123,104,238,0.25)',
                              background: 'rgba(123,104,238,0.06)',
                              color: 'var(--primary)',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 8,
                              border: '1px solid rgba(239,68,68,0.2)',
                              background: 'rgba(239,68,68,0.06)',
                              color: '#DC2626',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            ลบ
                          </button>
                        </div>
                      </div>

                      {/* Video management panel (expandable) */}
                      {expandedCourseId === c.id && (
                        <div
                          style={{
                            border: '1px solid var(--border)',
                            borderTop: 'none',
                            borderRadius: '0 0 12px 12px',
                            padding: '12px 14px',
                            background: 'var(--bg)',
                          }}
                        >
                          {/* Video list */}
                          {c.videos?.length === 0 ? (
                            <p
                              style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}
                            >
                              ยังไม่มีวิดีโอในคอร์สนี้
                            </p>
                          ) : (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                                marginBottom: 10,
                              }}
                            >
                              {c.videos?.map((v) => (
                                <div key={v.id}>
                                  {editingVideoId === v.id ? (
                                    /* ── Inline edit form ── */
                                    <form
                                      onSubmit={handleSaveEditVideo}
                                      style={{
                                        padding: '10px 12px',
                                        borderRadius: 8,
                                        background: '#EDE9FE',
                                        border: '1px solid var(--primary)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 6,
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: 'var(--primary)',
                                          marginBottom: 2,
                                        }}
                                      >
                                        ✏️ แก้ไขวิดีโอ
                                      </div>
                                      <input
                                        className="form-input"
                                        placeholder="ชื่อวิดีโอ"
                                        value={editVideoForm.title}
                                        onChange={(e) =>
                                          setEditVideoForm((f) => ({ ...f, title: e.target.value }))
                                        }
                                        required
                                        style={{ fontSize: 12, padding: '7px 10px' }}
                                      />
                                      <input
                                        className="form-input"
                                        placeholder="URL วิดีโอ"
                                        value={editVideoForm.url}
                                        onChange={(e) =>
                                          setEditVideoForm((f) => ({ ...f, url: e.target.value }))
                                        }
                                        required
                                        style={{ fontSize: 12, padding: '7px 10px' }}
                                      />
                                      <input
                                        className="form-input"
                                        placeholder="หมวดหมู่วิดีโอ (เช่น บทที่ 1) — ไม่บังคับ"
                                        value={editVideoForm.section}
                                        onChange={(e) =>
                                          setEditVideoForm((f) => ({
                                            ...f,
                                            section: e.target.value,
                                          }))
                                        }
                                        style={{ fontSize: 12, padding: '7px 10px' }}
                                      />
                                      <div style={{ display: 'flex', gap: 6 }}>
                                        <input
                                          className="form-input"
                                          type="number"
                                          placeholder="ความยาว (วินาที)"
                                          value={editVideoForm.duration}
                                          onChange={(e) =>
                                            setEditVideoForm((f) => ({
                                              ...f,
                                              duration: e.target.value,
                                            }))
                                          }
                                          required
                                          min={1}
                                          style={{ fontSize: 12, padding: '7px 10px', flex: 1 }}
                                        />
                                        <input
                                          className="form-input"
                                          type="number"
                                          placeholder="ลำดับ"
                                          value={editVideoForm.order}
                                          onChange={(e) =>
                                            setEditVideoForm((f) => ({
                                              ...f,
                                              order: e.target.value,
                                            }))
                                          }
                                          required
                                          min={1}
                                          style={{ fontSize: 12, padding: '7px 10px', width: 70 }}
                                        />
                                      </div>
                                      <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                          type="submit"
                                          className="btn-primary"
                                          disabled={savingEditVideo}
                                          style={{ fontSize: 12, padding: '6px 14px', flex: 1 }}
                                        >
                                          {savingEditVideo ? 'กำลังบันทึก...' : '💾 บันทึก'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingVideoId(null)}
                                          className="btn-secondary"
                                          style={{ fontSize: 12, padding: '6px 12px' }}
                                        >
                                          ยกเลิก
                                        </button>
                                      </div>
                                    </form>
                                  ) : (
                                    /* ── Display row ── */
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '6px 10px',
                                        borderRadius: 8,
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: 11,
                                          color: 'var(--text-muted)',
                                          minWidth: 18,
                                        }}
                                      >
                                        {v.order}.
                                      </span>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                          style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                          }}
                                        >
                                          {v.title}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: 10,
                                            color: 'var(--text-muted)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                          }}
                                        >
                                          {Math.floor(v.duration / 60)} นาที {v.duration % 60}{' '}
                                          วินาที
                                          {v.url && (
                                            <span style={{ marginLeft: 6, opacity: 0.7 }}>
                                              · {v.url}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleStartEditVideo(v)}
                                        style={{
                                          padding: '3px 8px',
                                          borderRadius: 6,
                                          border: '1px solid rgba(123,104,238,0.25)',
                                          background: 'rgba(123,104,238,0.06)',
                                          color: 'var(--primary)',
                                          fontSize: 11,
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          fontFamily: 'inherit',
                                          flexShrink: 0,
                                        }}
                                      >
                                        แก้ไข
                                      </button>
                                      <button
                                        onClick={() => handleDeleteVideo(v.id)}
                                        style={{
                                          padding: '3px 8px',
                                          borderRadius: 6,
                                          border: '1px solid rgba(239,68,68,0.2)',
                                          background: 'rgba(239,68,68,0.06)',
                                          color: '#DC2626',
                                          fontSize: 11,
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          fontFamily: 'inherit',
                                          flexShrink: 0,
                                        }}
                                      >
                                        ลบ
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add video form */}
                          <div
                            style={{
                              borderTop: '1px solid var(--border)',
                              paddingTop: 10,
                              fontSize: 12,
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              marginBottom: 8,
                            }}
                          >
                            ➕ เพิ่มวิดีโอใหม่
                          </div>
                          <form
                            onSubmit={(e) => handleAddVideo(e, c.id)}
                            style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                          >
                            <input
                              className="form-input"
                              placeholder="ชื่อวิดีโอ"
                              value={videoForm.title}
                              onChange={(e) =>
                                setVideoForm((f) => ({ ...f, title: e.target.value }))
                              }
                              required
                              style={{ fontSize: 12, padding: '7px 10px' }}
                            />
                            <input
                              className="form-input"
                              placeholder="URL วิดีโอ"
                              value={videoForm.url}
                              onChange={(e) => setVideoForm((f) => ({ ...f, url: e.target.value }))}
                              required
                              style={{ fontSize: 12, padding: '7px 10px' }}
                            />
                            <input
                              className="form-input"
                              placeholder="หมวดหมู่วิดีโอ (เช่น บทที่ 1, Introduction) — ไม่บังคับ"
                              value={videoForm.section}
                              onChange={(e) =>
                                setVideoForm((f) => ({ ...f, section: e.target.value }))
                              }
                              style={{ fontSize: 12, padding: '7px 10px' }}
                            />
                            <div style={{ display: 'flex', gap: 6 }}>
                              <input
                                className="form-input"
                                type="number"
                                placeholder="ความยาว (วินาที)"
                                value={videoForm.duration}
                                onChange={(e) =>
                                  setVideoForm((f) => ({ ...f, duration: e.target.value }))
                                }
                                required
                                min={1}
                                style={{ fontSize: 12, padding: '7px 10px', flex: 1 }}
                              />
                              <input
                                className="form-input"
                                type="number"
                                placeholder="ลำดับ"
                                value={videoForm.order}
                                onChange={(e) =>
                                  setVideoForm((f) => ({ ...f, order: e.target.value }))
                                }
                                required
                                min={1}
                                style={{ fontSize: 12, padding: '7px 10px', width: 80 }}
                              />
                            </div>
                            <button
                              type="submit"
                              className="btn-primary"
                              disabled={savingVideo}
                              style={{ fontSize: 12, padding: '7px 14px' }}
                            >
                              {savingVideo ? 'กำลังบันทึก...' : 'เพิ่มวิดีโอ'}
                            </button>
                          </form>

                          {/* ─── Documents ─── */}
                          <div
                            style={{
                              borderTop: '1px solid var(--border)',
                              paddingTop: 10,
                              marginTop: 10,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                marginBottom: 8,
                              }}
                            >
                              📄 เอกสารประกอบ
                            </div>
                            {c.documents?.map((d) => (
                              <div
                                key={d.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '5px 8px',
                                  borderRadius: 7,
                                  background: 'var(--surface)',
                                  border: '1px solid var(--border)',
                                  marginBottom: 4,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 11,
                                    flex: 1,
                                    color: 'var(--text-primary)',
                                    fontWeight: 600,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {d.title}
                                </span>
                                <button
                                  onClick={() => handleDeleteDocument(d.id)}
                                  style={{
                                    padding: '2px 7px',
                                    borderRadius: 6,
                                    border: '1px solid rgba(239,68,68,0.2)',
                                    background: 'rgba(239,68,68,0.06)',
                                    color: '#DC2626',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    flexShrink: 0,
                                  }}
                                >
                                  ลบ
                                </button>
                              </div>
                            ))}
                            <form
                              onSubmit={(e) => handleAddDocument(e, c.id)}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 5,
                                marginTop: 6,
                              }}
                            >
                              <input
                                className="form-input"
                                placeholder="ชื่อเอกสาร"
                                value={docForm.title}
                                onChange={(e) =>
                                  setDocForm((f) => ({ ...f, title: e.target.value }))
                                }
                                required
                                style={{ fontSize: 12, padding: '6px 10px' }}
                              />
                              <input
                                className="form-input"
                                placeholder="URL เอกสาร"
                                value={docForm.url}
                                onChange={(e) => setDocForm((f) => ({ ...f, url: e.target.value }))}
                                required
                                style={{ fontSize: 12, padding: '6px 10px' }}
                              />
                              <button
                                type="submit"
                                className="btn-secondary"
                                disabled={savingDoc}
                                style={{ fontSize: 12, padding: '6px 12px' }}
                              >
                                {savingDoc ? 'กำลังบันทึก...' : 'เพิ่มเอกสาร'}
                              </button>
                            </form>
                          </div>

                          {/* ─── Training Record Toggle ─── */}
                          <div
                            style={{
                              borderTop: '1px solid var(--border)',
                              paddingTop: 10,
                              marginTop: 10,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: 'var(--text-primary)',
                                }}
                              >
                                📋 บันทึกผลการปฏิบัติ
                              </div>
                              <div
                                style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}
                              >
                                {c.requireTrainingRecord
                                  ? 'บังคับส่งผลก่อนรับใบประกาศ'
                                  : 'ไม่บังคับ — รับใบประกาศได้ทันที'}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                handleToggleRequireTraining(c.id, c.requireTrainingRecord)
                              }
                              style={{
                                padding: '5px 12px',
                                borderRadius: 20,
                                border: 'none',
                                background: c.requireTrainingRecord ? '#16A34A' : '#D1D5DB',
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                whiteSpace: 'nowrap',
                                transition: 'background 0.2s',
                              }}
                            >
                              {c.requireTrainingRecord ? '✓ เปิดใช้งาน' : 'ปิดอยู่'}
                            </button>
                          </div>

                          {/* ─── Quiz ─── */}
                          <div
                            style={{
                              borderTop: '1px solid var(--border)',
                              paddingTop: 10,
                              marginTop: 10,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 8,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: 'var(--text-primary)',
                                }}
                              >
                                📝 แบบทดสอบ
                              </div>
                              <button
                                onClick={() => handleToggleQuiz(c.id)}
                                style={{
                                  padding: '3px 10px',
                                  borderRadius: 8,
                                  border: '1px solid var(--border)',
                                  background: 'var(--bg)',
                                  color: 'var(--text-muted)',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                }}
                              >
                                {quizCourseId === c.id ? '▲ ซ่อน' : '▼ จัดการ'}
                              </button>
                            </div>
                            {quizCourseId === c.id && (
                              <div>
                                {/* Question list */}
                                {quizQuestions.length === 0 && (
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: 'var(--text-muted)',
                                      padding: '8px 0',
                                      textAlign: 'center',
                                    }}
                                  >
                                    ยังไม่มีคำถาม — เพิ่มคำถามด้านล่าง
                                  </div>
                                )}
                                {quizQuestions.map((q, qi) => (
                                  <div key={q.id} style={{ marginBottom: 6 }}>
                                    {editingQuizId === q.id ? (
                                      /* ── Inline edit form ── */
                                      <form
                                        onSubmit={handleSaveEditQuiz}
                                        style={{
                                          background: '#EFF6FF',
                                          border: '1px solid #BFDBFE',
                                          borderRadius: 8,
                                          padding: '10px 10px',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: 5,
                                        }}
                                      >
                                        <input
                                          className="form-input"
                                          value={editQuizForm.text}
                                          onChange={(e) =>
                                            setEditQuizForm((f) => ({ ...f, text: e.target.value }))
                                          }
                                          required
                                          style={{ fontSize: 12, padding: '5px 8px' }}
                                          placeholder="คำถาม"
                                        />
                                        {editQuizForm.options.map((opt, oi) => (
                                          <div
                                            key={oi}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 5,
                                            }}
                                          >
                                            <input
                                              type="radio"
                                              name={`edit-correct-${q.id}`}
                                              checked={editQuizForm.correctIndex === oi}
                                              onChange={() =>
                                                setEditQuizForm((f) => ({ ...f, correctIndex: oi }))
                                              }
                                              style={{ accentColor: '#2563EB', flexShrink: 0 }}
                                              title="คำตอบถูก"
                                            />
                                            <input
                                              className="form-input"
                                              value={opt}
                                              onChange={(e) =>
                                                setEditQuizForm((f) => {
                                                  const opts = [...f.options];
                                                  opts[oi] = e.target.value;
                                                  return { ...f, options: opts };
                                                })
                                              }
                                              placeholder={`ตัวเลือก ${oi + 1}`}
                                              style={{ fontSize: 12, padding: '4px 8px', flex: 1 }}
                                            />
                                          </div>
                                        ))}
                                        <div style={{ display: 'flex', gap: 5 }}>
                                          <button
                                            type="submit"
                                            disabled={savingEditQuiz}
                                            style={{
                                              flex: 1,
                                              padding: '5px',
                                              background: '#2563EB',
                                              color: '#fff',
                                              border: 'none',
                                              borderRadius: 6,
                                              fontSize: 12,
                                              fontWeight: 700,
                                              cursor: 'pointer',
                                              fontFamily: 'inherit',
                                            }}
                                          >
                                            {savingEditQuiz ? 'บันทึก...' : '✓ บันทึก'}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingQuizId(null)}
                                            style={{
                                              padding: '5px 10px',
                                              background: '#F3F4F6',
                                              border: '1px solid var(--border)',
                                              borderRadius: 6,
                                              fontSize: 12,
                                              cursor: 'pointer',
                                              fontFamily: 'inherit',
                                            }}
                                          >
                                            ยกเลิก
                                          </button>
                                        </div>
                                      </form>
                                    ) : (
                                      /* ── Question display ── */
                                      <div
                                        style={{
                                          display: 'flex',
                                          alignItems: 'flex-start',
                                          gap: 6,
                                          padding: '7px 9px',
                                          borderRadius: 7,
                                          background: 'var(--bg)',
                                          border: '1px solid var(--border)',
                                        }}
                                      >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div
                                            style={{
                                              fontSize: 12,
                                              fontWeight: 600,
                                              color: 'var(--text-primary)',
                                              marginBottom: 3,
                                            }}
                                          >
                                            {qi + 1}. {q.text}
                                          </div>
                                          <div
                                            style={{
                                              display: 'flex',
                                              flexWrap: 'wrap',
                                              gap: '3px 10px',
                                            }}
                                          >
                                            {q.options.map((opt, oi) => (
                                              <span
                                                key={oi}
                                                style={{
                                                  fontSize: 10,
                                                  color:
                                                    oi === q.correctIndex
                                                      ? '#16A34A'
                                                      : 'var(--text-muted)',
                                                  fontWeight: oi === q.correctIndex ? 700 : 400,
                                                }}
                                              >
                                                {oi === q.correctIndex ? '✓' : '○'} {opt}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                          <button
                                            onClick={() => handleStartEditQuiz(q)}
                                            style={{
                                              padding: '3px 8px',
                                              borderRadius: 6,
                                              border: '1px solid rgba(37,99,235,0.25)',
                                              background: 'rgba(37,99,235,0.06)',
                                              color: '#2563EB',
                                              fontSize: 11,
                                              fontWeight: 600,
                                              cursor: 'pointer',
                                              fontFamily: 'inherit',
                                            }}
                                          >
                                            แก้ไข
                                          </button>
                                          <button
                                            onClick={() => handleDeleteQuizQuestion(q.id)}
                                            style={{
                                              padding: '3px 8px',
                                              borderRadius: 6,
                                              border: '1px solid rgba(239,68,68,0.2)',
                                              background: 'rgba(239,68,68,0.06)',
                                              color: '#DC2626',
                                              fontSize: 11,
                                              fontWeight: 600,
                                              cursor: 'pointer',
                                              fontFamily: 'inherit',
                                            }}
                                          >
                                            ลบ
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}

                                {/* ── Add new question form ── */}
                                <div
                                  style={{
                                    borderTop: '1px dashed var(--border)',
                                    paddingTop: 10,
                                    marginTop: 8,
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: 'var(--text-muted)',
                                      marginBottom: 6,
                                    }}
                                  >
                                    + เพิ่มคำถามใหม่
                                  </div>
                                  <form
                                    onSubmit={handleAddQuizQuestion}
                                    style={{ display: 'flex', flexDirection: 'column', gap: 5 }}
                                  >
                                    <input
                                      className="form-input"
                                      placeholder="คำถาม"
                                      value={quizForm.text}
                                      onChange={(e) =>
                                        setQuizForm((f) => ({ ...f, text: e.target.value }))
                                      }
                                      required
                                      style={{ fontSize: 12, padding: '6px 10px' }}
                                    />
                                    {quizForm.options.map((opt, oi) => (
                                      <div
                                        key={oi}
                                        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                                      >
                                        <input
                                          type="radio"
                                          name="correct"
                                          checked={quizForm.correctIndex === oi}
                                          onChange={() =>
                                            setQuizForm((f) => ({ ...f, correctIndex: oi }))
                                          }
                                          style={{ accentColor: 'var(--primary)', flexShrink: 0 }}
                                          title="ตอบถูก"
                                        />
                                        <input
                                          className="form-input"
                                          placeholder={`ตัวเลือก ${oi + 1}`}
                                          value={opt}
                                          onChange={(e) =>
                                            setQuizForm((f) => {
                                              const opts = [...f.options];
                                              opts[oi] = e.target.value;
                                              return { ...f, options: opts };
                                            })
                                          }
                                          required
                                          style={{ fontSize: 12, padding: '5px 8px', flex: 1 }}
                                        />
                                      </div>
                                    ))}
                                    <p
                                      style={{
                                        fontSize: 10,
                                        color: 'var(--text-muted)',
                                        margin: '2px 0',
                                      }}
                                    >
                                      🔘 คลิก radio เพื่อเลือกคำตอบที่ถูกต้อง
                                    </p>
                                    <button
                                      type="submit"
                                      className="btn-secondary"
                                      disabled={savingQuiz}
                                      style={{ fontSize: 12, padding: '6px 12px' }}
                                    >
                                      {savingQuiz ? 'กำลังบันทึก...' : '+ เพิ่มคำถาม'}
                                    </button>
                                  </form>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── Top 5 Learners + Completion Rates (bottom) ─── */}
          {analytics &&
            (analytics.topLearners?.length > 0 || analytics.courseCompletionRates?.length > 0) && (
              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}
              >
                {analytics.topLearners?.length > 0 && (
                  <div className="card" style={{ padding: 20 }}>
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 14,
                      }}
                    >
                      🏅 Top 5 Learners
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {analytics.topLearners.map((l, i) => (
                        <div
                          key={l.userId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 10px',
                            borderRadius: 10,
                            background: 'var(--bg)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 8,
                              background:
                                i === 0
                                  ? '#FFD700'
                                  : i === 1
                                    ? '#A8A9AD'
                                    : i === 2
                                      ? '#CD7F32'
                                      : 'var(--primary-light)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 800,
                              flexShrink: 0,
                              color: i < 3 ? '#fff' : 'var(--primary)',
                            }}
                          >
                            {i + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {l.name}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {l.hospital ?? '-'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>
                              {Math.round(l.totalSeconds / 60)} นาที
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {l.certCount} ใบ
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {analytics.courseCompletionRates?.length > 0 && (
                  <div className="card" style={{ padding: 20 }}>
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 14,
                      }}
                    >
                      📊 อัตราจบคอร์ส
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {analytics.courseCompletionRates.map((c) => (
                        <div key={c.courseId}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 12,
                              color: 'var(--text-primary)',
                              marginBottom: 4,
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                                marginRight: 8,
                              }}
                            >
                              {c.title}
                            </span>
                            <span
                              style={{ fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}
                            >
                              {c.rate}%
                            </span>
                          </div>
                          <div className="progress-track" style={{ height: 6 }}>
                            <div className="progress-fill" style={{ width: `${c.rate}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
        </>
      )}
    </div>
  );
}

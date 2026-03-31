import { useEffect, useState } from 'react';
import api from '../../lib/api';

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
  isActive: boolean;
  order: number;
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

type AdminTab = 'courses' | 'users';

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
  const [form, setForm] = useState({ title: '', description: '', category: '', isActive: true });
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

  // Reorder
  const [reordering, setReordering] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [exportingExcel, setExportingExcel] = useState(false);

  const loadData = async () => {
    const [a, c] = await Promise.all([
      api.get<Analytics>('/admin/analytics'),
      api.get<CourseItem[]>('/courses'),
    ]);
    setAnalytics(a.data);
    setCourses(c.data);
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
      isActive: c.isActive,
    });
    setExpandedCourseId(null);
    setQuizCourseId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ title: '', description: '', category: '', isActive: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/courses/${editingId}`, form);
        showSuccess('อัปเดตคอร์สสำเร็จ!');
        setEditingId(null);
      } else {
        await api.post('/admin/courses', {
          title: form.title,
          description: form.description,
          category: form.category || undefined,
        });
        showSuccess('เพิ่มคอร์สสำเร็จ!');
      }
      setForm({ title: '', description: '', category: '', isActive: true });
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
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              if (key === 'users' && users.length === 0) loadUsers();
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
          </div>

          {loadingUsers ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <div className="spinner spinner-lg" />
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
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
                  {users.map((u, i) => (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: i % 2 === 0 ? 'var(--card)' : 'var(--bg)',
                      }}
                    >
                      <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: 11 }}>
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
                              value={editUserForm.hospital}
                              onChange={(e) =>
                                setEditUserForm((f) => ({ ...f, hospital: e.target.value }))
                              }
                              placeholder="โรงพยาบาล"
                              style={{ fontSize: 12, padding: '4px 8px' }}
                            />
                            <input
                              className="form-input"
                              value={editUserForm.position}
                              onChange={(e) =>
                                setEditUserForm((f) => ({ ...f, position: e.target.value }))
                              }
                              placeholder="ตำแหน่ง"
                              style={{ fontSize: 12, padding: '4px 8px' }}
                            />
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ opacity: u.isActive ? 1 : 0.5 }}>{u.name}</span>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '1px 7px',
                                  borderRadius: 8,
                                  background: u.isActive ? '#DCFCE7' : '#FEE2E2',
                                  color: u.isActive ? '#16A34A' : '#DC2626',
                                  whiteSpace: 'nowrap',
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
                                }}
                              >
                                CID: {u.cid}
                              </div>
                            )}
                            <button
                              onClick={() => handleStartEditUser(u)}
                              style={{
                                marginTop: 2,
                                fontSize: 10,
                                color: 'var(--primary)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                padding: 0,
                                fontWeight: 600,
                              }}
                            >
                              ✏️ แก้ไข
                            </button>
                          </>
                        )}
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{u.email}</td>
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
                        <select
                          value={u.role}
                          disabled={updatingRole === u.id}
                          onChange={(e) =>
                            handleRoleChange(u.id, e.target.value as 'USER' | 'ADMIN')
                          }
                          style={{
                            padding: '4px 8px',
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
                            marginTop: 4,
                            width: '100%',
                            padding: '4px 8px',
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
                          }}
                        >
                          {u.isActive ? '🔒 ปิดใช้งาน' : '✅ ใช้งาน'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}
                      >
                        ไม่พบผู้ใช้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
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

          {/* ─── Top 5 Learners + Completion Rates ─── */}
          {analytics &&
            (analytics.topLearners?.length > 0 || analytics.courseCompletionRates?.length > 0) && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                {/* Top 5 Learners */}
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
                {/* Completion Rates */}
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

          {/* ─── Two columns ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Create / Edit form */}
            <div className="card" style={{ padding: 24 }}>
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
                    placeholder="เช่น สาธารณสุข, บริหาร, เภสัช"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
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
            <div className="card" style={{ padding: 24 }}>
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
                                {quizQuestions.map((q, qi) => (
                                  <div
                                    key={q.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: 6,
                                      padding: '6px 8px',
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
                                      }}
                                    >
                                      {qi + 1}. {q.text}
                                    </span>
                                    <button
                                      onClick={() => handleDeleteQuizQuestion(q.id)}
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
                                  onSubmit={handleAddQuizQuestion}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 5,
                                    marginTop: 8,
                                  }}
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
                                    🔘 คลิก radio เพื่อเลือกคำตอบถูก
                                  </p>
                                  <button
                                    type="submit"
                                    className="btn-secondary"
                                    disabled={savingQuiz}
                                    style={{ fontSize: 12, padding: '6px 12px' }}
                                  >
                                    {savingQuiz ? 'กำลังบันทึก...' : 'เพิ่มคำถาม'}
                                  </button>
                                </form>
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
        </>
      )}
    </div>
  );
}

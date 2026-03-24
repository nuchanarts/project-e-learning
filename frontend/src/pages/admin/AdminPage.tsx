import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface Analytics {
  totalUsers: number;
  totalCourses: number;
  certificatesIssued: number;
  completedProgressCount: number;
}

interface CourseForm { title: string; description: string }

export default function AdminPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [courses, setCourses] = useState<Array<{ id: string; title: string; isActive: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CourseForm>({ title: '', description: '' });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    const [analyticsRes, coursesRes] = await Promise.all([
      api.get<Analytics>('/admin/analytics'),
      api.get<Array<{ id: string; title: string; isActive: boolean }>>('/courses'),
    ]);
    setAnalytics(analyticsRes.data);
    setCourses(coursesRes.data);
  };

  useEffect(() => {
    loadData().catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) return;
    setSaving(true);
    try {
      await api.post('/admin/courses', form);
      setForm({ title: '', description: '' });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบคอร์สนี้?')) return;
    await api.delete(`/admin/courses/${id}`);
    await loadData();
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>

      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card><p className="text-sm text-gray-500">ผู้ใช้ทั้งหมด</p><p className="text-3xl font-bold mt-1">{analytics.totalUsers}</p></Card>
          <Card><p className="text-sm text-gray-500">คอร์สทั้งหมด</p><p className="text-3xl font-bold mt-1">{analytics.totalCourses}</p></Card>
          <Card><p className="text-sm text-gray-500">ใบประกาศที่ออก</p><p className="text-3xl font-bold mt-1">{analytics.certificatesIssued}</p></Card>
          <Card><p className="text-sm text-gray-500">วิดีโอที่เรียนจบ</p><p className="text-3xl font-bold mt-1">{analytics.completedProgressCount}</p></Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-4">เพิ่มคอร์สใหม่</h3>
          <form onSubmit={handleCreateCourse} className="space-y-3">
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="ชื่อคอร์ส"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="คำอธิบายคอร์ส"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
            />
            <Button type="submit" isLoading={saving}>บันทึก</Button>
          </form>
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">จัดการคอร์ส</h3>
          {courses.length === 0 ? (
            <p className="text-gray-500 text-sm">ยังไม่มีคอร์ส</p>
          ) : (
            <ul className="space-y-2">
              {courses.map((c) => (
                <li key={c.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm">{c.title}</span>
                  <Button variant="danger" className="text-xs py-1 px-2" onClick={() => handleDelete(c.id)}>ลบ</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

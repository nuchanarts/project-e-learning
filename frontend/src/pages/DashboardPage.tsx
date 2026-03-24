import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface DashboardData {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  courses: Array<{
    id: string;
    title: string;
    progressPercent: number;
    isCompleted: boolean;
    totalVideos: number;
    completedVideos: number;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardData>('/dashboard')
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <p className="text-sm text-gray-500">คอร์สทั้งหมด</p>
          <p className="text-3xl font-bold mt-1">{data?.totalCourses ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">เรียนจบแล้ว</p>
          <p className="text-3xl font-bold mt-1 text-green-600">{data?.completedCourses ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">กำลังเรียน</p>
          <p className="text-3xl font-bold mt-1 text-blue-600">{data?.inProgressCourses ?? 0}</p>
        </Card>
      </div>

      {data && data.courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.courses.map((course) => (
            <Link key={course.id} to={`/courses/${course.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-800">{course.title}</h3>
                  {course.isCompleted && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">จบแล้ว</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <span>{course.completedVideos}/{course.totalVideos} วิดีโอ</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${course.progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">{course.progressPercent}%</p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-gray-500 text-center py-8">
            ยังไม่มีคอร์ส —{' '}
            <Link to="/courses" className="text-primary-600 hover:underline">ดูคอร์สทั้งหมด</Link>
          </p>
        </Card>
      )}
    </div>
  );
}

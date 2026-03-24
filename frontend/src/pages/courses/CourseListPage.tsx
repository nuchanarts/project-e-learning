import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { courseService, type Course } from '../../services/courseService';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export default function CourseListPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    courseService.list()
      .then(setCourses)
      .catch(() => setError('ไม่สามารถโหลดคอร์สได้'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  if (error) return <p className="text-center text-red-500 py-16">{error}</p>;
  if (courses.length === 0) return <p className="text-center text-gray-500 py-16">ยังไม่มีคอร์สในระบบ</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <Link key={course.id} to={`/courses/${course.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{course.title}</h3>
            <p className="text-gray-500 text-sm line-clamp-3">{course.description}</p>
            <p className="mt-4 text-xs text-primary-600 font-medium">{course.videos?.length ?? 0} วิดีโอ</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}

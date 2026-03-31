import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { courseService, type Course } from '../../services/courseService';
import { certificateService } from '../../services/certificateService';

const THUMBS = [
  { bg: 'linear-gradient(135deg,#7B68EE,#9B8FFF)', icon: '💊' },
  { bg: 'linear-gradient(135deg,#EC4899,#F9A8D4)', icon: '🩺' },
  { bg: 'linear-gradient(135deg,#10B981,#34D399)', icon: '🏥' },
  { bg: 'linear-gradient(135deg,#F59E0B,#FCD34D)', icon: '🧬' },
  { bg: 'linear-gradient(135deg,#3B82F6,#93C5FD)', icon: '💉' },
  { bg: 'linear-gradient(135deg,#8B5CF6,#C4B5FD)', icon: '🩻' },
  { bg: 'linear-gradient(135deg,#EF4444,#FCA5A5)', icon: '🏃' },
  { bg: 'linear-gradient(135deg,#14B8A6,#5EEAD4)', icon: '🍎' },
];

export default function CourseListPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [completedCourseIds, setCompletedCourseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ทั้งหมด');

  useEffect(() => {
    Promise.all([courseService.list(), certificateService.list()])
      .then(([c, certs]) => {
        setCourses(c);
        setCompletedCourseIds(new Set(certs.map((cert) => cert.courseId)));
      })
      .catch(() => setError('ไม่สามารถโหลดคอร์สได้'))
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    'ทั้งหมด',
    ...Array.from(new Set(courses.map((c) => c.category ?? 'ทั่วไป'))),
  ];

  const filtered = courses.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'ทั้งหมด' || (c.category ?? 'ทั่วไป') === activeCategory;
    return matchSearch && matchCat;
  });

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
      {/* ─── Page Header ─── */}
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
            🎓 คอร์สเรียนทั้งหมด
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            เลือกเรียนคอร์สที่คุณสนใจ — มีทั้งหมด {courses.length} คอร์ส
          </p>
        </div>

        {/* Search */}
        <div className="search-input-wrapper" style={{ flex: '1 1 260px', maxWidth: 360 }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="ค้นหาคอร์ส..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ─── Category filter tabs ─── */}
      {categories.length > 2 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {categories.map((cat) => (
            <button
              key={cat}
              data-testid="category-tab"
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                border: `1px solid ${activeCategory === cat ? 'var(--primary)' : 'var(--border)'}`,
                background: activeCategory === cat ? 'var(--primary)' : 'var(--bg)',
                color: activeCategory === cat ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ─── Result count ─── */}
      {search && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          พบ <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong>{' '}
          คอร์สจากการค้นหา "{search}"
        </p>
      )}

      {/* ─── Content ─── */}
      {error ? (
        <div className="card" style={{ padding: 40 }}>
          <div className="empty-state">
            <div className="empty-state-icon">❌</div>
            <div className="empty-state-title" style={{ color: '#DC2626' }}>
              {error}
            </div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 40 }}>
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">
              {search ? 'ไม่พบคอร์สที่ค้นหา' : 'ยังไม่มีคอร์สในระบบ'}
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="btn-secondary"
                style={{ marginTop: 16 }}
              >
                ล้างการค้นหา
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {filtered.map((course, i) => {
            const thumb = THUMBS[i % THUMBS.length];
            return (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="course-card"
                data-testid="course-card"
                data-completed={completedCourseIds.has(course.id) ? 'true' : 'false'}
              >
                <div className="course-thumb" style={{ background: thumb.bg }}>
                  <span className="course-thumb-icon">{thumb.icon}</span>
                </div>
                <div className="course-body">
                  <div className="course-badge">
                    <span className="badge badge-purple">{course.category ?? 'ทั่วไป'}</span>
                  </div>
                  <div className="course-title">{course.title}</div>
                  <div className="course-desc">{course.description}</div>
                  <div className="course-meta">
                    <span className="course-videos">🎬 {course.videos?.length ?? 0} วิดีโอ</span>
                    <span className="course-arrow">เริ่มเรียน →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

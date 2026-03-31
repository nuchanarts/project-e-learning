import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

interface DashboardData {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalLearningSeconds: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | null;
  courses: Array<{
    id: string;
    title: string;
    progressPercent: number;
    isCompleted: boolean;
    totalVideos: number;
    completedVideos: number;
  }>;
}

const TIER_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  BRONZE: { label: 'Bronze', icon: '🥉', color: '#CD7F32' },
  SILVER: { label: 'Silver', icon: '🥈', color: '#A8A9AD' },
  GOLD: { label: 'Gold', icon: '🥇', color: '#FFD700' },
  PLATINUM: { label: 'Platinum', icon: '💎', color: '#E5E4E2' },
};

const THUMBS = [
  'linear-gradient(135deg,#7B68EE,#9B8FFF)',
  'linear-gradient(135deg,#EC4899,#F9A8D4)',
  'linear-gradient(135deg,#10B981,#34D399)',
  'linear-gradient(135deg,#F59E0B,#FCD34D)',
  'linear-gradient(135deg,#3B82F6,#93C5FD)',
  'linear-gradient(135deg,#8B5CF6,#C4B5FD)',
];

const ICONS = ['💊', '🩺', '🏥', '🧬', '💉', '🩻', '🏃', '🍎'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardData>('/dashboard')
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}
      >
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  const totalHours = data ? Math.floor((data.totalLearningSeconds ?? 0) / 3600) : 0;
  const totalMins = data ? Math.floor(((data.totalLearningSeconds ?? 0) % 3600) / 60) : 0;
  const tier = data?.tier ? TIER_CONFIG[data.tier] : null;

  const stats = [
    {
      label: 'คอร์สทั้งหมด',
      value: data?.totalCourses ?? 0,
      icon: '📚',
      color: '#7B68EE',
      bar: 'linear-gradient(90deg,#7B68EE,#9B8FFF)',
    },
    {
      label: 'เรียนจบแล้ว',
      value: data?.completedCourses ?? 0,
      icon: '✅',
      color: '#10B981',
      bar: 'linear-gradient(90deg,#10B981,#34D399)',
    },
    {
      label: 'กำลังเรียน',
      value: data?.inProgressCourses ?? 0,
      icon: '▶️',
      color: '#F59E0B',
      bar: 'linear-gradient(90deg,#F59E0B,#FCD34D)',
    },
  ];

  return (
    <div className="anim-up">
      {/* ─── Hero Banner ─── */}
      <div className="hero-banner">
        <div className="hero-content">
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 20,
            }}
          >
            <div>
              <p className="hero-greeting">ยินดีต้อนรับกลับ 👋</p>
              <h2 className="hero-name">{user?.name}</h2>
              <p className="hero-sub">
                {user?.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่ รพ.สต.'} —
                มาเรียนรู้ต่อกันเลย!
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                {(data?.totalLearningSeconds ?? 0) > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: 20,
                      padding: '4px 12px',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>⏱️</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                      {totalHours > 0 ? `${totalHours} ชม. ` : ''}
                      {totalMins} นาที
                    </span>
                  </div>
                )}
                {tier && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: 20,
                      padding: '4px 12px',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{tier.icon}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>
                      {tier.label}
                    </span>
                  </div>
                )}
              </div>
              <Link to="/courses" className="hero-btn">
                🎓 ดูคอร์สทั้งหมด
              </Link>
            </div>
            {/* Progress ring display */}
            {data && data.totalCourses > 0 && (
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 8px' }}>
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      fill="none"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      fill="none"
                      stroke="rgba(255,255,255,0.85)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${2 * Math.PI * 32 * (1 - data.completedCourses / data.totalCourses)}`}
                      style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: '40px 40px',
                        transition: 'stroke-dashoffset 1s ease',
                      }}
                    />
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                      {Math.round((data.completedCourses / data.totalCourses) * 100)}%
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  ความคืบหน้า
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Stat Cards ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-card-bar" style={{ background: s.bar }} />
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div
              className="stat-value"
              style={{
                background: s.bar,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {s.value}
            </div>
            <div className="stat-sub">คอร์ส</div>
          </div>
        ))}
      </div>

      {/* ─── My Courses ─── */}
      <div className="section-header">
        <h3 className="section-title">📖 คอร์สที่กำลังเรียน</h3>
        <Link to="/courses" className="section-link">
          ดูทั้งหมด →
        </Link>
      </div>

      {!data || data.courses.length === 0 ? (
        <div className="card" style={{ padding: '40px 24px' }}>
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <div className="empty-state-title">ยังไม่มีคอร์สในระบบ</div>
            <div className="empty-state-sub">เริ่มเรียนคอร์สแรกของคุณ</div>
            <Link
              to="/courses"
              className="btn-primary"
              style={{ display: 'inline-flex', marginTop: 20 }}
            >
              เริ่มเรียนเลย
            </Link>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {data.courses.map((course, i) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className="course-card"
              data-testid="course-progress"
            >
              <div className="course-thumb" style={{ background: THUMBS[i % THUMBS.length] }}>
                <span className="course-thumb-icon" style={{ fontSize: 44 }}>
                  {ICONS[i % ICONS.length]}
                </span>
              </div>
              <div className="course-body">
                <div className="course-title">{course.title}</div>
                <div className="course-meta">
                  <span className="course-videos">
                    ✅ {course.completedVideos}/{course.totalVideos} บท
                  </span>
                  {course.isCompleted ? (
                    <span className="badge badge-green" data-testid="completed-badge">
                      จบแล้ว
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>
                      {course.progressPercent}%
                    </span>
                  )}
                </div>
                <div className="course-progress-bar" style={{ marginTop: 10 }}>
                  <div
                    className="course-progress-fill"
                    style={{
                      width: `${course.progressPercent}%`,
                      background: course.isCompleted
                        ? 'linear-gradient(90deg,#10B981,#34D399)'
                        : 'linear-gradient(90deg,#7B68EE,#9B8FFF)',
                    }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

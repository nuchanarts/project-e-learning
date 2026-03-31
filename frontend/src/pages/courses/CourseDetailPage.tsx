import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { courseService, type Course, type Video } from '../../services/courseService';
import { progressService, type ProgressRecord } from '../../services/progressService';
import { certificateService } from '../../services/certificateService';
import { quizService } from '../../services/quizService';
import { paymentService } from '../../services/paymentService';
import { VideoPlayer } from '../../components/ui/VideoPlayer';
import { QuizModal } from '../../components/ui/QuizModal';
import { PaymentModal } from '../../components/ui/PaymentModal';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const resumeVideoId = searchParams.get('resume');
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      courseService.getById(id),
      progressService.getForCourse(id),
      quizService.getResult(id),
      paymentService.checkAccess(id).catch(() => true), // default grant on error
    ])
      .then(([c, p, qr, access]) => {
        setCourse(c);
        setProgress(p);
        setHasAccess(access);
        const resumeVideo = resumeVideoId ? c.videos.find((v) => v.id === resumeVideoId) : null;
        setSelectedVideo(resumeVideo ?? c.videos[0] ?? null);
        if (c.videos.length > 0 && p.filter((x) => x.completed).length === c.videos.length)
          setCourseCompleted(true);
        if (qr?.passed) setQuizPassed(true);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleProgress = (_percent: number, videoCompleted: boolean) => {
    if (!selectedVideo || !course) return;
    setProgress((prev) => {
      const updated = prev.filter((p) => p.videoId !== selectedVideo.id);
      updated.push({
        videoId: selectedVideo.id,
        courseId: course.id,
        percent: _percent,
        completed: videoCompleted,
      });
      if (videoCompleted && updated.filter((p) => p.completed).length === course.videos.length)
        setCourseCompleted(true);
      return updated;
    });
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

  if (!course) {
    return (
      <div className="card" style={{ padding: 40 }}>
        <div className="empty-state">
          <div className="empty-state-icon">❌</div>
          <div className="empty-state-title" style={{ color: '#DC2626' }}>
            ไม่พบคอร์ส
          </div>
        </div>
      </div>
    );
  }

  const getVP = (vid: string) => progress.find((p) => p.videoId === vid);
  const completedCount = progress.filter((p) => p.completed).length;
  const totalVideos = course.videos.length;

  // Sections derived from videos
  const sections = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const v of course.videos) {
      if (v.section && !seen.has(v.section)) {
        seen.add(v.section);
        result.push(v.section);
      }
    }
    return result;
  }, [course.videos]);

  const filteredVideos = useMemo(
    () =>
      activeSection ? course.videos.filter((v) => v.section === activeSection) : course.videos,
    [course.videos, activeSection],
  );
  const overallPercent = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;

  return (
    <>
      <div className="anim-up">
        {/* ─── Breadcrumb ─── */}
        <div className="breadcrumb">
          <Link to="/courses" className="breadcrumb-link">
            คอร์สเรียน
          </Link>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">{course.title}</span>
        </div>

        {/* ─── Course header ─── */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-purple">{course.category ?? 'ทั่วไป'}</span>
                {course.price ? (
                  <span className="badge" style={{ background: '#FEF3C7', color: '#D97706' }}>
                    💳 ฿{course.price.toLocaleString()}
                  </span>
                ) : (
                  <span className="badge badge-green">ฟรี</span>
                )}
              </div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginBottom: 8,
                }}
              >
                {course.title}
              </h1>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  fontSize: 13,
                  color: 'var(--text-muted)',
                }}
              >
                <span>🎬 {totalVideos} วิดีโอ</span>
                <span>✅ เรียนจบ {completedCount} บท</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  background: 'linear-gradient(135deg,#7B68EE,#9B8FFF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1,
                }}
              >
                {overallPercent}%
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                ความคืบหน้า
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <div className="progress-track">
              <div
                className={`progress-fill ${courseCompleted ? 'progress-fill-green' : ''}`}
                style={{ width: `${overallPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* ─── Paywall ─── */}
        {hasAccess === false && course.price && (
          <div
            className="card"
            style={{ padding: '32px 24px', textAlign: 'center', marginBottom: 20 }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: 8,
              }}
            >
              คอร์สนี้มีค่าใช้จ่าย
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
              ชำระค่าคอร์สเพื่อเข้าถึงเนื้อหาทั้งหมด
            </div>
            <button
              onClick={() => setShowPayment(true)}
              className="btn-primary"
              style={{ fontSize: 16, padding: '12px 32px' }}
            >
              💳 ซื้อคอร์ส ฿{course.price.toLocaleString()}
            </button>
          </div>
        )}

        {/* ─── Two-column layout ─── */}
        <div
          className="detail-grid"
          style={{
            opacity: hasAccess === false ? 0.4 : 1,
            pointerEvents: hasAccess === false ? 'none' : undefined,
          }}
        >
          {/* Video + info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {selectedVideo && (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div
                  data-testid="video-player"
                  style={{ background: '#000', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}
                >
                  <VideoPlayer
                    videoId={selectedVideo.id}
                    courseId={course.id}
                    url={selectedVideo.url}
                    duration={selectedVideo.duration ?? undefined}
                    resumeSeconds={
                      selectedVideo.id === resumeVideoId
                        ? (getVP(selectedVideo.id)?.watchedSeconds ?? undefined)
                        : undefined
                    }
                    onProgress={handleProgress}
                  />
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <h2
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: 4,
                    }}
                  >
                    {selectedVideo.title}
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    ⏱️ {Math.floor(selectedVideo.duration / 60)} นาที {selectedVideo.duration % 60}{' '}
                    วินาที
                  </p>
                  {/* Progress bar for current video */}
                  {(() => {
                    const vp = getVP(selectedVideo.id);
                    const percent = vp?.percent ?? 0;
                    return (
                      <div style={{ marginTop: 10 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            marginBottom: 4,
                          }}
                        >
                          <span>ความคืบหน้าวิดีโอนี้</span>
                          <span>{Math.round(percent)}%</span>
                        </div>
                        <div className="progress-track" data-testid="progress-bar">
                          <div
                            className={`progress-fill ${vp?.completed ? 'progress-fill-green' : ''}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Certificate banner */}
            {courseCompleted && !quizPassed && (
              <div
                style={{
                  padding: '20px 24px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg,#FFF7ED,#FED7AA)',
                  border: '1px solid #FDBA74',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 36 }}>📝</span>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#C2410C', marginBottom: 2 }}>
                      ยินดีด้วย! เรียนจบแล้ว — ทำแบบทดสอบเพื่อรับใบประกาศ
                    </p>
                    <p style={{ fontSize: 13, color: '#EA580C' }}>ต้องผ่านเกณฑ์ 60% ขึ้นไป</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowQuiz(true)}
                  className="btn-primary"
                  data-testid="quiz-button"
                >
                  ✏️ ทำแบบทดสอบ
                </button>
              </div>
            )}

            {courseCompleted && quizPassed && (
              <div
                style={{
                  padding: '20px 24px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)',
                  border: '1px solid #BBF7D0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 36 }}>🏆</span>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#15803D', marginBottom: 2 }}>
                      ยินดีด้วย! คุณผ่านแบบทดสอบแล้ว
                    </p>
                    <p style={{ fontSize: 13, color: '#16A34A' }}>ดาวน์โหลดใบประกาศนียบัตรได้เลย</p>
                  </div>
                </div>
                <a
                  href={certificateService.downloadUrl(course.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  data-testid="certificate-button"
                  style={{ color: '#16A34A', borderColor: '#86EFAC', background: '#F0FDF4' }}
                >
                  ⬇️ ดาวน์โหลดใบประกาศ
                </a>
              </div>
            )}

            {/* Documents section */}
            {course.documents && course.documents.length > 0 && (
              <div className="card" style={{ padding: '16px 20px' }}>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 12,
                  }}
                >
                  📄 เอกสารประกอบการเรียน
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {course.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 18 }}>📎</span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{doc.title}</span>
                      <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                        ดาวน์โหลด ↗
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Playlist sidebar */}
          <div className="card" style={{ padding: 16 }} data-testid="video-list">
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 10,
                padding: '0 4px',
              }}
            >
              📋 รายการวิดีโอ ({totalVideos})
            </h3>

            {/* Section filter buttons */}
            {sections.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                <button
                  onClick={() => setActiveSection(null)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 12,
                    border: `1px solid ${activeSection === null ? 'var(--primary)' : 'var(--border)'}`,
                    background: activeSection === null ? 'var(--primary)' : 'transparent',
                    color: activeSection === null ? '#fff' : 'var(--text-muted)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  ทั้งหมด
                </button>
                {sections.map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setActiveSection(sec)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 12,
                      border: `1px solid ${activeSection === sec ? 'var(--primary)' : 'var(--border)'}`,
                      background: activeSection === sec ? 'var(--primary)' : 'transparent',
                      color: activeSection === sec ? '#fff' : 'var(--text-muted)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                maxHeight: 520,
                overflowY: 'auto',
              }}
            >
              {filteredVideos.map((video, idx) => {
                const vp = getVP(video.id);
                const isActive = selectedVideo?.id === video.id;
                // Show section header when it changes
                const prevSection = idx > 0 ? filteredVideos[idx - 1].section : undefined;
                const showSectionHeader = video.section && video.section !== prevSection;
                return (
                  <div key={video.id}>
                    {showSectionHeader && (
                      <div
                        style={{
                          padding: '8px 4px 4px',
                          fontSize: 10,
                          fontWeight: 700,
                          color: 'var(--primary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {video.section}
                      </div>
                    )}
                    <button
                      onClick={() => setSelectedVideo(video)}
                      className={`playlist-item ${isActive ? 'active' : ''}`}
                      data-testid="video-item"
                    >
                      <div
                        className="playlist-num"
                        style={
                          vp?.completed
                            ? { background: '#DCFCE7', color: '#16A34A' }
                            : isActive
                              ? { background: 'var(--primary-light)', color: 'var(--primary)' }
                              : {
                                  background: 'var(--bg)',
                                  color: 'var(--text-muted)',
                                  border: '1px solid var(--border)',
                                }
                        }
                      >
                        {vp?.completed ? '✓' : idx + 1}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: isActive ? 700 : 500,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {video.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {Math.floor(video.duration / 60)} นาที
                        </div>
                      </div>
                      {vp?.completed && (
                        <span
                          style={{ fontSize: 11, color: '#16A34A', fontWeight: 700, flexShrink: 0 }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showQuiz && id && (
        <QuizModal
          courseId={id}
          onClose={() => setShowQuiz(false)}
          onPassed={() => {
            setQuizPassed(true);
            setShowQuiz(false);
          }}
        />
      )}

      {showPayment && course && course.price && (
        <PaymentModal
          courseId={course.id}
          courseTitle={course.title}
          price={course.price}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false);
            setHasAccess(true);
          }}
        />
      )}
    </>
  );
}

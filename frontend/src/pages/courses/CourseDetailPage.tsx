import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { courseService, type Course, type Video } from '../../services/courseService';
import { progressService, type ProgressRecord } from '../../services/progressService';
import { certificateService } from '../../services/certificateService';
import { VideoPlayer } from '../../components/ui/VideoPlayer';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [courseCompleted, setCourseCompleted] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([courseService.getById(id), progressService.getForCourse(id)])
      .then(([c, p]) => {
        setCourse(c);
        setProgress(p);
        setSelectedVideo(c.videos[0] ?? null);
        if (c.videos.length > 0 && p.filter((x) => x.completed).length === c.videos.length) {
          setCourseCompleted(true);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleProgress = (_percent: number, videoCompleted: boolean) => {
    if (!selectedVideo || !course) return;
    setProgress((prev) => {
      const updated = prev.filter((p) => p.videoId !== selectedVideo.id);
      updated.push({ videoId: selectedVideo.id, courseId: course.id, percent: _percent, completed: videoCompleted });
      if (videoCompleted && updated.filter((p) => p.completed).length === course.videos.length) {
        setCourseCompleted(true);
      }
      return updated;
    });
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  if (!course) return <p className="text-center text-red-500 py-16">ไม่พบคอร์ส</p>;

  const getVideoProgress = (videoId: string) => progress.find((p) => p.videoId === videoId);

  return (
    <div className="max-w-5xl mx-auto">
      <Link to="/courses" className="text-primary-600 hover:underline text-sm mb-4 inline-block">← กลับไปรายการคอร์ส</Link>
      <h1 className="text-2xl font-bold mb-6">{course.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {selectedVideo && (
            <Card className="p-0 overflow-hidden">
              <VideoPlayer
                videoId={selectedVideo.id}
                courseId={course.id}
                url={selectedVideo.url}
                onProgress={handleProgress}
              />
              <div className="p-4">
                <h2 className="text-lg font-semibold">{selectedVideo.title}</h2>
              </div>
            </Card>
          )}

          {courseCompleted && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
              <p className="text-green-700 font-medium">คุณเรียนจบคอร์สนี้แล้ว!</p>
              <a
                href={certificateService.downloadUrl(course.id)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button>ดาวน์โหลดใบประกาศ</Button>
              </a>
            </div>
          )}
        </div>

        <div>
          <Card>
            <h3 className="font-semibold mb-3 text-gray-700">รายการวิดีโอ</h3>
            <ul className="space-y-2">
              {course.videos.map((video, idx) => {
                const vp = getVideoProgress(video.id);
                const isSelected = selectedVideo?.id === video.id;
                return (
                  <li key={video.id}>
                    <button
                      onClick={() => setSelectedVideo(video)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        isSelected ? 'bg-primary-100 text-primary-700 font-medium' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {vp?.completed ? (
                          <span className="text-green-500">✓</span>
                        ) : (
                          <span className="text-gray-400">{idx + 1}.</span>
                        )}
                        <span className="flex-1 truncate">{video.title}</span>
                      </span>
                      {vp && !vp.completed && (
                        <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-400 rounded-full" style={{ width: `${vp.percent}%` }} />
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useRef, useEffect, useCallback, useState } from 'react';
import { progressService } from '../../services/progressService';

interface VideoPlayerProps {
  videoId: string;
  courseId: string;
  url: string;
  duration?: number; // seconds — used for YouTube progress estimation
  resumeSeconds?: number;
  onProgress?: (percent: number, completed: boolean) => void;
}

/** Extract YouTube video ID from various YouTube URL formats */
function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0];
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      // /embed/ID
      const m = u.pathname.match(/\/embed\/([^/?]+)/);
      if (m) return m[1];
    }
  } catch {
    // not a valid URL — ignore
  }
  return null;
}

function buildYouTubeEmbed(videoId: string, startSeconds?: number): string {
  const base = `https://www.youtube.com/embed/${videoId}`;
  const params = new URLSearchParams({ rel: '0', modestbranding: '1', enablejsapi: '0' });
  if (startSeconds && startSeconds > 0) params.set('start', String(Math.floor(startSeconds)));
  return `${base}?${params.toString()}`;
}

// ── YouTube Player ─────────────────────────────────────────────────────────

function YouTubePlayer({
  ytId,
  videoId,
  courseId,
  duration,
  resumeSeconds,
  onProgress,
}: {
  ytId: string;
  videoId: string;
  courseId: string;
  duration?: number;
  resumeSeconds?: number;
  onProgress?: (percent: number, completed: boolean) => void;
}) {
  const watchedRef = useRef(0); // seconds watched this session
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedRef = useRef(0); // last saved percent to avoid duplicate saves
  const [playing, setPlaying] = useState(false);

  const saveProgress = useCallback(
    async (watchedSecs: number) => {
      if (!duration || duration <= 0) return;
      const total = resumeSeconds ? resumeSeconds + watchedSecs : watchedSecs;
      const percent = Math.min(100, (total / duration) * 100);
      if (Math.abs(percent - savedRef.current) < 2) return; // debounce tiny changes
      savedRef.current = percent;
      try {
        const result = await progressService.save({
          videoId,
          courseId,
          percent,
          watchedSeconds: Math.floor(total),
        });
        onProgress?.(percent, result.videoCompleted);
      } catch {
        // silent
      }
    },
    [videoId, courseId, duration, resumeSeconds, onProgress],
  );

  // Tick every 5 s while playing
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        watchedRef.current += 5;
        saveProgress(watchedRef.current);
      }, 5000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, saveProgress]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (watchedRef.current > 0) saveProgress(watchedRef.current);
    };
  }, [saveProgress]);

  const embedUrl = buildYouTubeEmbed(ytId, resumeSeconds);

  return (
    <div style={{ position: 'relative' }}>
      {/* YouTube iframe */}
      <div
        style={{
          position: 'relative',
          paddingTop: '56.25%', // 16:9
          background: '#000',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <iframe
          src={embedUrl}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
        />
      </div>

      {/* Play/Pause progress tracking overlay (below iframe) */}
      {duration && duration > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            background: 'var(--bg)',
            borderRadius: '0 0 8px 8px',
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          <span>⏱ ติดตามเวลาเรียน:</span>
          <button
            onClick={() => setPlaying((p) => !p)}
            style={{
              padding: '4px 14px',
              borderRadius: 20,
              border: 'none',
              background: playing ? '#EF4444' : 'var(--primary)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {playing ? '⏸ หยุดนับเวลา' : '▶ เริ่มนับเวลา'}
          </button>
          <span style={{ marginLeft: 'auto' }}>
            {Math.floor(watchedRef.current / 60)} นาที {watchedRef.current % 60} วินาที
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main VideoPlayer ───────────────────────────────────────────────────────

export function VideoPlayer({
  videoId,
  courseId,
  url,
  duration,
  resumeSeconds,
  onProgress,
}: VideoPlayerProps) {
  const ytId = getYouTubeId(url);

  if (ytId) {
    return (
      <YouTubePlayer
        ytId={ytId}
        videoId={videoId}
        courseId={courseId}
        duration={duration}
        resumeSeconds={resumeSeconds}
        onProgress={onProgress}
      />
    );
  }

  // ── Native video player ────────────────────────────────────────────────
  return (
    <NativeVideoPlayer
      videoId={videoId}
      courseId={courseId}
      url={url}
      resumeSeconds={resumeSeconds}
      onProgress={onProgress}
    />
  );
}

function NativeVideoPlayer({
  videoId,
  courseId,
  url,
  resumeSeconds,
  onProgress,
}: Omit<VideoPlayerProps, 'duration'>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumedRef = useRef(false);

  const saveProgress = useCallback(
    async (percent: number, watchedSeconds?: number) => {
      try {
        const result = await progressService.save({ videoId, courseId, percent, watchedSeconds });
        onProgress?.(percent, result.videoCompleted);
      } catch {
        // silent
      }
    },
    [videoId, courseId, onProgress],
  );

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.duration === 0) return;
    const percent = (video.currentTime / video.duration) * 100;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => saveProgress(percent, Math.floor(video.currentTime)),
      5000,
    );
  }, [saveProgress]);

  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) return;
    heartbeatRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused || video.duration === 0) return;
      const percent = (video.currentTime / video.duration) * 100;
      saveProgress(percent, Math.floor(video.currentTime));
    }, 5000);
  }, [saveProgress]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const handlePauseOrEnd = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.duration === 0) return;
    stopHeartbeat();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const percent = (video.currentTime / video.duration) * 100;
    saveProgress(percent, Math.floor(video.currentTime));
  }, [saveProgress, stopHeartbeat]);

  const handleLoadedMetadata = useCallback(() => {
    if (resumeSeconds && resumeSeconds > 0 && !resumedRef.current && videoRef.current) {
      resumedRef.current = true;
      videoRef.current.currentTime = resumeSeconds;
    }
  }, [resumeSeconds]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      stopHeartbeat();
    };
  }, [stopHeartbeat]);

  return (
    <video
      ref={videoRef}
      src={url}
      controls
      className="w-full rounded-lg bg-black"
      onLoadedMetadata={handleLoadedMetadata}
      onTimeUpdate={handleTimeUpdate}
      onPlay={startHeartbeat}
      onPause={handlePauseOrEnd}
      onEnded={handlePauseOrEnd}
    />
  );
}

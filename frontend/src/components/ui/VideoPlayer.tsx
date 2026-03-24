import { useRef, useEffect, useCallback } from 'react';
import { progressService } from '../../services/progressService';

interface VideoPlayerProps {
  videoId: string;
  courseId: string;
  url: string;
  onProgress?: (percent: number, completed: boolean) => void;
}

export function VideoPlayer({ videoId, courseId, url, onProgress }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveProgress = useCallback(async (percent: number) => {
    try {
      const result = await progressService.save({ videoId, courseId, percent });
      onProgress?.(percent, result.videoCompleted);
    } catch {
      // silent fail — progress will be saved next time
    }
  }, [videoId, courseId, onProgress]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.duration === 0) return;
    const percent = (video.currentTime / video.duration) * 100;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveProgress(percent), 5000);
  }, [saveProgress]);

  const handlePauseOrEnd = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.duration === 0) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const percent = (video.currentTime / video.duration) * 100;
    saveProgress(percent);
  }, [saveProgress]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={url}
      controls
      className="w-full rounded-lg bg-black"
      onTimeUpdate={handleTimeUpdate}
      onPause={handlePauseOrEnd}
      onEnded={handlePauseOrEnd}
    />
  );
}

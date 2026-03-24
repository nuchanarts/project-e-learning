import { progressRepository } from './progress.repository';
import { courseRepository } from '../course/course.repository';

const COMPLETION_THRESHOLD = 80;

export const progressService = {
  async saveProgress(userId: string, videoId: string, courseId: string, percent: number) {
    const completed = percent >= COMPLETION_THRESHOLD;

    const progress = await progressRepository.upsert({
      userId,
      videoId,
      courseId,
      percent,
      completed,
    });

    let courseCompleted = false;
    if (completed) {
      const course = await courseRepository.findById(courseId);
      if (course) {
        const completedCount = await progressRepository.countCompletedVideos(userId, courseId);
        courseCompleted = completedCount >= course.videos.length;
      }
    }

    return { videoCompleted: progress.completed, courseCompleted };
  },

  async getUserProgress(userId: string, courseId: string) {
    return progressRepository.findByUserAndCourse(userId, courseId);
  },
};

import { dashboardRepository } from './dashboard.repository';
import { certificateService } from '../certificate/certificate.service';
import prisma from '../../lib/prisma';

export const dashboardService = {
  async getForUser(userId: string) {
    const rawCourses = await dashboardRepository.getUserCoursesSummary(userId);

    const courses = rawCourses.map((course) => {
      const total = course.videos.length;
      const completed = course.progress.filter((p) => p.completed).length;
      const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
      const isCompleted = total > 0 && completed === total;
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        totalVideos: total,
        completedVideos: completed,
        progressPercent,
        isCompleted,
      };
    });

    const totalCourses = courses.length;
    const completedCourses = courses.filter((c) => c.isCompleted).length;
    const inProgressCourses = courses.filter((c) => !c.isCompleted && c.completedVideos > 0).length;

    // Total learning time
    const totalSecondsResult = await prisma.progress.aggregate({
      where: { userId },
      _sum: { watchedSeconds: true },
    });
    const totalLearningSeconds = totalSecondsResult._sum.watchedSeconds ?? 0;

    // Tier
    const tier = await certificateService.getUserTier(userId);

    return {
      totalCourses,
      completedCourses,
      inProgressCourses,
      courses,
      totalLearningSeconds,
      tier,
    };
  },
};

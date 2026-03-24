import { dashboardRepository } from './dashboard.repository';

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

    return { totalCourses, completedCourses, inProgressCourses, courses };
  },
};

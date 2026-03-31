import prisma from '../../lib/prisma';

export const progressRepository = {
  async upsert(data: {
    userId: string;
    videoId: string;
    courseId: string;
    percent: number;
    completed: boolean;
    watchedSeconds?: number;
  }) {
    const existing = await prisma.progress.findUnique({
      where: { userId_videoId: { userId: data.userId, videoId: data.videoId } },
    });
    const newWatchedSeconds = Math.max(existing?.watchedSeconds ?? 0, data.watchedSeconds ?? 0);
    return prisma.progress.upsert({
      where: { userId_videoId: { userId: data.userId, videoId: data.videoId } },
      update: {
        percent: data.percent,
        completed: data.completed,
        watchedSeconds: newWatchedSeconds,
      },
      create: {
        userId: data.userId,
        videoId: data.videoId,
        courseId: data.courseId,
        percent: data.percent,
        completed: data.completed,
        watchedSeconds: newWatchedSeconds,
      },
    });
  },

  async findByUserAndCourse(userId: string, courseId: string) {
    return prisma.progress.findMany({ where: { userId, courseId } });
  },

  async countCompletedVideos(userId: string, courseId: string) {
    return prisma.progress.count({ where: { userId, courseId, completed: true } });
  },

  async getTotalWatchedSeconds(userId: string, courseId: string) {
    const result = await prisma.progress.aggregate({
      where: { userId, courseId },
      _sum: { watchedSeconds: true },
    });
    return result._sum.watchedSeconds ?? 0;
  },

  async findByUser(userId: string) {
    return prisma.progress.findMany({ where: { userId }, include: { video: true } });
  },

  async getTotalWatchedSecondsAllCourses(userId: string) {
    const result = await prisma.progress.aggregate({
      where: { userId },
      _sum: { watchedSeconds: true },
    });
    return result._sum.watchedSeconds ?? 0;
  },
};

import prisma from '../../lib/prisma';

export const progressRepository = {
  async upsert(data: {
    userId: string;
    videoId: string;
    courseId: string;
    percent: number;
    completed: boolean;
  }) {
    return prisma.progress.upsert({
      where: { userId_videoId: { userId: data.userId, videoId: data.videoId } },
      update: { percent: data.percent, completed: data.completed },
      create: data,
    });
  },

  async findByUserAndCourse(userId: string, courseId: string) {
    return prisma.progress.findMany({
      where: { userId, courseId },
    });
  },

  async countCompletedVideos(userId: string, courseId: string) {
    return prisma.progress.count({
      where: { userId, courseId, completed: true },
    });
  },

  async findByUser(userId: string) {
    return prisma.progress.findMany({
      where: { userId },
      include: { video: true },
    });
  },
};

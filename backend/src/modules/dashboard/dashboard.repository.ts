import prisma from '../../lib/prisma';

export const dashboardRepository = {
  async getUserCoursesSummary(userId: string) {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      include: {
        videos: { select: { id: true }, orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const progressRecords = await prisma.progress.findMany({
      where: { userId },
      select: { videoId: true, courseId: true, completed: true },
    });

    return courses.map((course) => ({
      ...course,
      progress: progressRecords.filter((p) => p.courseId === course.id),
    }));
  },
};

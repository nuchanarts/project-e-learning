import prisma from '../../lib/prisma';

export const adminService = {
  async getAnalytics() {
    const [totalUsers, totalCourses, progressStats] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.course.count({ where: { isActive: true } }),
      prisma.progress.groupBy({
        by: ['courseId'],
        _count: { id: true },
        where: { completed: true },
      }),
    ]);

    const certificatesIssued = await prisma.certificate.count();

    return { totalUsers, totalCourses, certificatesIssued, completedProgressCount: progressStats.length };
  },

  async createCourse(data: { title: string; description: string }) {
    return prisma.course.create({ data });
  },

  async updateCourse(id: string, data: { title?: string; description?: string; isActive?: boolean }) {
    return prisma.course.update({ where: { id }, data });
  },

  async deleteCourse(id: string) {
    return prisma.course.update({ where: { id }, data: { isActive: false } });
  },

  async addVideo(courseId: string, data: { title: string; url: string; duration: number; order: number }) {
    return prisma.video.create({ data: { courseId, ...data } });
  },

  async deleteVideo(id: string) {
    return prisma.video.delete({ where: { id } });
  },
};

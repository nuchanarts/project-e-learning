import prisma from '../../lib/prisma';

export const certificateRepository = {
  async findByUserAndCourse(userId: string, courseId: string) {
    return prisma.certificate.findUnique({ where: { userId_courseId: { userId, courseId } } });
  },

  async findAllByUser(userId: string) {
    return prisma.certificate.findMany({
      where: { userId },
      include: { course: { select: { id: true, title: true } } },
      orderBy: { issuedAt: 'desc' },
    });
  },

  async create(userId: string, courseId: string, filePath: string) {
    return prisma.certificate.create({ data: { userId, courseId, filePath } });
  },
};

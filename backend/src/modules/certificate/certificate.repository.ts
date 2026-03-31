import prisma from '../../lib/prisma';

export const certificateRepository = {
  async findByUserAndCourse(userId: string, courseId: string) {
    return prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: {
        user: { select: { name: true, hospital: true, position: true } },
        course: { select: { id: true, title: true } },
      },
    });
  },

  async findByVerifyToken(verifyToken: string) {
    return prisma.certificate.findUnique({
      where: { verifyToken },
      include: {
        user: { select: { name: true, hospital: true, position: true } },
        course: { select: { id: true, title: true, category: true } },
      },
    });
  },

  async findAllByUser(userId: string) {
    return prisma.certificate.findMany({
      where: { userId },
      include: { course: { select: { id: true, title: true } } },
      orderBy: { issuedAt: 'desc' },
    });
  },

  async create(
    userId: string,
    courseId: string,
    filePath: string,
    tier?: string | null,
    quizScore?: number | null,
  ) {
    return prisma.certificate.create({
      data: {
        userId,
        courseId,
        filePath,
        tier: (tier as any) ?? undefined,
        quizScore: quizScore ?? undefined,
      },
      include: {
        user: { select: { name: true, hospital: true, position: true } },
        course: { select: { id: true, title: true } },
      },
    });
  },
};

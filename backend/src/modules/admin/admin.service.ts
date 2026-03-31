import prisma from '../../lib/prisma';

export const adminService = {
  async getAnalytics() {
    const [totalUsers, totalCourses, progressStats, certificatesIssued] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.course.count({ where: { isActive: true } }),
      prisma.progress.groupBy({
        by: ['courseId'],
        _count: { id: true },
        where: { completed: true },
      }),
      prisma.certificate.count(),
    ]);

    // Top 5 learners by total watched seconds
    const topLearnersRaw = await prisma.progress.groupBy({
      by: ['userId'],
      _sum: { watchedSeconds: true },
      orderBy: { _sum: { watchedSeconds: 'desc' } },
      take: 5,
    });
    const topLearners = await Promise.all(
      topLearnersRaw.map(async (l) => {
        const user = await prisma.user.findUnique({
          where: { id: l.userId },
          select: { name: true, hospital: true },
        });
        const certCount = await prisma.certificate.count({ where: { userId: l.userId } });
        return {
          userId: l.userId,
          name: user?.name ?? '-',
          hospital: user?.hospital ?? '-',
          totalSeconds: l._sum.watchedSeconds ?? 0,
          certCount,
        };
      }),
    );

    // Course completion rates
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      include: { _count: { select: { videos: true } } },
    });
    const courseCompletionRates = await Promise.all(
      courses.map(async (c) => {
        const enrolled = await prisma.progress.groupBy({
          by: ['userId'],
          where: { courseId: c.id },
        });
        const completed = await Promise.all(
          enrolled.map(async (e) => {
            const done = await prisma.progress.count({
              where: { userId: e.userId, courseId: c.id, completed: true },
            });
            return done >= c._count.videos;
          }),
        );
        const rate =
          enrolled.length > 0
            ? Math.round((completed.filter(Boolean).length / enrolled.length) * 100)
            : 0;
        return { courseId: c.id, title: c.title, rate };
      }),
    );

    return {
      totalUsers,
      totalCourses,
      certificatesIssued,
      completedProgressCount: progressStats.length,
      topLearners,
      courseCompletionRates,
    };
  },

  async createCourse(data: {
    title: string;
    description: string;
    category?: string;
    price?: number | null;
  }) {
    return prisma.course.create({ data });
  },

  async updateCourse(
    id: string,
    data: {
      title?: string;
      description?: string;
      category?: string;
      isActive?: boolean;
      price?: number | null;
    },
  ) {
    return prisma.course.update({ where: { id }, data });
  },

  async reorderCourses(items: { id: string; order: number }[]) {
    await prisma.$transaction(
      items.map((item) =>
        prisma.course.update({ where: { id: item.id }, data: { order: item.order } }),
      ),
    );
  },

  async deleteCourse(id: string) {
    return prisma.course.update({ where: { id }, data: { isActive: false } });
  },

  async addVideo(
    courseId: string,
    data: { title: string; url: string; duration: number; order: number; section?: string },
  ) {
    return prisma.video.create({ data: { courseId, ...data } });
  },

  async updateVideo(
    id: string,
    data: { title?: string; url?: string; duration?: number; order?: number; section?: string },
  ) {
    return prisma.video.update({ where: { id }, data });
  },

  async deleteVideo(id: string) {
    return prisma.video.delete({ where: { id } });
  },

  // Quiz management
  async getQuizQuestions(courseId: string) {
    const questions = await prisma.quizQuestion.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });
    return questions.map((q) => ({ ...q, options: JSON.parse(q.options) }));
  },

  async createQuizQuestion(
    courseId: string,
    data: { text: string; options: string[]; correctIndex: number; order?: number },
  ) {
    return prisma.quizQuestion.create({
      data: {
        courseId,
        text: data.text,
        options: JSON.stringify(data.options),
        correctIndex: data.correctIndex,
        order: data.order ?? 0,
      },
    });
  },

  async updateQuizQuestion(
    id: string,
    data: { text?: string; options?: string[]; correctIndex?: number; order?: number },
  ) {
    const updateData: any = { ...data };
    if (data.options) updateData.options = JSON.stringify(data.options);
    return prisma.quizQuestion.update({ where: { id }, data: updateData });
  },

  async deleteQuizQuestion(id: string) {
    return prisma.quizQuestion.delete({ where: { id } });
  },

  // Document management
  async addDocument(courseId: string, data: { title: string; url: string; order?: number }) {
    return prisma.courseDocument.create({
      data: { courseId, title: data.title, url: data.url, order: data.order ?? 0 },
    });
  },

  async deleteDocument(id: string) {
    return prisma.courseDocument.delete({ where: { id } });
  },

  // User management
  async getUsers(search?: string) {
    return prisma.user.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { hospital: { contains: search } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        cid: true,
        hospital: true,
        position: true,
        createdAt: true,
        _count: { select: { certificates: true, progress: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async updateUserRole(userId: string, role: 'USER' | 'ADMIN') {
    return prisma.user.update({ where: { id: userId }, data: { role } });
  },

  async toggleUserActive(userId: string, isActive: boolean) {
    return prisma.user.update({ where: { id: userId }, data: { isActive } });
  },

  async updateUserProfile(
    userId: string,
    data: { name?: string; hospital?: string; position?: string },
  ) {
    return prisma.user.update({ where: { id: userId }, data });
  },
};

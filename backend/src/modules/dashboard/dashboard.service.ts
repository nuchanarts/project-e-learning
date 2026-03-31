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

      // Resume: find first incomplete video with watchedSeconds > 0, else first incomplete
      const inProgressVideo = course.videos
        .map((v) => {
          const prog = course.progress.find((p) => p.videoId === v.id);
          return {
            ...v,
            watchedSeconds: prog?.watchedSeconds ?? 0,
            completed: prog?.completed ?? false,
          };
        })
        .find((v) => !v.completed && v.watchedSeconds > 0);

      const nextVideo = !isCompleted
        ? (inProgressVideo ??
          course.videos.find(
            (v) => !course.progress.find((p) => p.videoId === v.id && p.completed),
          ) ??
          null)
        : null;

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        totalVideos: total,
        completedVideos: completed,
        progressPercent,
        isCompleted,
        resumeVideoId: nextVideo?.id ?? null,
        resumeVideoTitle: nextVideo?.title ?? null,
        resumeSeconds: inProgressVideo?.watchedSeconds ?? 0,
      };
    });

    const totalCourses = courses.length;
    const completedCourses = courses.filter((c) => c.isCompleted).length;
    const inProgressCourses = courses.filter((c) => !c.isCompleted && c.completedVideos > 0).length;

    const totalSecondsResult = await prisma.progress.aggregate({
      where: { userId },
      _sum: { watchedSeconds: true },
    });
    const totalLearningSeconds = totalSecondsResult._sum.watchedSeconds ?? 0;
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

  // Admin analytics
  async getAnalytics() {
    const [totalUsers, totalCerts, courseStats, hospitalStats, notStarted] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.certificate.count(),
      // Completion rate per course
      prisma.course.findMany({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          certificates: { select: { id: true } },
          _count: { select: { quizAttempts: true } },
        },
      }),
      // Top hospitals by learning time
      prisma.progress.groupBy({
        by: ['userId'],
        _sum: { watchedSeconds: true },
        orderBy: { _sum: { watchedSeconds: 'desc' } },
        take: 20,
      }),
      // Users who never started
      prisma.user.count({
        where: { role: 'USER', progress: { none: {} } },
      }),
    ]);

    // Enrich hospital stats
    const topLearnerIds = hospitalStats.map((h) => h.userId);
    const topLearnerUsers = await prisma.user.findMany({
      where: { id: { in: topLearnerIds } },
      select: { id: true, name: true, hospital: true },
    });
    const topLearners = hospitalStats.slice(0, 10).map((h) => {
      const u = topLearnerUsers.find((u) => u.id === h.userId);
      return {
        userId: h.userId,
        name: u?.name ?? '-',
        hospital: u?.hospital ?? '-',
        totalSeconds: h._sum.watchedSeconds ?? 0,
      };
    });

    // Hospital breakdown
    const hospitalBreakdown = await prisma.$queryRaw<
      { hospital: string; count: bigint; totalSeconds: bigint }[]
    >`
      SELECT u.hospital, COUNT(DISTINCT u.id) as count, COALESCE(SUM(p.watchedSeconds), 0) as totalSeconds
      FROM User u
      LEFT JOIN Progress p ON p.userId = u.id
      WHERE u.role = 'USER'
      GROUP BY u.hospital
      ORDER BY totalSeconds DESC
      LIMIT 20
    `;

    const courseCompletionRates = courseStats.map((c) => ({
      id: c.id,
      title: c.title,
      certCount: c.certificates.length,
      quizAttempts: c._count.quizAttempts,
    }));

    return {
      totalUsers,
      totalCerts,
      notStartedCount: notStarted,
      topLearners,
      hospitalBreakdown: hospitalBreakdown.map((h) => ({
        hospital: h.hospital ?? 'ไม่ระบุ',
        userCount: Number(h.count),
        totalSeconds: Number(h.totalSeconds),
      })),
      courseCompletionRates,
    };
  },
};

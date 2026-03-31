import { courseRepository } from './course.repository';
import prisma from '../../lib/prisma';

export const courseService = {
  async list(category?: string) {
    return courseRepository.findAll(category);
  },

  async getById(id: string, userId?: string) {
    const course = await courseRepository.findById(id);
    if (!course) throw Object.assign(new Error('Course not found'), { status: 404 });

    // Check prerequisite if userId provided
    if (userId && (course as any).prerequisiteCourseId) {
      const prereqId = (course as any).prerequisiteCourseId;
      const cert = await prisma.certificate.findUnique({
        where: { userId_courseId: { userId, courseId: prereqId } },
      });
      if (!cert) {
        const prereq = await prisma.course.findUnique({
          where: { id: prereqId },
          select: { title: true },
        });
        throw Object.assign(new Error(`ต้องเรียนจบ "${prereq?.title ?? prereqId}" ก่อน`), {
          status: 403,
          prerequisiteTitle: prereq?.title,
        });
      }
    }

    return course;
  },
};

import path from 'path';
import fs from 'fs';
import { certificateRepository } from './certificate.repository';
import { progressRepository } from '../progress/progress.repository';
import { courseRepository } from '../course/course.repository';
import { quizService } from '../quiz/quiz.service';
import prisma from '../../lib/prisma';

const CERTS_DIR = path.join(process.cwd(), 'certificates');

type CertTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

async function getUserTier(userId: string): Promise<CertTier | null> {
  const [certCount, activeCourseCount] = await Promise.all([
    prisma.certificate.count({ where: { userId } }),
    prisma.course.count({ where: { isActive: true } }),
  ]);
  if (activeCourseCount > 0 && certCount >= activeCourseCount) return 'PLATINUM';
  if (certCount >= 14) return 'GOLD';
  if (certCount >= 10) return 'SILVER';
  if (certCount >= 6) return 'BRONZE';
  return null;
}

export const certificateService = {
  async getOrGenerate(userId: string, courseId: string) {
    const existing = await certificateRepository.findByUserAndCourse(userId, courseId);
    if (existing) return existing;

    const course = await courseRepository.findById(courseId);
    if (!course) throw Object.assign(new Error('Course not found'), { status: 404 });

    const completedCount = await progressRepository.countCompletedVideos(userId, courseId);
    if (completedCount < course.videos.length) {
      throw Object.assign(new Error('Course not completed'), { status: 403 });
    }

    const quizPassed = await quizService.isQuizPassed(userId, courseId);
    if (!quizPassed) {
      throw Object.assign(new Error('Quiz not passed'), { status: 403 });
    }

    if (!fs.existsSync(CERTS_DIR)) fs.mkdirSync(CERTS_DIR, { recursive: true });

    const fileName = `cert_${userId}_${courseId}.txt`;
    const filePath = path.join(CERTS_DIR, fileName);
    const content = `Certificate of Completion\n\nCourse: ${course.title}\nUser ID: ${userId}\nIssued: ${new Date().toISOString()}`;
    fs.writeFileSync(filePath, content);

    const quizAttempt = await prisma.quizAttempt.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    const tier = await getUserTier(userId);
    return certificateRepository.create(
      userId,
      courseId,
      filePath,
      tier,
      quizAttempt?.score ?? null,
    );
  },

  async listForUser(userId: string) {
    return certificateRepository.findAllByUser(userId);
  },

  async verifyByToken(verifyToken: string) {
    return certificateRepository.findByVerifyToken(verifyToken);
  },

  getUserTier,
};

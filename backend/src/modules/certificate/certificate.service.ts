import path from 'path';
import fs from 'fs';
import { certificateRepository } from './certificate.repository';
import { progressRepository } from '../progress/progress.repository';
import { courseRepository } from '../course/course.repository';

const CERTS_DIR = path.join(process.cwd(), 'certificates');

export const certificateService = {
  async getOrGenerate(userId: string, courseId: string) {
    // Return existing certificate if already generated
    const existing = await certificateRepository.findByUserAndCourse(userId, courseId);
    if (existing) return existing;

    // Check eligibility: all videos in course must be completed
    const course = await courseRepository.findById(courseId);
    if (!course) throw Object.assign(new Error('Course not found'), { status: 404 });

    const completedCount = await progressRepository.countCompletedVideos(userId, courseId);
    if (completedCount < course.videos.length) {
      throw Object.assign(new Error('Course not completed'), { status: 403 });
    }

    // Generate a simple text-based certificate (placeholder for PDF)
    if (!fs.existsSync(CERTS_DIR)) fs.mkdirSync(CERTS_DIR, { recursive: true });

    const fileName = `cert_${userId}_${courseId}.txt`;
    const filePath = path.join(CERTS_DIR, fileName);
    const content = `Certificate of Completion\n\nCourse: ${course.title}\nUser ID: ${userId}\nIssued: ${new Date().toISOString()}`;
    fs.writeFileSync(filePath, content);

    return certificateRepository.create(userId, courseId, filePath);
  },

  async listForUser(userId: string) {
    return certificateRepository.findAllByUser(userId);
  },
};

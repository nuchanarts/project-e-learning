import { certificateService } from '../certificate.service';
import { certificateRepository } from '../certificate.repository';
import { progressRepository } from '../../progress/progress.repository';
import { courseRepository } from '../../course/course.repository';
import { quizService } from '../../quiz/quiz.service';
import fs from 'fs';

jest.mock('../certificate.repository');
jest.mock('../../progress/progress.repository');
jest.mock('../../course/course.repository');
jest.mock('../../quiz/quiz.service');
jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  default: {
    certificate: { count: jest.fn().mockResolvedValue(0) },
    course: { count: jest.fn().mockResolvedValue(5) },
    quizAttempt: { findUnique: jest.fn().mockResolvedValue({ score: 80 }) },
  },
}));

const mockCourse = {
  id: 'c1',
  title: 'Test Course',
  videos: [{ id: 'v1' }, { id: 'v2' }],
};

const mockCert = {
  id: 'cert-1',
  userId: 'u1',
  courseId: 'c1',
  filePath: '/certs/cert_u1_c1.txt',
  issuedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(fs, 'existsSync').mockReturnValue(true);
  jest.spyOn(fs, 'mkdirSync').mockImplementation((() => undefined) as any);
  jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('certificateService.getOrGenerate', () => {
  it('should return existing certificate without regenerating', async () => {
    (certificateRepository.findByUserAndCourse as jest.Mock).mockResolvedValue(mockCert);

    const result = await certificateService.getOrGenerate('u1', 'c1');
    expect(result).toEqual(mockCert);
    expect(courseRepository.findById).not.toHaveBeenCalled();
  });

  it('should throw 404 if course not found', async () => {
    (certificateRepository.findByUserAndCourse as jest.Mock).mockResolvedValue(null);
    (courseRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(certificateService.getOrGenerate('u1', 'c1')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('should throw 403 if course not completed (only 1 of 2 videos done)', async () => {
    (certificateRepository.findByUserAndCourse as jest.Mock).mockResolvedValue(null);
    (courseRepository.findById as jest.Mock).mockResolvedValue(mockCourse);
    (progressRepository.countCompletedVideos as jest.Mock).mockResolvedValue(1);
    (quizService.isQuizPassed as jest.Mock).mockResolvedValue(true);

    await expect(certificateService.getOrGenerate('u1', 'c1')).rejects.toMatchObject({
      status: 403,
    });
  });

  it('should throw 403 if quiz not passed', async () => {
    (certificateRepository.findByUserAndCourse as jest.Mock).mockResolvedValue(null);
    (courseRepository.findById as jest.Mock).mockResolvedValue(mockCourse);
    (progressRepository.countCompletedVideos as jest.Mock).mockResolvedValue(2);
    (quizService.isQuizPassed as jest.Mock).mockResolvedValue(false);

    await expect(certificateService.getOrGenerate('u1', 'c1')).rejects.toMatchObject({
      status: 403,
    });
  });

  it('should generate and return new certificate when all videos completed and quiz passed', async () => {
    (certificateRepository.findByUserAndCourse as jest.Mock).mockResolvedValue(null);
    (courseRepository.findById as jest.Mock).mockResolvedValue(mockCourse);
    (progressRepository.countCompletedVideos as jest.Mock).mockResolvedValue(2);
    (quizService.isQuizPassed as jest.Mock).mockResolvedValue(true);
    (certificateRepository.create as jest.Mock).mockResolvedValue(mockCert);

    const result = await certificateService.getOrGenerate('u1', 'c1');
    expect(certificateRepository.create).toHaveBeenCalledWith(
      'u1',
      'c1',
      expect.stringContaining('cert_u1_c1'),
      null,
      80,
    );
    expect(result).toEqual(mockCert);
  });

  it('should create certs directory if it does not exist', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    (certificateRepository.findByUserAndCourse as jest.Mock).mockResolvedValue(null);
    (courseRepository.findById as jest.Mock).mockResolvedValue(mockCourse);
    (progressRepository.countCompletedVideos as jest.Mock).mockResolvedValue(2);
    (quizService.isQuizPassed as jest.Mock).mockResolvedValue(true);
    (certificateRepository.create as jest.Mock).mockResolvedValue(mockCert);

    await certificateService.getOrGenerate('u1', 'c1');
    expect(fs.mkdirSync).toHaveBeenCalled();
  });
});

describe('certificateService.listForUser', () => {
  it('should return all certificates for user', async () => {
    (certificateRepository.findAllByUser as jest.Mock).mockResolvedValue([mockCert]);

    const result = await certificateService.listForUser('u1');
    expect(result).toHaveLength(1);
  });

  it('should return empty array when user has no certificates', async () => {
    (certificateRepository.findAllByUser as jest.Mock).mockResolvedValue([]);

    const result = await certificateService.listForUser('u1');
    expect(result).toHaveLength(0);
  });
});

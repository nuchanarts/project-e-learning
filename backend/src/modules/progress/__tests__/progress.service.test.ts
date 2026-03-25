import { progressService } from '../progress.service';
import { progressRepository } from '../progress.repository';
import { courseRepository } from '../../course/course.repository';

jest.mock('../progress.repository');
jest.mock('../../course/course.repository');

const mockCourse = {
  id: 'c1',
  videos: [{ id: 'v1' }, { id: 'v2' }],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('progressService.saveProgress', () => {
  it('should mark video completed when percent >= 80', async () => {
    (progressRepository.upsert as jest.Mock).mockResolvedValue({
      id: 'p1',
      userId: 'u1',
      videoId: 'v1',
      courseId: 'c1',
      percent: 85,
      completed: true,
    });
    (progressRepository.countCompletedVideos as jest.Mock).mockResolvedValue(2);
    (courseRepository.findById as jest.Mock).mockResolvedValue(mockCourse);

    const result = await progressService.saveProgress('u1', 'v1', 'c1', 85);
    expect(result.videoCompleted).toBe(true);
  });

  it('should NOT mark video completed when percent < 80', async () => {
    (progressRepository.upsert as jest.Mock).mockResolvedValue({
      id: 'p1',
      userId: 'u1',
      videoId: 'v1',
      courseId: 'c1',
      percent: 50,
      completed: false,
    });
    (progressRepository.countCompletedVideos as jest.Mock).mockResolvedValue(0);
    (courseRepository.findById as jest.Mock).mockResolvedValue(mockCourse);

    const result = await progressService.saveProgress('u1', 'v1', 'c1', 50);
    expect(result.videoCompleted).toBe(false);
    expect(result.courseCompleted).toBe(false);
  });

  it('should mark course completed when all videos are completed', async () => {
    (progressRepository.upsert as jest.Mock).mockResolvedValue({
      id: 'p1',
      userId: 'u1',
      videoId: 'v2',
      courseId: 'c1',
      percent: 100,
      completed: true,
    });
    (progressRepository.countCompletedVideos as jest.Mock).mockResolvedValue(2);
    (courseRepository.findById as jest.Mock).mockResolvedValue(mockCourse);

    const result = await progressService.saveProgress('u1', 'v2', 'c1', 100);
    expect(result.courseCompleted).toBe(true);
  });
});

describe('progressService.getUserProgress', () => {
  it('should return all progress for a user in a course', async () => {
    (progressRepository.findByUserAndCourse as jest.Mock).mockResolvedValue([
      { userId: 'u1', videoId: 'v1', courseId: 'c1', percent: 85, completed: true },
    ]);
    const result = await progressService.getUserProgress('u1', 'c1');
    expect(result).toHaveLength(1);
  });
});

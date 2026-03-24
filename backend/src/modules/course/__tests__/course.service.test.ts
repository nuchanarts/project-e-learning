import { courseService } from '../course.service';
import { courseRepository } from '../course.repository';

jest.mock('../course.repository');

const mockVideo = {
  id: 'v1',
  courseId: 'c1',
  title: 'Intro',
  url: 'https://example.com/video.mp4',
  duration: 300,
  order: 1,
  createdAt: new Date(),
};

const mockCourse = {
  id: 'c1',
  title: 'Test Course',
  description: 'A test course',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  videos: [mockVideo],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('courseService.list', () => {
  it('should return list of active courses', async () => {
    (courseRepository.findAll as jest.Mock).mockResolvedValue([mockCourse]);
    const result = await courseService.list();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c1');
    expect(courseRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no courses', async () => {
    (courseRepository.findAll as jest.Mock).mockResolvedValue([]);
    const result = await courseService.list();
    expect(result).toHaveLength(0);
  });
});

describe('courseService.getById', () => {
  it('should return course with videos', async () => {
    (courseRepository.findById as jest.Mock).mockResolvedValue(mockCourse);
    const result = await courseService.getById('c1');
    expect(result.id).toBe('c1');
    expect(result.videos).toHaveLength(1);
  });

  it('should throw 404 if course not found', async () => {
    (courseRepository.findById as jest.Mock).mockResolvedValue(null);
    await expect(courseService.getById('bad-id')).rejects.toMatchObject({ status: 404 });
  });
});

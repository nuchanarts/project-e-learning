import { dashboardService } from '../dashboard.service';
import { dashboardRepository } from '../dashboard.repository';

jest.mock('../dashboard.repository');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('dashboardService.getForUser', () => {
  it('should return dashboard summary with courses and progress', async () => {
    (dashboardRepository.getUserCoursesSummary as jest.Mock).mockResolvedValue([
      {
        id: 'c1',
        title: 'Course 1',
        description: 'Desc',
        videos: [{ id: 'v1' }, { id: 'v2' }],
        progress: [{ videoId: 'v1', completed: true }],
      },
    ]);

    const result = await dashboardService.getForUser('u1');
    expect(result.totalCourses).toBe(1);
    expect(result.completedCourses).toBe(0);
    expect(result.inProgressCourses).toBe(1);
    expect(result.courses[0].progressPercent).toBe(50);
  });

  it('should count completed course correctly', async () => {
    (dashboardRepository.getUserCoursesSummary as jest.Mock).mockResolvedValue([
      {
        id: 'c1',
        title: 'Course 1',
        description: 'Desc',
        videos: [{ id: 'v1' }],
        progress: [{ videoId: 'v1', completed: true }],
      },
    ]);

    const result = await dashboardService.getForUser('u1');
    expect(result.completedCourses).toBe(1);
    expect(result.inProgressCourses).toBe(0);
  });
});

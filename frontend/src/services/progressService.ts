import api from '../lib/api';

export interface ProgressRecord {
  videoId: string;
  courseId: string;
  percent: number;
  completed: boolean;
  watchedSeconds?: number;
}

export const progressService = {
  save: (data: { videoId: string; courseId: string; percent: number; watchedSeconds?: number }) =>
    api.post('/progress', data).then((r) => r.data),

  getForCourse: (courseId: string) =>
    api.get<ProgressRecord[]>(`/progress/course/${courseId}`).then((r) => r.data),
};

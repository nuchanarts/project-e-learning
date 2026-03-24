import api from '../lib/api';

export interface Video {
  id: string;
  title: string;
  url: string;
  duration: number;
  order: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  videos: Video[];
}

export const courseService = {
  list: () => api.get<Course[]>('/courses').then((r) => r.data),
  getById: (id: string) => api.get<Course>(`/courses/${id}`).then((r) => r.data),
};

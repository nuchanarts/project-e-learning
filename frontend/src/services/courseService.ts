import api from '../lib/api';

export interface Video {
  id: string;
  title: string;
  url: string;
  duration: number;
  order: number;
  section?: string | null;
}

export interface CourseDocument {
  id: string;
  title: string;
  url: string;
  order: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category?: string | null;
  price?: number | null;
  videos: Video[];
  documents: CourseDocument[];
}

export const courseService = {
  list: (category?: string) =>
    api
      .get<Course[]>('/courses', { params: category ? { category } : undefined })
      .then((r) => r.data),
  getById: (id: string) => api.get<Course>(`/courses/${id}`).then((r) => r.data),
};

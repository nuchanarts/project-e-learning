import api from '../lib/api';

export interface Certificate {
  id: string;
  courseId: string;
  issuedAt: string;
  course?: { id: string; title: string };
}

export const certificateService = {
  list: () => api.get<Certificate[]>('/certificates').then((r) => r.data),
  getForCourse: (courseId: string) => api.get<Certificate>(`/certificates/${courseId}`).then((r) => r.data),
  downloadUrl: (courseId: string) => `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/certificates/${courseId}/download`,
};

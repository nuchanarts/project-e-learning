import api from '../lib/api';

export interface Certificate {
  id: string;
  courseId: string;
  issuedAt: string;
  tier?: string | null;
  quizScore?: number | null;
  verifyToken?: string;
  course?: { id: string; title: string };
}

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const certificateService = {
  list: () => api.get<Certificate[]>('/certificates').then((r) => r.data),
  getForCourse: (courseId: string) =>
    api.get<Certificate>(`/certificates/${courseId}`).then((r) => r.data),
  downloadUrl: (courseId: string) => `${BASE}/certificates/${courseId}/download`,
  verifyUrl: (verifyToken: string) => `${window.location.origin}/verify/${verifyToken}`,
};

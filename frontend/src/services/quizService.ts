import api from '../lib/api';

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  order: number;
}

export interface QuizResult {
  score: number;
  passed: boolean;
  correctCount: number;
  total: number;
}

export const quizService = {
  getQuestions: (courseId: string) =>
    api.get<QuizQuestion[]>(`/quiz/${courseId}`).then((r) => r.data),

  submitAttempt: (courseId: string, answers: number[]) =>
    api.post<QuizResult>(`/quiz/${courseId}/attempt`, { answers }).then((r) => r.data),

  getResult: (courseId: string) =>
    api
      .get<{
        score: number;
        passed: boolean;
        attemptedAt: string;
      } | null>(`/quiz/${courseId}/result`)
      .then((r) => r.data),
};

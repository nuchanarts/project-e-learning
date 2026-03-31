import { quizRepository } from './quiz.repository';

const PASS_THRESHOLD = 60;

export const quizService = {
  async getQuestions(courseId: string) {
    const questions = await quizRepository.getQuestions(courseId);
    return questions.map((q) => ({
      id: q.id,
      text: q.text,
      options: JSON.parse(q.options) as string[],
      order: q.order,
    }));
  },

  async submitAttempt(userId: string, courseId: string, answers: number[]) {
    const questions = await quizRepository.getQuestions(courseId);
    if (questions.length === 0) {
      return { score: 100, passed: true, correctCount: 0, total: 0 };
    }

    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correctIndex) correct++;
    }
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= PASS_THRESHOLD;

    await quizRepository.upsertAttempt(userId, courseId, score, passed, answers);
    return { score, passed, correctCount: correct, total: questions.length };
  },

  async getResult(userId: string, courseId: string) {
    const attempt = await quizRepository.getAttempt(userId, courseId);
    if (!attempt) return null;
    return { score: attempt.score, passed: attempt.passed, attemptedAt: attempt.attemptedAt };
  },

  async isQuizPassed(userId: string, courseId: string): Promise<boolean> {
    const questionCount = await quizRepository.getQuestions(courseId);
    if (questionCount.length === 0) return true; // no quiz = auto pass
    const attempt = await quizRepository.getAttempt(userId, courseId);
    return attempt?.passed ?? false;
  },
};

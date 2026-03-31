import { quizRepository } from './quiz.repository';

const PASS_THRESHOLD = 60;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const quizService = {
  async getQuestions(courseId: string, randomize = true) {
    const questions = await quizRepository.getQuestions(courseId);
    const list = randomize ? shuffle(questions) : questions;
    return list.map((q) => ({
      id: q.id,
      text: q.text,
      options: shuffle(JSON.parse(q.options) as string[]),
      order: q.order,
    }));
  },

  async submitAttempt(userId: string, courseId: string, answers: Record<string, number>) {
    const questions = await quizRepository.getQuestions(courseId);
    if (questions.length === 0) {
      return { score: 100, passed: true, correctCount: 0, total: 0 };
    }

    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctIndex) correct++;
    }
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= PASS_THRESHOLD;

    const answersJson = JSON.stringify(answers);
    await quizRepository.upsertAttempt(userId, courseId, score, passed, answersJson as any);
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

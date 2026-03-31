import prisma from '../../lib/prisma';

export const quizRepository = {
  async getQuestions(courseId: string) {
    return prisma.quizQuestion.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });
  },

  async createQuestion(
    courseId: string,
    data: { text: string; options: string[]; correctIndex: number; order?: number },
  ) {
    return prisma.quizQuestion.create({
      data: {
        courseId,
        text: data.text,
        options: JSON.stringify(data.options),
        correctIndex: data.correctIndex,
        order: data.order ?? 0,
      },
    });
  },

  async updateQuestion(
    id: string,
    data: Partial<{ text: string; options: string[]; correctIndex: number; order: number }>,
  ) {
    const updateData: any = { ...data };
    if (data.options) updateData.options = JSON.stringify(data.options);
    return prisma.quizQuestion.update({ where: { id }, data: updateData });
  },

  async deleteQuestion(id: string) {
    return prisma.quizQuestion.delete({ where: { id } });
  },

  async upsertAttempt(
    userId: string,
    courseId: string,
    score: number,
    passed: boolean,
    answers: number[],
  ) {
    return prisma.quizAttempt.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, score, passed, answers: JSON.stringify(answers) },
      update: { score, passed, answers: JSON.stringify(answers), attemptedAt: new Date() },
    });
  },

  async getAttempt(userId: string, courseId: string) {
    return prisma.quizAttempt.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
  },
};

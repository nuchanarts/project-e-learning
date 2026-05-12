import prisma from '../../lib/prisma';

export interface CreateTrainingRecordDto {
  userId: string;
  courseId?: string;
  recordDate: Date;
  imageData?: string;
  imageMimeType?: string;
  notes?: string;
  triageRed?: number;
  triageYellow?: number;
  triageGreen?: number;
  vitalSigns?: number;
  cc?: number;
  hpi?: number;
  procedures?: number;
  labOrders?: number;
  xrayOrders?: number;
  medications?: number;
  billing?: number;
  otherExpenses?: number;
}

const userSelect = {
  select: { id: true, name: true, hospital: true, hospcode: true, position: true },
};
const courseSelect = { select: { id: true, title: true } };

export const trainingRecordRepository = {
  async create(data: CreateTrainingRecordDto) {
    return prisma.trainingRecord.create({
      data: { ...data, status: 'PENDING' },
      include: { user: userSelect, course: courseSelect },
    });
  },

  async findByUser(userId: string) {
    return prisma.trainingRecord.findMany({
      where: { userId },
      orderBy: { recordDate: 'desc' },
      include: { course: courseSelect },
    });
  },

  async findById(id: string) {
    return prisma.trainingRecord.findUnique({
      where: { id },
      include: { user: userSelect, course: courseSelect },
    });
  },

  async findByCourse(courseId: string) {
    return prisma.trainingRecord.findMany({
      where: { courseId },
      orderBy: [{ status: 'asc' }, { recordDate: 'desc' }],
      include: { user: userSelect, course: courseSelect },
    });
  },

  async findAllForAdmin(status?: string) {
    return prisma.trainingRecord.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: { user: userSelect, course: courseSelect },
    });
  },

  async existsForUserAndCourse(userId: string, courseId: string) {
    const count = await prisma.trainingRecord.count({
      where: { userId, courseId, status: 'APPROVED' },
    });
    return count > 0;
  },

  async updateStatus(id: string, status: 'APPROVED' | 'REJECTED', adminNote?: string) {
    return prisma.trainingRecord.update({
      where: { id },
      data: { status, adminNote },
      include: { user: userSelect, course: courseSelect },
    });
  },

  async delete(id: string) {
    return prisma.trainingRecord.delete({ where: { id } });
  },
};

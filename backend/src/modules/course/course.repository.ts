import prisma from '../../lib/prisma';

export const courseRepository = {
  async findAll() {
    return prisma.course.findMany({
      where: { isActive: true },
      include: { videos: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id: string) {
    return prisma.course.findFirst({
      where: { id, isActive: true },
      include: { videos: { orderBy: { order: 'asc' } } },
    });
  },

  async create(data: { title: string; description: string }) {
    return prisma.course.create({ data });
  },

  async update(id: string, data: Partial<{ title: string; description: string; isActive: boolean }>) {
    return prisma.course.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.course.update({ where: { id }, data: { isActive: false } });
  },
};

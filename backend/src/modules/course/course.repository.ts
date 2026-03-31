import prisma from '../../lib/prisma';

export const courseRepository = {
  async findAll(category?: string) {
    return prisma.course.findMany({
      where: { isActive: true, ...(category ? { category } : {}) },
      include: {
        videos: { orderBy: { order: 'asc' } },
        documents: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id: string) {
    return prisma.course.findFirst({
      where: { id, isActive: true },
      include: {
        videos: { orderBy: { order: 'asc' } },
        documents: { orderBy: { order: 'asc' } },
      },
    });
  },

  async create(data: { title: string; description: string; category?: string }) {
    return prisma.course.create({ data });
  },

  async update(
    id: string,
    data: Partial<{ title: string; description: string; category: string; isActive: boolean }>,
  ) {
    return prisma.course.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.course.update({ where: { id }, data: { isActive: false } });
  },
};

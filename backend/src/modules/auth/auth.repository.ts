import prisma from '../../lib/prisma';

export const authRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },
  async create(data: { email: string; passwordHash: string; name: string }) {
    return prisma.user.create({ data });
  },
};

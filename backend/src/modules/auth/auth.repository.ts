import prisma from '../../lib/prisma';

export const authRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },
  async findByCid(cid: string) {
    return prisma.user.findUnique({ where: { cid } });
  },
  async create(data: {
    email: string;
    passwordHash: string;
    name: string;
    cid?: string;
    hospital?: string;
    position?: string;
  }) {
    return prisma.user.create({ data });
  },
};

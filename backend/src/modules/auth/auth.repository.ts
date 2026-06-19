import prisma from '../../lib/prisma';

export const authRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },
  async findByCid(cid: string) {
    return prisma.user.findUnique({ where: { cid } });
  },
  async findByProviderSub(providerSub: string) {
    return prisma.user.findUnique({ where: { providerSub } });
  },
  async create(data: {
    email: string;
    passwordHash: string | null;
    name: string;
    cid?: string | null;
    hospital?: string | null;
    hospcode?: string | null;
    position?: string | null;
    authProvider?: string;
    providerSub?: string | null;
  }) {
    return prisma.user.create({ data });
  },
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },
  async updateById(
    id: string,
    data: { name?: string; hospital?: string; position?: string; avatarUrl?: string | null },
  ) {
    return prisma.user.update({ where: { id }, data });
  },
  async findByHospcodeAndCid(hospcode: string, cid: string) {
    return prisma.user.findMany({ where: { hospcode, cid } });
  },
  async updatePasswordByEmail(email: string, passwordHash: string) {
    return prisma.user.update({ where: { email }, data: { passwordHash } });
  },
};

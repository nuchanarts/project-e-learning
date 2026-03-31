import { PrismaClient } from '@prisma/client';

// Prisma's Quaint (Rust) connector does not honour charset=utf8mb4 in the URL
// on every connection in the pool. Run SET NAMES utf8mb4 before each model
// operation to guarantee Thai characters (utf8mb4) are returned correctly.
const prismaBase = new PrismaClient();

const prisma = prismaBase.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        await prismaBase.$executeRawUnsafe('SET NAMES utf8mb4');
        return query(args);
      },
    },
  },
});

export default prisma;

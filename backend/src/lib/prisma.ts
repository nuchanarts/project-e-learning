import { PrismaClient } from '@prisma/client';

// BMS/HOSxP MySQL uses TIS-620 — fix by altering session charset via queryRaw
// We run SET NAMES inside a transaction so both use the same connection
const client = new PrismaClient();

const prisma = client.$extends({
  query: {
    async $allOperations({ args, query }) {
      // Run SET NAMES + actual query in same transaction (same connection)
      let result: unknown;
      await client.$transaction(async (tx) => {
        await tx.$executeRawUnsafe('SET NAMES utf8mb4');
        result = await query(args);
      });
      return result;
    },
  },
});

export default prisma as unknown as PrismaClient;

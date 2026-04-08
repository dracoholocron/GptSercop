import { PrismaClient } from '../generated/client/index.js';

export const prisma = new PrismaClient();

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

process.once('beforeExit', () => {
  void prisma.$disconnect();
});

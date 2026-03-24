import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/db.js';
import { app } from '../src/index.js';

beforeAll(async () => {
  await prisma.$connect();
  await app.ready();
});

afterAll(async () => {
  await prisma.$disconnect();
});

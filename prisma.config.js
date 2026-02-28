/** @type {import('prisma').PrismaConfig} */
module.exports = {
  schema: 'prisma/schema.prisma',
  seed: 'node --import tsx prisma/seed.ts',
};

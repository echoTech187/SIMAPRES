import { prisma } from '../src/infrastructure/db/prisma.client';

async function main() {
  console.log('🌱 Invoking SIMAPRES 110 Enterprise v3 Seed...');
  // Import and run the comprehensive seed
  const { execSync } = await import('child_process');
  execSync('npx tsx src/seed_enterprise_v3.ts', { stdio: 'inherit' });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const soal = await prisma.soal.findFirst({
    orderBy: { id: 'desc' }
  });
  console.log(JSON.stringify(soal, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

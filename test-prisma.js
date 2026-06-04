const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const siswa = await prisma.siswa.findFirst();
  console.log(siswa);
}
main().finally(() => prisma.$disconnect());

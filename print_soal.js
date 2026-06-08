const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "mysql://jazacade_abukafa:Administrator*2025@195.88.211.20:3306/jazacade_cbt"
    }
  }
});

async function main() {
  const soal = await prisma.soal.findFirst({
    where: { id: 2603 }
  });
  console.log(`Soal: ${soal.soal}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

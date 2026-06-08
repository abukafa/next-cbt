const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "mysql://jazacade_abukafa:Administrator*2025@195.88.211.20:3306/jazacade_cbt"
    }
  }
});

async function main() {
  const soal = await prisma.soal.findMany({
    take: 3,
    orderBy: { id: 'desc' }
  });
  soal.forEach(s => {
    console.log(`ID: ${s.id}`);
    console.log(`Opsi A: ${s.opsi_a.substring(0, 100)}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

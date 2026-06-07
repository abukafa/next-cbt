require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.siswa.findFirst().then(console.log).finally(() => prisma.$disconnect());

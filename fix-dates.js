const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Fixing 0000-00-00 dates...");
  try {
    const soal = await prisma.$executeRawUnsafe(`UPDATE m_soal SET tgl_input = '2000-01-01 00:00:00' WHERE tgl_input < '1970-01-01' OR tgl_input = '0000-00-00 00:00:00'`);
    console.log("Fixed m_soal:", soal);
    
    const tes1 = await prisma.$executeRawUnsafe(`UPDATE tr_guru_tes SET tgl_mulai = '2000-01-01 00:00:00' WHERE tgl_mulai < '1970-01-01' OR tgl_mulai = '0000-00-00 00:00:00'`);
    const tes2 = await prisma.$executeRawUnsafe(`UPDATE tr_guru_tes SET terlambat = '2000-01-01 00:00:00' WHERE terlambat < '1970-01-01' OR terlambat = '0000-00-00 00:00:00'`);
    console.log("Fixed tr_guru_tes:", tes1, tes2);
    
    const ikut1 = await prisma.$executeRawUnsafe(`UPDATE tr_ikut_ujian SET tgl_mulai = '2000-01-01 00:00:00' WHERE tgl_mulai < '1970-01-01' OR tgl_mulai = '0000-00-00 00:00:00'`);
    const ikut2 = await prisma.$executeRawUnsafe(`UPDATE tr_ikut_ujian SET tgl_selesai = '2000-01-01 00:00:00' WHERE tgl_selesai < '1970-01-01' OR tgl_selesai = '0000-00-00 00:00:00'`);
    console.log("Fixed tr_ikut_ujian:", ikut1, ikut2);
    
    console.log("All dates fixed!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

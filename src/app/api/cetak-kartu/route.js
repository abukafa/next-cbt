import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "siswa") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterKelas = searchParams.get("kelas");
    const filterJurusan = searchParams.get("jurusan");

    if (!filterKelas && !filterJurusan) {
      // Just return filter options
      const siswas = await prisma.siswa.findMany({
        select: { jurusan: true, id_jurusan: true }
      });
      
      // Get unique classes (jurusan in schema)
      const uniqueKelas = [...new Set(siswas.map(s => s.jurusan).filter(Boolean))].sort();
      // Get unique jurusan (id_jurusan in schema)
      const uniqueJurusan = [...new Set(siswas.map(s => s.id_jurusan).filter(Boolean))].sort();

      return NextResponse.json({
        kelasOptions: uniqueKelas,
        jurusanOptions: uniqueJurusan
      });
    }

    // Filter students
    const whereClause = {};
    if (filterKelas) whereClause.jurusan = filterKelas;
    if (filterJurusan) whereClause.id_jurusan = filterJurusan;

    const siswas = await prisma.siswa.findMany({
      where: whereClause,
      orderBy: { nama: "asc" }
    });

    const konIds = siswas.map(s => s.id);
    
    const admins = await prisma.admin.findMany({
      where: {
        level: "siswa",
        kon_id: { in: konIds }
      },
      select: { kon_id: true, username: true }
    });

    // Merge
    const studentsData = siswas.map(s => {
      const adminData = admins.find(a => a.kon_id === s.id);
      return {
        ...s,
        username: adminData?.username || "-"
      };
    });

    return NextResponse.json({ students: studentsData });

  } catch (error) {
    console.error("API cetak-kartu error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

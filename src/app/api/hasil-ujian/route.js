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

    const { role, kon_id } = session.user;

    // Build the query
    const whereClause = {};
    if (role === "guru") {
      // Find what mapels this guru teaches
      const myMapels = await prisma.trGuruMapel.findMany({
        where: { id_guru: parseInt(kon_id) }
      });
      const mapelIds = myMapels.map(m => m.id_mapel);
      
      // Guru can see exams if they are the creator OR if they teach the mapel
      whereClause.OR = [
        { id_guru: parseInt(kon_id) },
        { id_mapel: { in: mapelIds } }
      ];
    }

    // Fetch all exams based on role
    const tesList = await prisma.trGuruTes.findMany({
      where: whereClause,
      orderBy: { tgl_mulai: "desc" }
    });

    // We need to enrich this with guru name, mapel name, and participant count
    const enrichedTes = await Promise.all(
      tesList.map(async (tes) => {
        // Determine Guru name to display
        let displayGuruName = "Tanpa Pengampu / Admin";
        
        // Find current pengampu for this mapel
        const pengampuRel = await prisma.trGuruMapel.findFirst({
          where: { id_mapel: tes.id_mapel }
        });
        
        if (pengampuRel) {
          const pengampu = await prisma.guru.findUnique({ where: { id: pengampuRel.id_guru } });
          if (pengampu) displayGuruName = pengampu.nama;
        } else {
          // Fallback to original creator if no pengampu exists
          const originalCreator = await prisma.guru.findUnique({ where: { id: tes.id_guru } });
          if (originalCreator) displayGuruName = originalCreator.nama;
        }

        const mapel = await prisma.mapel.findUnique({ where: { id: tes.id_mapel } });
        
        // Count total participants (students in this class/jurusan)
        // In legacy DB: siswa.jurusan stores kelas, siswa.id_jurusan stores jurusan
        let siswaWhere = {};
        if (tes.kelas && tes.jurusan) {
          siswaWhere = {
            jurusan: tes.kelas,
            id_jurusan: tes.jurusan
          };
        }
        const jmlPeserta = await prisma.siswa.count({
          where: siswaWhere
        });

        // Count finished participants
        const jmlSelesai = await prisma.trIkutUjian.count({
          where: { id_tes: tes.id, status: "N" }
        });

        return {
          ...tes,
          nama_guru: displayGuruName,
          nama_mapel: mapel?.nama || "Unknown",
          jml_peserta: jmlPeserta,
          jml_selesai: jmlSelesai
        };
      })
    );

    return NextResponse.json(enrichedTes);

  } catch (error) {
    console.error("API hasil-ujian error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

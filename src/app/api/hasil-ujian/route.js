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
      whereClause.id_guru = parseInt(kon_id);
    }

    // Fetch all exams based on role
    const tesList = await prisma.trGuruTes.findMany({
      where: whereClause,
      orderBy: { tgl_mulai: "desc" }
    });

    // We need to enrich this with guru name, mapel name, and participant count
    const enrichedTes = await Promise.all(
      tesList.map(async (tes) => {
        // Fetch relations manually since there are no foreign keys in schema
        const guru = await prisma.guru.findUnique({ where: { id: tes.id_guru } });
        const mapel = await prisma.mapel.findUnique({ where: { id: tes.id_mapel } });
        
        // Count participants
        const jmlPeserta = await prisma.trIkutUjian.count({
          where: { id_tes: tes.id }
        });

        // Count finished participants
        const jmlSelesai = await prisma.trIkutUjian.count({
          where: { id_tes: tes.id, status: "Y" }
        });

        return {
          ...tes,
          nama_guru: guru?.nama || "Unknown",
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

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
    const id_tes = searchParams.get("id_tes");

    if (!id_tes) {
      // Get list of exams
      const whereClause = {};
      if (session.user.role === "guru") {
        whereClause.id_guru = parseInt(session.user.kon_id);
      }

      const tesList = await prisma.trGuruTes.findMany({
        where: whereClause,
        orderBy: { tgl_mulai: "desc" },
      });

      // Get mapel details
      const mapelIds = [...new Set(tesList.map((t) => t.id_mapel))];
      const mapels = await prisma.mapel.findMany({
        where: { id: { in: mapelIds } },
      });

      const guruIds = [...new Set(tesList.map((t) => t.id_guru))];
      const gurus = await prisma.guru.findMany({
        where: { id: { in: guruIds } },
      });

      const formattedTes = tesList.map((t) => {
        const mapel = mapels.find((m) => m.id === t.id_mapel);
        const guru = gurus.find((g) => g.id === t.id_guru);
        return {
          ...t,
          mapel_nama: mapel ? mapel.nama : "Tidak Diketahui",
          guru_nama: guru ? guru.nama : "Tidak Diketahui",
        };
      });

      return NextResponse.json({ exams: formattedTes });
    }

    // Get specific exam data
    const tesId = parseInt(id_tes);
    const tes = await prisma.trGuruTes.findUnique({
      where: { id: tesId },
    });

    if (!tes) {
      return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
    }

    const mapel = await prisma.mapel.findUnique({
      where: { id: tes.id_mapel },
    });
    
    const guru = await prisma.guru.findUnique({
      where: { id: tes.id_guru },
    });

    const tesDetail = {
      ...tes,
      mapel_nama: mapel ? mapel.nama : "-",
      guru_nama: guru ? guru.nama : "-",
    };

    // Filter students by kelas & jurusan
    const siswas = await prisma.siswa.findMany({
      where: {
        jurusan: tes.kelas,
        id_jurusan: tes.jurusan,
      },
      orderBy: { nama: "asc" },
    });

    // Get attendance data from tr_ikut_ujian
    // Note: trIkutUjian id_user = Admin.id (actually kon_id for siswa in legacy)
    const konIds = siswas.map((s) => s.id);
    
    const ikutUjian = await prisma.trIkutUjian.findMany({
      where: {
        id_tes: tesId,
        id_user: { in: konIds },
      },
    });

    // Merge student with attendance
    const studentsData = siswas.map((s) => {
      const attendance = ikutUjian.find((u) => u.id_user === s.id);
      return {
        ...s,
        hadir: !!attendance,
        nilai: attendance ? attendance.nilai : null,
      };
    });

    return NextResponse.json({ tes: tesDetail, students: studentsData });
  } catch (error) {
    console.error("API daftar-hadir error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

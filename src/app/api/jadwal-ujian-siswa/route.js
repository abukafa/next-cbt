import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "siswa") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const kon_id = parseInt(session.user.kon_id);
    const userId = parseInt(session.user.id);

    // Get the student details
    const siswa = await prisma.siswa.findUnique({
      where: { id: kon_id }
    });

    if (!siswa) {
      return NextResponse.json({ error: "Siswa not found" }, { status: 404 });
    }

    // In legacy DB: siswa.jurusan stores Kelas, siswa.id_jurusan stores Jurusan
    const kelasSiswa = siswa.jurusan;
    const jurusanSiswa = siswa.id_jurusan;

    // Get all tests for this class and major
    const tesList = await prisma.trGuruTes.findMany({
      where: {
        kelas: kelasSiswa,
        jurusan: jurusanSiswa,
      },
      orderBy: { tgl_mulai: "desc" }
    });

    // Get the student's ikut_ujian records
    const ikutUjianList = await prisma.trIkutUjian.findMany({
      where: {
        id_user: userId
      }
    });

    const ikutMap = Object.fromEntries(ikutUjianList.map(i => [i.id_tes, i]));

    // Fetch mapel and guru names
    const gurus = await prisma.guru.findMany();
    const mapels = await prisma.mapel.findMany();
    const guruMap = Object.fromEntries(gurus.map(g => [g.id, g.nama]));
    const mapelMap = Object.fromEntries(mapels.map(m => [m.id, m.nama]));

    const now = new Date();

    const result = tesList.map(tes => {
      const ikut = ikutMap[tes.id];
      
      let status = "belum";
      
      if (ikut) {
        if (ikut.status === "Y") {
          status = "selesai";
        } else {
          status = "sedang_mengerjakan";
        }
      } else {
        // Not yet participated. Check if active.
        if (now >= new Date(tes.tgl_mulai) && now <= new Date(tes.terlambat)) {
          status = "tersedia";
        } else if (now < new Date(tes.tgl_mulai)) {
          status = "belum_mulai";
        } else {
          status = "terlewat";
        }
      }

      return {
        ...tes,
        nama_guru: guruMap[tes.id_guru] || "Unknown",
        nama_mapel: mapelMap[tes.id_mapel] || "Unknown",
        status: status,
        id_ikut_ujian: ikut ? ikut.id : null
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("API jadwal-ujian-siswa error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

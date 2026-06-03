import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "siswa") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const kon_id = parseInt(session.user.kon_id);

    // Get the student details
    const siswa = await prisma.siswa.findUnique({
      where: { id: kon_id }
    });

    if (!siswa) {
      return NextResponse.json({ error: "Siswa not found" }, { status: 404 });
    }

    // Get the specific test
    const tes = await prisma.trGuruTes.findUnique({
      where: { id: parseInt(id) }
    });

    if (!tes) {
      return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
    }

    // Verify it belongs to the student's class
    if (tes.kelas !== siswa.jurusan || tes.jurusan !== siswa.id_jurusan) {
      return NextResponse.json({ error: "Akses ditolak. Ujian ini bukan untuk kelas Anda." }, { status: 403 });
    }

    // Verify time
    const now = new Date();
    if (now < new Date(tes.tgl_mulai) || now > new Date(tes.terlambat)) {
      return NextResponse.json({ error: "Ujian sedang tidak aktif." }, { status: 403 });
    }

    // Fetch mapel and guru names
    const guru = await prisma.guru.findUnique({ where: { id: tes.id_guru } });
    const mapel = await prisma.mapel.findUnique({ where: { id: tes.id_mapel } });

    return NextResponse.json({
      tes: {
        ...tes,
        nama_guru: guru?.nama || "Unknown",
        nama_mapel: mapel?.nama || "Unknown"
      },
      siswa: {
        nama: siswa.nama,
        nim: siswa.nim,
        kelas: siswa.jurusan, // using the mapped schema
        jurusan: siswa.id_jurusan
      }
    });
  } catch (error) {
    console.error("API konfirmasi ujian error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

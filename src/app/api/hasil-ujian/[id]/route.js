import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "siswa") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tesId = parseInt(id);

    // Fetch the exam
    const tes = await prisma.trGuruTes.findUnique({
      where: { id: tesId }
    });

    if (!tes) {
      return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
    }

    // Authorization check
    if (session.user.role === "guru" && tes.id_guru !== parseInt(session.user.kon_id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch Mapel & Guru
    const mapel = await prisma.mapel.findUnique({ where: { id: tes.id_mapel } });
    const guru = await prisma.guru.findUnique({ where: { id: tes.id_guru } });

    // Fetch Participants
    const participantsRaw = await prisma.trIkutUjian.findMany({
      where: { id_tes: tesId },
      orderBy: { nilai: "desc" }
    });

    // Get Admin IDs
    const adminIds = participantsRaw.map(p => p.id_user);
    const admins = await prisma.admin.findMany({
      where: { id: { in: adminIds } }
    });

    // Get Siswa kon_ids
    const konIds = admins.map(a => a.kon_id).filter(Boolean);
    const siswas = await prisma.siswa.findMany({
      where: { id: { in: konIds } }
    });

    // Merge participant data
    const participants = participantsRaw.map(p => {
      const admin = admins.find(a => a.id === p.id_user);
      const siswa = admin ? siswas.find(s => s.id === admin.kon_id) : null;
      
      return {
        id_ikut_ujian: p.id,
        id_user: p.id_user,
        nama: siswa?.nama || admin?.nama || "Unknown",
        nim: siswa?.nim || "-",
        kelas: siswa?.jurusan || "-",
        tgl_mulai: p.tgl_mulai,
        tgl_selesai: p.tgl_selesai,
        status: p.status,
        jml_benar: p.jml_benar,
        nilai: p.nilai,
        nilai_bobot: p.nilai_bobot
      };
    });

    return NextResponse.json({
      tes: {
        ...tes,
        nama_mapel: mapel?.nama || "Unknown",
        nama_guru: guru?.nama || "Unknown"
      },
      participants
    });

  } catch (error) {
    console.error("API hasil-ujian detail error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

// Additional Methods for Reset & Paksa Selesai
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "siswa") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, id_ikut_ujian } = body;

    if (!id_ikut_ujian || !action) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // Verify ownership
    const ikut = await prisma.trIkutUjian.findUnique({
      where: { id: parseInt(id_ikut_ujian) }
    });
    if (!ikut) return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 404 });

    const tes = await prisma.trGuruTes.findUnique({
      where: { id: ikut.id_tes }
    });

    if (session.user.role === "guru" && tes.id_guru !== parseInt(session.user.kon_id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "reset") {
      // Reset Ujian: Delete the participant's record
      await prisma.trIkutUjian.delete({
        where: { id: parseInt(id_ikut_ujian) }
      });
      return NextResponse.json({ success: true, message: "Ujian berhasil direset" });
    } 
    
    if (action === "paksa_selesai") {
      if (ikut.status === "Y") {
        return NextResponse.json({ error: "Ujian sudah selesai" }, { status: 400 });
      }

      // Re-calculate Score
      let jawaban = {};
      let soalIds = [];
      try {
        jawaban = JSON.parse(ikut.list_jawaban || "{}");
        soalIds = JSON.parse(ikut.list_soal || "[]");
      } catch (e) {}

      const kunciSoal = await prisma.soal.findMany({
        where: { id: { in: soalIds } },
        select: { id: true, jawaban: true, bobot: true }
      });

      let jml_benar = 0;
      let total_bobot = 0;
      let bobot_didapat = 0;

      for (const kunci of kunciSoal) {
        const weight = kunci.bobot > 0 ? parseFloat(kunci.bobot) : 1;
        total_bobot += weight;
        const userAns = jawaban[kunci.id];
        if (userAns && userAns.toUpperCase() === kunci.jawaban.toUpperCase()) {
          jml_benar++;
          bobot_didapat += weight;
        }
      }

      const nilaiAkhir = total_bobot > 0 ? (bobot_didapat / total_bobot) * 100 : 0;

      await prisma.trIkutUjian.update({
        where: { id: parseInt(id_ikut_ujian) },
        data: {
          jml_benar: jml_benar,
          nilai: nilaiAkhir,
          nilai_bobot: bobot_didapat,
          status: "Y"
        }
      });
      return NextResponse.json({ success: true, message: "Ujian dipaksa selesai" });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
  } catch (error) {
    console.error("API hasil-ujian action error:", error);
    return NextResponse.json({ error: "Gagal memproses aksi" }, { status: 500 });
  }
}

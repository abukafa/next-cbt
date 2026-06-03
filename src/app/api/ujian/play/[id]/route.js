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

    const userId = parseInt(session.user.id);
    const ikutId = parseInt(id);

    // Get ikut_ujian
    const ikut = await prisma.trIkutUjian.findUnique({
      where: { id: ikutId }
    });

    if (!ikut || ikut.id_user !== userId) {
      return NextResponse.json({ error: "Data tidak ditemukan atau akses ditolak" }, { status: 404 });
    }

    // Get the exam details
    const tes = await prisma.trGuruTes.findUnique({
      where: { id: ikut.id_tes }
    });

    const mapel = await prisma.mapel.findUnique({
      where: { id: tes.id_mapel }
    });

    // Parse list_soal
    let soalIds = [];
    try {
      soalIds = JSON.parse(ikut.list_soal);
    } catch (e) {
      return NextResponse.json({ error: "Format soal rusak" }, { status: 500 });
    }

    // Parse list_jawaban
    let jawaban = {};
    try {
      jawaban = JSON.parse(ikut.list_jawaban || "{}");
    } catch (e) {
      // ignore
    }

    // Fetch the questions from m_soal
    // We only fetch the necessary columns for the student (no kunci jawaban)
    const questionsRaw = await prisma.soal.findMany({
      where: { id: { in: soalIds } },
      select: {
        id: true,
        soal: true,
        opsi_a: true,
        opsi_b: true,
        opsi_c: true,
        opsi_d: true,
        opsi_e: true,
        file: true,
        tipe_file: true
      }
    });

    // Reorder questions to match list_soal sequence
    const questions = soalIds.map(sid => questionsRaw.find(q => q.id === sid)).filter(Boolean);

    return NextResponse.json({
      tes: {
        nama_ujian: tes.nama_ujian,
        nama_mapel: mapel?.nama || "Unknown",
        tgl_selesai: ikut.tgl_selesai, // Server time when it ends
      },
      status: ikut.status,
      questions,
      jawaban
    });

  } catch (error) {
    console.error("API ujian play GET error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "siswa") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const ikutId = parseInt(id);
    const body = await request.json();
    const { jawaban } = body; // expect { "102": "A", "105": "C" }

    const ikut = await prisma.trIkutUjian.findUnique({
      where: { id: ikutId }
    });

    if (!ikut || ikut.id_user !== userId) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    if (ikut.status === "Y") {
      return NextResponse.json({ error: "Ujian sudah selesai" }, { status: 403 });
    }

    // Verify time is not up yet (with a 2-minute grace period for network latency)
    const now = new Date();
    const graceTime = new Date(ikut.tgl_selesai.getTime() + 2 * 60000);
    if (now > graceTime) {
      return NextResponse.json({ error: "Waktu ujian telah habis!" }, { status: 403 });
    }

    // Update the answer
    await prisma.trIkutUjian.update({
      where: { id: ikutId },
      data: {
        list_jawaban: JSON.stringify(jawaban)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API ujian play PUT error:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "siswa") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const ikutId = parseInt(id);

    const ikut = await prisma.trIkutUjian.findUnique({
      where: { id: ikutId }
    });

    if (!ikut || ikut.id_user !== userId) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    if (ikut.status === "Y") {
      return NextResponse.json({ success: true, message: "Sudah selesai sebelumnya" });
    }

    // Parse list_jawaban and list_soal
    let jawaban = {};
    let soalIds = [];
    try {
      jawaban = JSON.parse(ikut.list_jawaban || "{}");
      soalIds = JSON.parse(ikut.list_soal || "[]");
    } catch (e) {}

    // Fetch the correct answers from m_soal
    const kunciSoal = await prisma.soal.findMany({
      where: { id: { in: soalIds } },
      select: {
        id: true,
        jawaban: true, // "A", "B", etc.
        bobot: true
      }
    });

    // Calculate score
    let jml_benar = 0;
    let total_bobot = 0;
    let bobot_didapat = 0;

    for (const kunci of kunciSoal) {
      // For legacy DB, let's assume default bobot is 1 if 0
      const weight = kunci.bobot > 0 ? parseFloat(kunci.bobot) : 1;
      total_bobot += weight;

      const userAns = jawaban[kunci.id];
      if (userAns && userAns.toUpperCase() === kunci.jawaban.toUpperCase()) {
        jml_benar++;
        bobot_didapat += weight;
      }
    }

    // Simple percentage score 0-100
    const nilaiAkhir = total_bobot > 0 ? (bobot_didapat / total_bobot) * 100 : 0;

    // Update to Selesai
    await prisma.trIkutUjian.update({
      where: { id: ikutId },
      data: {
        jml_benar: jml_benar,
        nilai: nilaiAkhir,
        nilai_bobot: bobot_didapat,
        status: "Y"
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API ujian play POST error:", error);
    return NextResponse.json({ error: "Failed to submit exam" }, { status: 500 });
  }
}

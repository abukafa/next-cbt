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

    // In legacy CBT, id_user in tr_ikut_ujian for students is m_siswa.id (kon_id)
    const userId = parseInt(session.user.kon_id);
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
    if (ikut.list_soal) {
      if (ikut.list_soal.trim().startsWith("[")) {
        try { soalIds = JSON.parse(ikut.list_soal); } catch(e){}
      } else {
        soalIds = ikut.list_soal.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      }
    }

    // Parse list_jawaban
    let jawaban = {};
    if (ikut.list_jawaban) {
      if (ikut.list_jawaban.trim().startsWith("{")) {
        try { jawaban = JSON.parse(ikut.list_jawaban); } catch(e){}
      } else {
        const pairs = ikut.list_jawaban.split(",");
        for (const p of pairs) {
          const parts = p.split(":");
          if (parts.length >= 2) {
            jawaban[parts[0]] = parts[1];
          }
        }
      }
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

    // In legacy CBT, id_user in tr_ikut_ujian for students is m_siswa.id (kon_id)
    const userId = parseInt(session.user.kon_id);
    const ikutId = parseInt(id);
    const body = await request.json();
    const { jawaban } = body; // expect { "102": "A", "105": "C" }

    const ikut = await prisma.trIkutUjian.findUnique({
      where: { id: ikutId }
    });

    if (!ikut || ikut.id_user !== userId) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    if (ikut.status === "N") {
      return NextResponse.json({ error: "Ujian sudah selesai" }, { status: 403 });
    }

    // Verify time is not up yet (with a 2-minute grace period for network latency)
    const now = new Date();
    const graceTime = new Date(ikut.tgl_selesai.getTime() + 2 * 60000);
    if (now > graceTime) {
      return NextResponse.json({ error: "Waktu ujian telah habis!" }, { status: 403 });
    }

    // Get the current list_soal to preserve order and structure
    let soalIds = [];
    if (ikut.list_soal) {
      if (ikut.list_soal.trim().startsWith("[")) {
        try { soalIds = JSON.parse(ikut.list_soal); } catch(e){}
      } else {
        soalIds = ikut.list_soal.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      }
    }

    // Convert the jawaban object back to the legacy string format
    // Legacy format: "id_soal:jawaban:ragu_flag,..."
    const legacyJawaban = soalIds.map(id => {
      const ans = jawaban[id] || "";
      return `${id}:${ans}:N`;
    }).join(",");

    // Update the answer
    await prisma.trIkutUjian.update({
      where: { id: ikutId },
      data: {
        list_jawaban: legacyJawaban
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

    // In legacy CBT, id_user in tr_ikut_ujian for students is m_siswa.id (kon_id)
    const userId = parseInt(session.user.kon_id);
    const ikutId = parseInt(id);

    const ikut = await prisma.trIkutUjian.findUnique({
      where: { id: ikutId }
    });

    if (!ikut || ikut.id_user !== userId) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    if (ikut.status === "N") {
      return NextResponse.json({ success: true, message: "Sudah selesai sebelumnya" });
    }

    // Parse list_jawaban and list_soal
    let jawaban = {};
    let soalIds = [];
    
    if (ikut.list_soal) {
      if (ikut.list_soal.trim().startsWith("[")) {
        try { soalIds = JSON.parse(ikut.list_soal); } catch(e){}
      } else {
        soalIds = ikut.list_soal.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      }
    }

    if (ikut.list_jawaban) {
      if (ikut.list_jawaban.trim().startsWith("{")) {
        try { jawaban = JSON.parse(ikut.list_jawaban); } catch(e){}
      } else {
        const pairs = ikut.list_jawaban.split(",");
        for (const p of pairs) {
          const parts = p.split(":");
          if (parts.length >= 2) {
            jawaban[parts[0]] = parts[1];
          }
        }
      }
    }

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
        status: "N" // Legacy CBT 'N' means FINISHED
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API ujian play POST error:", error);
    return NextResponse.json({ error: "Failed to submit exam" }, { status: 500 });
  }
}

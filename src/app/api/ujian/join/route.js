import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "siswa") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In legacy CBT, id_user for students in tr_ikut_ujian is their kon_id (m_siswa.id)
    const kon_id = parseInt(session.user.kon_id);
    const userId = kon_id; // Using kon_id as id_user for students
    const body = await request.json();
    const { id_tes, token } = body;

    if (!id_tes || !token) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 1. Get the student details
    const siswa = await prisma.siswa.findUnique({
      where: { id: kon_id }
    });

    if (!siswa) {
      return NextResponse.json({ error: "Siswa not found" }, { status: 404 });
    }

    // 2. Find the exam (tr_guru_tes)
    const tes = await prisma.trGuruTes.findUnique({
      where: { id: id_tes }
    });

    if (!tes) {
      return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
    }

    // 3. Validate Token
    if (tes.token.toUpperCase() !== token.toUpperCase()) {
      return NextResponse.json({ error: "Token Ujian Salah!" }, { status: 400 });
    }

    // 4. Validate Target Kelas & Jurusan
    if (tes.kelas !== siswa.jurusan || tes.jurusan !== siswa.id_jurusan) {
      return NextResponse.json({ error: "Akses ditolak. Ujian ini bukan untuk kelas Anda." }, { status: 403 });
    }

    // 5. Validate Time
    const now = new Date();
    if (now < new Date(tes.tgl_mulai) || now > new Date(tes.terlambat)) {
      return NextResponse.json({ error: "Ujian sedang tidak aktif." }, { status: 403 });
    }

    // 6. Check if student already joined
    const existing = await prisma.trIkutUjian.findFirst({
      where: {
        id_tes: id_tes,
        id_user: userId
      }
    });

    if (existing) {
      // In legacy CBT: 'N' means FINISHED, 'Y' means TAKING EXAM
      if (existing.status === "N") {
        return NextResponse.json({ error: "Anda sudah menyelesaikan ujian ini." }, { status: 403 });
      }
      
      // If currently taking it, just return the id
      return NextResponse.json({ 
        success: true, 
        id_ikut_ujian: existing.id,
        message: "Melanjutkan ujian..."
      });
    }

    // 7. Initialize NEW Exam (Get questions)
    // Filter questions by id_guru, id_mapel, kelas, jurusan (?)
    // Actually, in CBT, usually Soal is filtered by id_guru and id_mapel.
    // Let's get the questions
    // Resolve id_kelas
    const kelasRecord = await prisma.kelas.findFirst({
      where: { kelas: tes.kelas }
    });

    if (!kelasRecord) {
      return NextResponse.json({ error: "Kelas ujian tidak terdaftar di sistem" }, { status: 400 });
    }

    const allSoal = await prisma.soal.findMany({
      where: {
        id_guru: tes.id_guru,
        id_mapel: tes.id_mapel,
        id_kelas: kelasRecord.id,
        bobot: { gt: 0 } // Exclude questions with bobot 0
      },
      select: { id: true }
    });

    if (allSoal.length === 0) {
      return NextResponse.json({ error: "Belum ada soal untuk ujian ini. Hubungi Guru Anda." }, { status: 400 });
    }

    // Shuffle and pick limit according to jumlah_soal
    let shuffledSoal = allSoal.sort(() => 0.5 - Math.random());
    if (tes.jenis === "acak") {
       // already shuffled
    } else {
       // if not acak, sort by ID asc
       shuffledSoal = allSoal.sort((a, b) => a.id - b.id);
    }
    
    // Take only the required number of questions
    const selectedSoal = shuffledSoal.slice(0, tes.jumlah_soal).map(s => s.id);
    
    // Convert to legacy string format for list_soal
    const list_soal_str = selectedSoal.join(",");
    // list_jawaban initialized as "id::N,id::N" (Empty answer, Not ragu)
    const list_jawaban_str = selectedSoal.map(id => `${id}::N`).join(",");

    // 8. Create the record in tr_ikut_ujian
    const newIkutUjian = await prisma.trIkutUjian.create({
      data: {
        id_tes: id_tes,
        id_user: userId,
        list_soal: list_soal_str,
        list_jawaban: list_jawaban_str,
        jml_benar: 0,
        nilai: 0,
        nilai_bobot: 0,
        tgl_mulai: now,
        // Calculate tgl_selesai based on tgl_mulai + waktu (minutes)
        tgl_selesai: new Date(now.getTime() + tes.waktu * 60000), 
        status: "Y" // In legacy CBT: 'Y' means TAKING EXAM, 'N' means FINISHED
      }
    });

    return NextResponse.json({ 
      success: true, 
      id_ikut_ujian: newIkutUjian.id,
      message: "Ujian dimulai!"
    });

  } catch (error) {
    console.error("API ujian join error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal" }, { status: 500 });
  }
}

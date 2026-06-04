import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const userId = role === "siswa" ? parseInt(session.user.kon_id) : parseInt(session.user.id);
    const now = new Date();

    let data = {};

    // ========================================================
    // STATUS UJIAN SECTION (Applicable for both Admin & Siswa)
    // ========================================================

    // 1. Pie Chart: tr_ikut_ujian -> count per status where tgl_mulai < now() and tgl_mulai >= 1 week ago
    // 2. Bar Chart: tr_ikut_ujian -> count per id_test where tgl_mulai < now() and tgl_mulai >= 1 week ago
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const ikutUjianWhere =
      role === "siswa"
        ? { id_user: userId, tgl_mulai: { lt: now, gte: oneWeekAgo } }
        : { tgl_mulai: { lt: now, gte: oneWeekAgo } };

    const ikutUjianStatusRaw = await prisma.trIkutUjian.groupBy({
      by: ["status"],
      where: ikutUjianWhere,
      _count: { _all: true },
    });

    const chart_status_ujian = ikutUjianStatusRaw.map((item) => ({
      name: item.status === "Y" ? "Selesai" : "Mengerjakan",
      value: item._count._all,
    }));

    const ikutUjianTestRaw = await prisma.trIkutUjian.groupBy({
      by: ["id_tes"],
      where: ikutUjianWhere,
      _count: { _all: true },
    });

    // Map id_tes to nama_ujian
    const testIds = ikutUjianTestRaw.map((t) => t.id_tes);
    const testDetails = await prisma.trGuruTes.findMany({
      where: { id: { in: testIds } },
      select: { id: true, nama_ujian: true, id_mapel: true, kelas: true },
    });

    // We need mapel for the chart labels and the table
    const allMapels = await prisma.mapel.findMany();
    const mapelMap = Object.fromEntries(allMapels.map((m) => [m.id, m.nama]));

    const chart_ujian_test = ikutUjianTestRaw.map((item) => {
      const tes = testDetails.find((t) => t.id === item.id_tes);
      const mapelName = tes ? mapelMap[tes.id_mapel] || "Unknown" : "";
      
      return {
        name: tes ? `${mapelName} (${tes.kelas})` : `Ujian ${item.id_tes}`,
        Peserta: item._count._all,
      };
    });

    // 3. Tabel: jadwal ujian -> tr_guru_tes (Currently Active Exams)
    let jadwalWhere = {};
    if (role === "siswa") {
      const siswaData = await prisma.siswa.findUnique({ where: { id: userId } });
      if (siswaData) {
        jadwalWhere.kelas = siswaData.jurusan;
        jadwalWhere.jurusan = siswaData.id_jurusan;
      }
    }

    const tabel_jadwal_raw = await prisma.trGuruTes.findMany({
      where: {
        ...jadwalWhere,
        terlambat: { gte: oneWeekAgo },
      },
      orderBy: { tgl_mulai: "asc" },
    });

    // Mapel already fetched above

    const tabel_jadwal = tabel_jadwal_raw.map((j) => ({
      ...j,
      nama_mapel: mapelMap[j.id_mapel] || "Unknown",
    }));

    data.status_ujian = {
      chart_status_ujian,
      chart_ujian_test,
      tabel_jadwal,
    };

    // ========================================================
    // ADMIN/GURU ONLY SECTION
    // ========================================================
    if (role !== "siswa") {
      // Card 1: Total Guru (Distinct Nama)
      const distinctGuru = await prisma.guru.findMany({
        select: { nama: true },
        distinct: ["nama"],
      });
      const total_guru = distinctGuru.length;

      // Card 2: Total Siswa (Count)
      const total_siswa = await prisma.siswa.count();

      // Card 3: Total Mapel (Distinct left(nama,0,len(nama)-5))
      // Because Prisma doesn't have substring aggregation, we do it in JS
      const allMapelsForCard = await prisma.mapel.findMany({
        select: { nama: true },
      });
      const uniqueBaseMapels = new Set(
        allMapelsForCard.map((m) => {
          let n = m.nama.trim();
          if (n.length > 5) {
            return n.substring(0, n.length - 5).trim();
          }
          return n;
        }),
      );
      const total_mapel = uniqueBaseMapels.size;

      // Row 2 - Bar Chart: Guru Mapel count per guru
      const guruMapelRaw = await prisma.trGuruMapel.groupBy({
        by: ["id_guru"],
        _count: { _all: true },
      });
      const guruIds = guruMapelRaw.map((g) => g.id_guru);
      const guruDetails = await prisma.guru.findMany({
        where: { id: { in: guruIds } },
        select: { id: true, nama: true },
      });
      const chart_guru_mapel = guruMapelRaw.map((item) => {
        const guru = guruDetails.find((g) => g.id === item.id_guru);
        // Shorten name for chart if too long
        let shortName = guru ? guru.nama.split(" ")[0] : `Guru ${item.id_guru}`;
        return {
          name: shortName,
          Mapel: item._count._all,
        };
      });

      // Row 2 - Pie Chart: Siswa count per jurusan
      const siswaJurusanRaw = await prisma.siswa.groupBy({
        by: ["jurusan"],
        _count: { _all: true },
      });
      const chart_siswa_jurusan = siswaJurusanRaw.map((item) => ({
        name: item.jurusan || "Unknown",
        value: item._count._all,
      }));

      // Row 3 - Bar Chart: Bank Soal count per mapel
      const bankSoalRaw = await prisma.soal.groupBy({
        by: ["id_mapel"],
        _count: { _all: true },
      });
      const chart_bank_soal = bankSoalRaw.map((item) => {
        const mapel = mapelMap[item.id_mapel];
        return {
          name: mapel || `Mapel ${item.id_mapel}`,
          Soal: item._count._all,
        };
      });

      data.admin_stats = {
        total_guru,
        total_siswa,
        total_mapel,
        chart_guru_mapel,
        chart_siswa_jurusan,
        chart_bank_soal,
      };
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const whereClause = {};
    
    if (session?.user?.role === "guru" && session?.user?.kon_id) {
      whereClause.id_guru = parseInt(session.user.kon_id);
    }
    const soal = await prisma.soal.findMany({
      where: whereClause,
      orderBy: { id: "desc" },
      select: {
        id: true,
        id_guru: true,
        id_mapel: true,
        id_kelas: true,
        bobot: true,
        tipe_file: true,
        soal: true,
        jawaban: true,
        // Omit opsi_a, opsi_b, opsi_c, opsi_d, opsi_e to save massive payload
      }
    });

    // We can also strip the HTML of `soal` directly on the server to save even more bytes
    // so the client doesn't download the massive HTML/Base64 strings if present.
    const strippedSoal = soal.map(s => {
      let plainText = s.soal.replace(/<[^>]+>/g, "").trim();
      return {
        ...s,
        soal: plainText.length > 80 ? plainText.substring(0, 80) + "..." : plainText
      };
    });
    
    // Fetch lookup tables
    const gurus = await prisma.guru.findMany();
    const mapels = await prisma.mapel.findMany();
    const kelas = await prisma.kelas.findMany();

    const guruMap = Object.fromEntries(gurus.map(g => [g.id, g.nama]));
    const mapelMap = Object.fromEntries(mapels.map(m => [m.id, m.nama]));
    const kelasMap = Object.fromEntries(kelas.map(k => [k.id, k.kelas]));

    const data = strippedSoal.map(s => ({
      ...s,
      nama_guru: guruMap[s.id_guru] || "Unknown",
      nama_mapel: mapelMap[s.id_mapel] || "Unknown",
      nama_kelas: kelasMap[s.id_kelas] || "Unknown"
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch data", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const data = await prisma.soal.create({
      data: {
        id_guru: parseInt(body.id_guru) || 0,
        id_mapel: parseInt(body.id_mapel) || 0,
        id_kelas: parseInt(body.id_kelas) || 0,
        bobot: body.bobot !== undefined && body.bobot !== "" ? parseInt(body.bobot) : 1,
        file: body.file || "",
        tipe_file: body.tipe_file || "",
        soal: body.soal || "",
        opsi_a: body.opsi_a || "",
        opsi_b: body.opsi_b || "",
        opsi_c: body.opsi_c || "",
        opsi_d: body.opsi_d || "",
        opsi_e: body.opsi_e || "",
        jawaban: body.jawaban || "A",
        tgl_input: new Date(),
        jml_benar: 0,
        jml_salah: 0,
      },
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create data" },
      { status: 500 }
    );
  }
}

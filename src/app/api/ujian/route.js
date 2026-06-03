import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper function to generate a 5-character random token
const generateToken = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 5; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

export async function GET() {
  try {
    const data = await prisma.trGuruTes.findMany({
      orderBy: { id: "desc" },
    });
    
    // Fetch lookups
    const gurus = await prisma.guru.findMany();
    const mapels = await prisma.mapel.findMany();

    const guruMap = Object.fromEntries(gurus.map(g => [g.id, g.nama]));
    const mapelMap = Object.fromEntries(mapels.map(m => [m.id, m.nama]));

    const enrichedData = data.map(d => ({
      ...d,
      nama_guru: guruMap[d.id_guru] || "Unknown",
      nama_mapel: mapelMap[d.id_mapel] || "Unknown",
    }));

    return NextResponse.json(enrichedData);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const token = generateToken();
    
    // Validate required fields
    if (!body.id_guru || !body.id_mapel || !body.tgl_mulai || !body.terlambat) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const data = await prisma.trGuruTes.create({
      data: {
        id_guru: parseInt(body.id_guru),
        id_mapel: parseInt(body.id_mapel),
        nama_ujian: body.nama_ujian || "Ujian",
        jumlah_soal: parseInt(body.jumlah_soal) || 50,
        kelas: body.kelas || "",
        jurusan: body.jurusan || "",
        waktu: parseInt(body.waktu) || 120,
        jenis: body.jenis || "acak",
        detil_jenis: body.detil_jenis || "",
        tgl_mulai: new Date(body.tgl_mulai),
        terlambat: new Date(body.terlambat),
        token: token,
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

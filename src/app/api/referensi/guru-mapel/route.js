import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const gurus = await prisma.guru.findMany({
      orderBy: { nama: "asc" }
    });
    const mapels = await prisma.mapel.findMany();
    const relations = await prisma.trGuruMapel.findMany();

    const soalGroups = await prisma.soal.groupBy({
      by: ['id_guru', 'id_mapel'],
    });
    const tesGroups = await prisma.trGuruTes.groupBy({
      by: ['id_guru', 'id_mapel'],
    });

    // Mapel lookup for quick access
    const mapelMap = mapels.reduce((acc, m) => {
      acc[m.id] = m.nama;
      return acc;
    }, {});

    // Format the response
    const data = gurus.map((guru) => {
      const resmiMapelIds = new Set(relations.filter(r => r.id_guru === guru.id).map(r => r.id_mapel));
      const soalMapelIds = soalGroups.filter(s => s.id_guru === guru.id).map(s => s.id_mapel);
      const tesMapelIds = tesGroups.filter(t => t.id_guru === guru.id).map(t => t.id_mapel);
      
      const allMapelIds = new Set([...resmiMapelIds, ...soalMapelIds, ...tesMapelIds]);

      const guruMapels = Array.from(allMapelIds).map((id_mapel) => ({
        id_mapel: id_mapel,
        nama_mapel: mapelMap[id_mapel] || "Unknown",
        is_siluman: !resmiMapelIds.has(id_mapel),
      }));

      // Sort: Resmi first, then Siluman, then alphabetical
      guruMapels.sort((a, b) => {
        if (a.is_siluman === b.is_siluman) {
          return a.nama_mapel.localeCompare(b.nama_mapel);
        }
        return a.is_siluman ? 1 : -1;
      });

      return {
        id_guru: guru.id,
        nip: guru.nip,
        nama_guru: guru.nama,
        mapels: guruMapels,
      };
    });

    const dataStr = JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    );
    return new NextResponse(dataStr, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching referensi guru-mapel:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { id_guru, mapel_ids } = body;

    if (!id_guru) {
      return NextResponse.json(
        { error: "ID Guru is required" },
        { status: 400 }
      );
    }

    // Use transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing relations for this guru
      await tx.trGuruMapel.deleteMany({
        where: { id_guru: parseInt(id_guru) },
      });

      // 2. Insert new relations if any are provided
      if (mapel_ids && mapel_ids.length > 0) {
        const dataToInsert = mapel_ids.map((id_mapel) => ({
          id_guru: parseInt(id_guru),
          id_mapel: parseInt(id_mapel),
        }));
        await tx.trGuruMapel.createMany({
          data: dataToInsert,
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating guru-mapel:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const { id_guru, id_mapel, kelas } = await request.json();

    if (!id_guru || !id_mapel || !kelas || kelas === "") {
      return NextResponse.json({ count: 0 });
    }

    const kelasRecord = await prisma.kelas.findFirst({
      where: { kelas: kelas }
    });

    if (!kelasRecord) {
      return NextResponse.json({ count: 0 });
    }

    const count = await prisma.soal.count({
      where: {
        id_guru: parseInt(id_guru),
        id_mapel: parseInt(id_mapel),
        id_kelas: kelasRecord.id,
        bobot: { gt: 0 }
      }
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error checking soal count:", error);
    return NextResponse.json({ count: 0 });
  }
}

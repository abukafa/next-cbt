import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const data = await prisma.siswa.findMany({
      orderBy: { id: "desc" },
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const data = await prisma.siswa.create({
      data: {
        nama: body.nama,
        nim: body.nis, // UI menggunakan 'nis', DB menggunakan 'nim'
        jurusan: body.kelas, // Di DB lama, 'jurusan' menyimpan nama kelas (contoh: 'VII')
        id_jurusan: body.jurusan, // Di DB lama, 'id_jurusan' menyimpan nama jurusan (contoh: 'Umum')
      },
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create data" },
      { status: 500 }
    );
  }
}

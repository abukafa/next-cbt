import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const students = await prisma.siswa.findMany({
      orderBy: { nama: "asc" },
    });

    const studentUsers = await prisma.admin.findMany({
      where: { level: "siswa" },
      select: { kon_id: true, username: true },
    });

    // Create a set of kon_id for fast lookup
    const userMap = new Map(studentUsers.map(u => [u.kon_id, u.username]));

    const result = students.map(s => ({
      ...s,
      hasUser: userMap.has(s.id),
      username: userMap.get(s.id) || null
    }));

    return NextResponse.json(result);
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

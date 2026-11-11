import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = Number(session?.user?.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.admin.findUnique({
      where: { id: userId },
      select: {
        username: true,
        level: true,
        kon_id: true,
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const role = account.level;
    let detail = null;

    if (role === "guru") {
      const guru = await prisma.guru.findUnique({
        where: { id: account.kon_id },
      });
      detail = guru
        ? { nama: guru.nama, nip: guru.nip }
        : null;
    }

    if (role === "siswa") {
      const siswa = await prisma.siswa.findUnique({
        where: { id: account.kon_id },
      });
      detail = siswa
        ? {
            nama: siswa.nama,
            nim: siswa.nim,
            kelas: siswa.jurusan,
            jurusan: siswa.id_jurusan,
          }
        : null;
    }

    if (role !== "admin" && role !== "guru" && role !== "siswa") {
      return NextResponse.json({ error: "Role not recognized" }, { status: 400 });
    }

    return NextResponse.json({
      role,
      username: account.username,
      detail,
    });
  } catch (error) {
    console.error("Profile API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

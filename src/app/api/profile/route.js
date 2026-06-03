import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const kon_id = parseInt(session.user.kon_id);

    if (role === "admin" || !kon_id) {
      return NextResponse.json({ 
        role: "admin", 
        info: "Administrator Account",
        detail: null
      });
    }

    if (role === "guru") {
      const guru = await prisma.guru.findUnique({
        where: { id: kon_id },
      });
      return NextResponse.json({ role: "guru", detail: guru });
    }

    if (role === "siswa") {
      const siswa = await prisma.siswa.findUnique({
        where: { id: kon_id },
        include: {
          kelas: true,
          jurusan: true,
        },
      });
      return NextResponse.json({ role: "siswa", detail: siswa });
    }

    return NextResponse.json({ error: "Role not recognized" }, { status: 400 });
  } catch (error) {
    console.error("Profile API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    let whereClause = {};

    if (session?.user?.role === "guru" && session?.user?.kon_id) {
      const guruMapels = await prisma.trGuruMapel.findMany({
        where: { id_guru: parseInt(session.user.kon_id) },
      });
      const mapelIds = guruMapels.map(gm => gm.id_mapel);
      
      whereClause = {
        id: { in: mapelIds }
      };
    }

    const data = await prisma.mapel.findMany({
      where: whereClause,
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
    const data = await prisma.mapel.create({
      data: {
        nama: body.nama,
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

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const whereClause = {};

    if (session?.user?.role === "guru" && session?.user?.kon_id) {
      whereClause.id = parseInt(session.user.kon_id);
    }

    const gurus = await prisma.guru.findMany({
      where: whereClause,
      orderBy: { nama: "asc" },
    });

    const guruUsers = await prisma.admin.findMany({
      where: { level: "guru" },
      select: { kon_id: true, username: true },
    });

    // Create a set of kon_id for fast lookup
    const userMap = new Map(guruUsers.map(u => [u.kon_id, u.username]));

    const result = gurus.map(g => ({
      ...g,
      hasUser: userMap.has(g.id),
      username: userMap.get(g.id) || null
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
    const data = await prisma.guru.create({
      data: {
        nama: body.nama,
        nip: body.nip,
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

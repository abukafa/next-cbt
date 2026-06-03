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

    const data = await prisma.guru.findMany({
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

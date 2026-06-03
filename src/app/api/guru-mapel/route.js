import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const guruMapel = await prisma.trGuruMapel.findMany();
    return NextResponse.json(guruMapel);
  } catch (error) {
    console.error("Error fetching guru-mapel:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    // Only admin can perform ownership transfer
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id_guru_lama, id_guru_baru, id_mapel } = body;

    if (!id_guru_lama || !id_guru_baru || !id_mapel) {
      return NextResponse.json(
        { error: "Parameter tidak lengkap" },
        { status: 400 }
      );
    }

    if (id_guru_lama === id_guru_baru) {
      return NextResponse.json(
        { error: "Guru lama dan guru baru tidak boleh sama" },
        { status: 400 }
      );
    }

    // Verify both gurus exist
    const [guruLama, guruBaru] = await Promise.all([
      prisma.guru.findUnique({ where: { id: parseInt(id_guru_lama) } }),
      prisma.guru.findUnique({ where: { id: parseInt(id_guru_baru) } })
    ]);

    if (!guruLama || !guruBaru) {
      return NextResponse.json(
        { error: "Data guru tidak ditemukan" },
        { status: 404 }
      );
    }

    // Perform the transfer within a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Transfer Soal Ownership
      await tx.soal.updateMany({
        where: { 
          id_guru: parseInt(id_guru_lama),
          id_mapel: parseInt(id_mapel)
        },
        data: { id_guru: parseInt(id_guru_baru) },
      });

      // 2. Transfer Ujian Ownership
      await tx.trGuruTes.updateMany({
        where: { 
          id_guru: parseInt(id_guru_lama),
          id_mapel: parseInt(id_mapel)
        },
        data: { id_guru: parseInt(id_guru_baru) },
      });

      // 3. Transfer Mapel Assignment
      const isNewTeaching = await tx.trGuruMapel.findFirst({
        where: {
          id_guru: parseInt(id_guru_baru),
          id_mapel: parseInt(id_mapel)
        }
      });
      if (!isNewTeaching) {
        await tx.trGuruMapel.create({
          data: {
            id_guru: parseInt(id_guru_baru),
            id_mapel: parseInt(id_mapel)
          }
        });
      }

      // 4. Delete Mapel assignment for the old guru to clean up
      await tx.trGuruMapel.deleteMany({
        where: { 
          id_guru: parseInt(id_guru_lama),
          id_mapel: parseInt(id_mapel)
        },
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: `Semua data ${guruLama.nama} berhasil dipindahkan ke ${guruBaru.nama}`
    });

  } catch (error) {
    console.error("Error during guru data transfer:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

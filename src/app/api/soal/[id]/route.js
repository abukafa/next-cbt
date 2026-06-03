import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const data = await prisma.soal.findUnique({
      where: { id: parseInt(id) },
    });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Fetch existing Soal
    const existingSoal = await prisma.soal.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingSoal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // SECURITY CHECK: Is this used in an active exam with participants?
    const relatedExams = await prisma.trGuruTes.findMany({
      where: { id_guru: existingSoal.id_guru, id_mapel: existingSoal.id_mapel },
      select: { id: true }
    });

    if (relatedExams.length > 0) {
      const examIds = relatedExams.map(e => e.id);
      const participantsCount = await prisma.trIkutUjian.count({
        where: { id_tes: { in: examIds } }
      });

      if (participantsCount > 0) {
        return NextResponse.json(
          { error: "Tidak bisa diubah karena soal ini terikat pada ujian yang sedang atau sudah dikerjakan." }, 
          { status: 403 }
        );
      }
    }

    const data = await prisma.soal.update({
      where: { id: parseInt(id) },
      data: {
        id_guru: parseInt(body.id_guru),
        id_mapel: parseInt(body.id_mapel),
        id_kelas: parseInt(body.id_kelas),
        bobot: body.bobot !== undefined && body.bobot !== "" ? parseInt(body.bobot) : 1,
        soal: body.soal,
        opsi_a: body.opsi_a,
        opsi_b: body.opsi_b,
        opsi_c: body.opsi_c,
        opsi_d: body.opsi_d,
        opsi_e: body.opsi_e,
        jawaban: body.jawaban,
      },
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update data" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingSoal = await prisma.soal.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingSoal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Only allow updating bobot for now
    if (body.bobot === undefined) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const data = await prisma.soal.update({
      where: { id: parseInt(id) },
      data: {
        bobot: parseInt(body.bobot)
      },
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    // Fetch existing Soal
    const existingSoal = await prisma.soal.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingSoal) return NextResponse.json({ success: true }); // Already deleted

    // SECURITY CHECK: Is this used in an active exam with participants?
    const relatedExams = await prisma.trGuruTes.findMany({
      where: { id_guru: existingSoal.id_guru, id_mapel: existingSoal.id_mapel },
      select: { id: true }
    });

    if (relatedExams.length > 0) {
      const examIds = relatedExams.map(e => e.id);
      const participantsCount = await prisma.trIkutUjian.count({
        where: { id_tes: { in: examIds } }
      });

      if (participantsCount > 0) {
        return NextResponse.json(
          { error: "Tidak bisa dihapus karena soal ini terikat pada ujian yang sedang atau sudah dikerjakan." }, 
          { status: 403 }
        );
      }
    }

    await prisma.soal.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete data" },
      { status: 500 }
    );
  }
}

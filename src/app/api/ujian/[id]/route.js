import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Check if this is a partial update for ONLY the token
    const isOnlyTokenUpdate = body.token && Object.keys(body).length === 1;
    let updateData = {};

    // SECURITY CHECK: If exam has participants, block full update
    if (!isOnlyTokenUpdate) {
      const participantsCount = await prisma.trIkutUjian.count({
        where: { id_tes: parseInt(id) }
      });
      
      if (participantsCount > 0) {
        return NextResponse.json(
          { error: "Tidak bisa diubah karena ujian sedang atau sudah dikerjakan siswa." }, 
          { status: 403 }
        );
      }

      // Full update: Check if required fields exist before parsing
      if (!body.id_guru || !body.id_mapel || !body.tgl_mulai || !body.terlambat) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      updateData = {
        id_guru: parseInt(body.id_guru),
        id_mapel: parseInt(body.id_mapel),
        nama_ujian: body.nama_ujian || "Ujian",
        jumlah_soal: parseInt(body.jumlah_soal) || 50,
        kelas: body.kelas || "",
        jurusan: body.jurusan || "",
        waktu: parseInt(body.waktu) || 120,
        jenis: body.jenis || "acak",
        detil_jenis: body.detil_jenis || "",
        tgl_mulai: new Date(body.tgl_mulai),
        terlambat: new Date(body.terlambat),
      };

      if (body.token) {
        updateData.token = body.token;
      }
    }

    const data = await prisma.trGuruTes.update({
      where: { id: parseInt(id) },
      data: updateData,
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

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    // SECURITY CHECK: If exam has participants, block delete
    const participantsCount = await prisma.trIkutUjian.count({
      where: { id_tes: parseInt(id) }
    });
    
    if (participantsCount > 0) {
      return NextResponse.json(
        { error: "Tidak bisa dihapus karena ujian sedang atau sudah dikerjakan siswa." }, 
        { status: 403 }
      );
    }

    await prisma.trGuruTes.delete({
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

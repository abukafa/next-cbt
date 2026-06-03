import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Expect body: { id_guru: 1, id_mapel: 2, id_kelas: 3, data: [ { soal: 'A', opsi_a: 'B', ... } ] }
    const { id_guru, id_mapel, id_kelas, data } = body;

    if (!id_guru || !id_mapel || !id_kelas || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "Data referensi atau file excel tidak valid" }, { status: 400 });
    }

    let successCount = 0;
    let failCount = 0;

    for (const row of data) {
      if (!row.soal) {
        failCount++;
        continue;
      }

      try {
        await prisma.soal.create({
          data: {
            id_guru: parseInt(id_guru),
            id_mapel: parseInt(id_mapel),
            id_kelas: parseInt(id_kelas),
            bobot: parseInt(row.bobot) || 10,
            file: "",
            tipe_file: "",
            soal: row.soal?.toString() || "",
            opsi_a: row.opsi_a?.toString() || "",
            opsi_b: row.opsi_b?.toString() || "",
            opsi_c: row.opsi_c?.toString() || "",
            opsi_d: row.opsi_d?.toString() || "",
            opsi_e: row.opsi_e?.toString() || "",
            jawaban: String(row.jawaban || "A").trim().toUpperCase(),
            bobot: row.bobot !== undefined && row.bobot !== "" ? parseInt(row.bobot) : 1,
            tgl_input: new Date(),
            jml_benar: 0,
            jml_salah: 0,
          }
        });

        successCount++;
      } catch (err) {
        console.error("Error inserting soal:", err);
        failCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil import ${successCount} soal. Gagal: ${failCount} soal.` 
    });

  } catch (error) {
    console.error("Soal import API error:", error);
    return NextResponse.json({ error: "Failed to import soal" }, { status: 500 });
  }
}

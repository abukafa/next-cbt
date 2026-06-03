import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request) {
  try {
    const body = await request.json();
    // Expect body to be an array of objects
    // [ { nim: '123', nama: 'John', jurusan: 'MIPA', id_jurusan: 'IPA' }, ... ]

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ error: "Data kosong atau format salah" }, { status: 400 });
    }

    // Process in a transaction if possible, or sequentially
    let successCount = 0;
    let failCount = 0;

    for (const row of body) {
      if (!row.nim || !row.nama) {
        failCount++;
        continue;
      }

      try {
        // Create Siswa
        const newSiswa = await prisma.siswa.create({
          data: {
            nim: row.nim.toString(),
            nama: row.nama.toString(),
            jurusan: row.jurusan?.toString() || "",
            id_jurusan: row.id_jurusan?.toString() || "",
          }
        });

        // Create Admin (login credentials)
        // Legacy CBT: Password is md5 of the NIM by default
        const md5Password = crypto.createHash('md5').update(row.nim.toString()).digest('hex');

        await prisma.admin.create({
          data: {
            username: row.nim.toString(),
            password: md5Password,
            level: "siswa",
            kon_id: newSiswa.id
          }
        });

        successCount++;
      } catch (err) {
        console.error("Error inserting row:", row, err);
        failCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil import ${successCount} data. Gagal: ${failCount} data.` 
    });

  } catch (error) {
    console.error("Siswa import API error:", error);
    return NextResponse.json({ error: "Failed to import data" }, { status: 500 });
  }
}

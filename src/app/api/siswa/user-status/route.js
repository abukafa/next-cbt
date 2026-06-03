import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, siswaId, targetState } = body;

    if (action === "toggle_single") {
      const siswa = await prisma.siswa.findUnique({ where: { id: siswaId } });
      if (!siswa) {
        return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
      }

      const existingUser = await prisma.admin.findFirst({
        where: { kon_id: siswa.id, level: "siswa" }
      });

      if (existingUser) {
        // Delete user
        await prisma.admin.delete({ where: { id: existingUser.id } });
        return NextResponse.json({ success: true, hasUser: false });
      } else {
        // Create user
        const passwordMd5 = crypto.createHash("md5").update(siswa.nim).digest("hex");
        await prisma.admin.create({
          data: {
            username: siswa.nim,
            password: passwordMd5,
            level: "siswa",
            kon_id: siswa.id
          }
        });
        return NextResponse.json({ success: true, hasUser: true });
      }
    } 
    
    if (action === "toggle_all") {
      
      if (targetState === false) {
        // Deactivate all (delete all users with level 'siswa')
        await prisma.admin.deleteMany({
          where: { level: "siswa" }
        });
        return NextResponse.json({ success: true, action: "deactivated_all" });
      } else {
        // Activate all
        // Find all siswa that don't have a user
        const allSiswa = await prisma.siswa.findMany();
        const existingUsers = await prisma.admin.findMany({
          where: { level: "siswa" },
          select: { kon_id: true }
        });
        
        const existingKonIds = new Set(existingUsers.map(u => u.kon_id));
        const newUsersData = [];

        for (const siswa of allSiswa) {
          if (!existingKonIds.has(siswa.id)) {
            const passwordMd5 = crypto.createHash("md5").update(siswa.nim).digest("hex");
            newUsersData.push({
              username: siswa.nim,
              password: passwordMd5,
              level: "siswa",
              kon_id: siswa.id
            });
          }
        }

        if (newUsersData.length > 0) {
          await prisma.admin.createMany({
            data: newUsersData
          });
        }
        
        return NextResponse.json({ success: true, action: "activated_all", count: newUsersData.length });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("API user-status POST error:", error);
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    );
  }
}

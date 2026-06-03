import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, guruId, targetState } = body;

    if (action === "toggle_single") {
      const guru = await prisma.guru.findUnique({ where: { id: guruId } });
      if (!guru) {
        return NextResponse.json({ error: "Guru tidak ditemukan" }, { status: 404 });
      }

      const existingUser = await prisma.admin.findFirst({
        where: { kon_id: guru.id, level: "guru" }
      });

      if (existingUser) {
        // Delete user
        await prisma.admin.delete({ where: { id: existingUser.id } });
        return NextResponse.json({ success: true, hasUser: false });
      } else {
        // Create user
        const passwordMd5 = crypto.createHash("md5").update(guru.nip).digest("hex");
        await prisma.admin.create({
          data: {
            username: guru.nip,
            password: passwordMd5,
            level: "guru",
            kon_id: guru.id
          }
        });
        return NextResponse.json({ success: true, hasUser: true });
      }
    } 
    
    if (action === "toggle_all") {
      if (targetState === false) {
        // Deactivate all (delete all users with level 'guru')
        await prisma.admin.deleteMany({
          where: { level: "guru" }
        });
        return NextResponse.json({ success: true, action: "deactivated_all" });
      } else {
        // Activate all
        // Find all guru that don't have a user
        const allGuru = await prisma.guru.findMany();
        const existingUsers = await prisma.admin.findMany({
          where: { level: "guru" },
          select: { kon_id: true }
        });
        
        const existingKonIds = new Set(existingUsers.map(u => u.kon_id));
        const newUsersData = [];

        for (const guru of allGuru) {
          if (!existingKonIds.has(guru.id)) {
            const passwordMd5 = crypto.createHash("md5").update(guru.nip).digest("hex");
            newUsersData.push({
              username: guru.nip,
              password: passwordMd5,
              level: "guru",
              kon_id: guru.id
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

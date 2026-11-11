import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = Number(session?.user?.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      newPassword.length < 8 ||
      Buffer.byteLength(newPassword, "utf8") > 72
    ) {
      return NextResponse.json(
        { error: "Password baru harus berisi minimal 8 karakter dan maksimal 72 byte." },
        { status: 400 },
      );
    }

    const user = await prisma.admin.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });
    }

    const isBcryptHash = /^\$2[aby]\$/.test(user.password);
    const isCurrentPasswordValid = isBcryptHash
      ? await bcrypt.compare(currentPassword, user.password)
      : crypto
          .createHash("md5")
          .update(currentPassword)
          .digest("hex")
          .toLowerCase() === user.password.toLowerCase();

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Password saat ini tidak sesuai." },
        { status: 400 },
      );
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await prisma.admin.update({
      where: { id: userId },
      data: { password: newHash },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password API error:", error);
    return NextResponse.json(
      { error: "Gagal mengganti password." },
      { status: 500 },
    );
  }
}

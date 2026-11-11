import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role;
    const isApiRequest = path.startsWith("/api/");

    if (isApiRequest) {
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (role !== "admin" && role !== "guru" && role !== "siswa") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const method = req.method;
      const isRead = method === "GET" || method === "HEAD";
      const isStudentExamApi =
        path.startsWith("/api/ujian/play/") ||
        path === "/api/ujian/join" ||
        path === "/api/jadwal-ujian-siswa" ||
        path.startsWith("/api/jadwal-ujian-siswa/") ||
        path === "/api/profile" ||
        path.startsWith("/api/profile/");

      if (role === "siswa" && !isStudentExamApi && path !== "/api/dashboard") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (
        role === "guru" &&
        (path.startsWith("/api/siswa") ||
          path.startsWith("/api/kelas") ||
          path.startsWith("/api/jurusan"))
      ) {
        if (!isRead || path.startsWith("/api/siswa")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }

      if (
        role === "guru" &&
        (path.startsWith("/api/cetak-kartu") ||
          path.startsWith("/api/referensi"))
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (
        role === "guru" &&
        (path.startsWith("/api/guru") ||
          path.startsWith("/api/mapel") ||
          path.startsWith("/api/soal") ||
          path.startsWith("/api/ujian")) &&
        !isRead &&
        (path.startsWith("/api/guru") || path.startsWith("/api/mapel"))
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.next();
    }

    if (role === "siswa") {
      const canAccessStudentPage =
        path === "/dashboard" ||
        path === "/dashboard/profile" ||
        path.startsWith("/dashboard/jadwal-ujian") ||
        path.startsWith("/ujian/");
      if (canAccessStudentPage) return NextResponse.next();
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (role === "guru") {
      if (path.startsWith("/dashboard/jadwal-ujian")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      if (
        path.startsWith("/dashboard/siswa") ||
        path.startsWith("/dashboard/guru") ||
        path.startsWith("/dashboard/referensi") ||
        path.startsWith("/dashboard/cetak-kartu")
      ) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    if (role !== "admin" && role !== "guru" && role !== "siswa") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) =>
        !!token || req.nextUrl.pathname.startsWith("/api/"),
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/ujian/:path*",
    "/api/dashboard",
    "/api/dashboard/:path*",
    "/api/siswa",
    "/api/siswa/:path*",
    "/api/guru",
    "/api/guru/:path*",
    "/api/guru-mapel",
    "/api/guru-mapel/:path*",
    "/api/kelas",
    "/api/kelas/:path*",
    "/api/jurusan",
    "/api/jurusan/:path*",
    "/api/mapel",
    "/api/mapel/:path*",
    "/api/soal",
    "/api/soal/:path*",
    "/api/ujian",
    "/api/ujian/:path*",
    "/api/jadwal-ujian-siswa",
    "/api/jadwal-ujian-siswa/:path*",
    "/api/hasil-ujian",
    "/api/hasil-ujian/:path*",
    "/api/cetak-kartu",
    "/api/cetak-kartu/:path*",
    "/api/daftar-hadir",
    "/api/daftar-hadir/:path*",
    "/api/referensi/:path*",
    "/api/profile",
    "/api/profile/:path*",
  ],
};

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Check role-based access if needed
    if (path.startsWith("/dashboard/master-data") && token?.role !== "admin") {
       return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    // Guru should not access jadwal-ujian
    if (path.startsWith("/dashboard/jadwal-ujian") && token?.role === "guru") {
       return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Siswa should only access dashboard and jadwal-ujian
    if (token?.role === "siswa") {
       const allowedSiswaPaths = ["/dashboard", "/dashboard/jadwal-ujian"];
       if (path.startsWith("/dashboard") && !allowedSiswaPaths.includes(path)) {
           return NextResponse.redirect(new URL("/dashboard", req.url));
       }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/ujian/:path*",
  ],
};

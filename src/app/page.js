"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { useSession } from "next-auth/react";
import { GraduationCap } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <span className="text-white">
                <GraduationCap size={20} />
              </span>
            </div>
            <span className="text-lg font-bold text-gray-900">CBT System</span>
          </div>
          <div className="flex gap-4">
            {!isAuthenticated && (
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
            )}
            {isAuthenticated && (
              <Link href="/dashboard">
                <Button variant="primary" size="sm">
                  Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Computer Based Test System
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Platform ujian berbasis komputer yang modern dan mudah digunakan untuk
          mengelola seluruh proses pembelajaran dan evaluasi.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          {!isAuthenticated && (
            <>
              <Link href="/login">
                <Button variant="primary" size="lg">
                  Mulai Sekarang
                </Button>
              </Link>
              <Link href="https://wa.me/6289655176270" target="_blank">
                <Button variant="secondary" size="lg">
                  Konsultasi Gratis
                </Button>
              </Link>
            </>
          )}
          {isAuthenticated && (
            <>
              <Link href="/login">
                <Button variant="primary" size="lg">
                  Mulai Sekarang
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="secondary" size="lg">
                  Lihat Dashboard
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Manajemen Data",
              description:
                "Kelola data siswa, guru, kelas, dan mata pelajaran dengan mudah",
            },
            {
              title: "Ujian Digital",
              description:
                "Buat dan kelola ujian dengan berbagai tipe soal dan pengaturan",
            },
            {
              title: "Hasil Laporan",
              description:
                "Lihat hasil ujian, nilai, dan laporan lengkap untuk setiap siswa",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

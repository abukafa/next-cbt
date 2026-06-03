"use client";

import { useRouter } from "next/navigation";
import { CheckCircle, Home } from "lucide-react";

export default function UjianSelesaiPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} className="text-emerald-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ujian Selesai</h1>
        <p className="text-gray-600 mb-8">
          Terima kasih. Jawaban Anda telah berhasil disimpan ke dalam sistem. Anda dapat meninggalkan halaman ini.
        </p>
        
        <button
          onClick={() => router.push("/dashboard/jadwal-ujian")}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
        >
          <Home size={20} />
          Kembali ke Dashboard Siswa
        </button>
      </div>
    </div>
  );
}

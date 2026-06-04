"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import {
  Clock,
  BookOpen,
  User,
  Calendar,
  Play,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function JadwalUjianSiswaPage() {
  const [jadwal, setJadwal] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchJadwal();
  }, []);

  const fetchJadwal = async () => {
    try {
      const res = await fetch("/api/jadwal-ujian-siswa");
      if (res.ok) {
        const data = await res.json();
        setJadwal(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMulai = (id_tes, status, id_ikut_ujian) => {
    if (status === "tersedia") {
      router.push(`/dashboard/jadwal-ujian/konfirmasi/${id_tes}`);
    } else if (status === "sedang_mengerjakan" && id_ikut_ujian) {
      router.push(`/ujian/play/${id_ikut_ujian}`);
    }
  };

  const renderStatusButton = (tes) => {
    switch (tes.status) {
      case "tersedia":
        return (
          <button
            onClick={() => handleMulai(tes.id, tes.status)}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg transition-colors font-medium"
          >
            <Play size={18} />
            Ikuti Ujian
          </button>
        );
      case "sedang_mengerjakan":
        return (
          <button
            onClick={() => handleMulai(tes.id, tes.status, tes.id_ikut_ujian)}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-lg transition-colors font-medium"
          >
            <AlertCircle size={18} />
            Sedang Berlangsung
          </button>
        );
      case "selesai":
        return (
          <button
            disabled
            className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-100 text-gray-500 py-2 px-4 rounded-lg font-medium cursor-not-allowed"
          >
            <CheckCircle size={18} />
            Selesai
          </button>
        );
      case "belum_mulai":
        return (
          <button
            disabled
            className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-50 text-blue-500 py-2 px-4 rounded-lg font-medium cursor-not-allowed border border-blue-200"
          >
            <Clock size={18} />
            Belum Waktunya
          </button>
        );
      case "terlewat":
        return (
          <button
            disabled
            className="w-full mt-4 flex items-center justify-center gap-2 bg-red-50 text-red-500 py-2 px-4 rounded-lg font-medium cursor-not-allowed border border-red-200"
          >
            <AlertCircle size={18} />
            Terlewat
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jadwal Ujian</h1>
        <p className="text-gray-600">
          Daftar ujian yang ditugaskan untuk kelas Anda.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : jadwal.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Tidak ada ujian</h3>
          <p className="text-gray-500">
            Saat ini tidak ada jadwal ujian untuk kelas Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jadwal.map((tes) => (
            <div
              key={tes.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col"
            >
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2">
                  {tes.nama_ujian}
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <BookOpen size={16} className="text-emerald-500" />
                    <span>
                      {tes.nama_mapel.substring(0, tes.nama_mapel.length - 4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <User size={16} className="text-emerald-500" />
                    <span>{tes.nama_guru}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Clock size={16} className="text-emerald-500" />
                    <span>
                      {tes.waktu} Menit ({tes.jumlah_soal} Soal)
                    </span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <Calendar
                      size={16}
                      className="text-emerald-500 shrink-0 mt-0.5"
                    />
                    <div className="flex flex-col">
                      <span>
                        Mulai:{" "}
                        {new Date(tes.tgl_mulai).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                      <span>
                        Akhir:{" "}
                        {new Date(tes.terlambat).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-auto">
                {renderStatusButton(tes)}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

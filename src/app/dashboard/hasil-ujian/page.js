"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { BookOpen, User, Calendar, Users, Eye, Search } from "lucide-react";

export default function HasilUjianPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await fetch("/api/hasil-ujian");
      if (res.ok) {
        const data = await res.json();
        setExams(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = exams.filter(
    (tes) =>
      tes.nama_ujian.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tes.nama_mapel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tes.kelas.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hasil Ujian</h1>
          <p className="text-gray-600">
            Pantau progres dan hasil ujian siswa Anda.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Cari ujian, mapel, atau kelas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            Tidak ada data ujian
          </h3>
          <p className="text-gray-500">
            Anda belum membuat jadwal ujian apapun.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredExams.map((tes) => (
            <div
              key={tes.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h3
                    className="text-lg font-bold text-gray-900 line-clamp-2"
                    title={tes.nama_ujian}
                  >
                    {tes.nama_ujian}
                  </h3>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                      tes.jml_selesai > 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    Kls {tes.kelas}
                  </span>
                </div>

                <div className="space-y-2 mb-6">
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
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <Calendar
                      size={16}
                      className="text-emerald-500 shrink-0 mt-0.5"
                    />
                    <div className="flex flex-col">
                      <span>
                        {new Date(tes.tgl_mulai).toLocaleDateString("id-ID", {
                          dateStyle: "medium",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-auto">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500 font-medium">
                      Progress Peserta
                    </span>
                    <span className="text-emerald-600 font-bold">
                      {tes.jml_selesai} / {tes.jml_peserta}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{
                        width:
                          tes.jml_peserta > 0
                            ? `${(tes.jml_selesai / tes.jml_peserta) * 100}%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div
                className={`px-6 py-4 border-t ${tes.jml_selesai == 0 ? "border-gray-100 bg-gray-50" : "border-emerald-100 bg-emerald-50"}`}
              >
                <button
                  onClick={() =>
                    router.push(`/dashboard/hasil-ujian/${tes.id}`)
                  }
                  className={`w-full flex items-center justify-center gap-2 font-medium hover:text-emerald-700 transition-colors ${tes.jml_selesai == 0 ? "text-gray-600" : "text-emerald-600"}`}
                  disabled={tes.jml_selesai == 0}
                >
                  <Eye
                    size={18}
                    className={tes.jml_selesai == 0 ? "hidden" : ""}
                  />
                  {tes.jml_selesai == 0
                    ? "Belum ada Hasil"
                    : "Lihat Detail Hasil"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

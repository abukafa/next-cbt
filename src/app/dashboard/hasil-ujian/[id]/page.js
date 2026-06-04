"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import {
  ChevronLeft,
  BookOpen,
  Clock,
  Users,
  Trash2,
  CheckSquare,
  Search,
  RefreshCw,
  Printer,
} from "lucide-react";

export default function DetailHasilUjianPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [data, setData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/hasil-ujian/${id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.tes);
        setParticipants(json.participants);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, id_ikut_ujian, studentName) => {
    let confirmMsg = "";
    if (action === "reset") {
      confirmMsg = `Apakah Anda yakin ingin MERESET ujian atas nama ${studentName}? Semua jawaban mereka akan terhapus dan mereka harus mengulang dari awal.`;
    } else {
      confirmMsg = `Apakah Anda yakin ingin MEMAKSA SELESAI ujian atas nama ${studentName}? Sistem akan menghitung nilai dari jawaban yang sudah tersimpan sejauh ini.`;
    }

    if (!window.confirm(confirmMsg)) return;

    setProcessingId(id_ikut_ujian);
    try {
      const res = await fetch(`/api/hasil-ujian/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id_ikut_ujian }),
      });
      const result = await res.json();

      if (res.ok) {
        // Refresh data
        await fetchData();
      } else {
        alert(result.error || "Gagal memproses aksi");
      }
    } catch (err) {
      alert("Kesalahan koneksi");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredParticipants = participants.filter(
    (p) =>
      p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nim.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <button
            onClick={() => router.push("/dashboard/hasil-ujian")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 mb-2 transition-colors"
          >
            <ChevronLeft size={16} /> Kembali ke Daftar
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Detail Hasil Ujian
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Printer size={18} /> Cetak
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : !data ? (
        <div className="bg-white rounded-lg p-12 text-center shadow-sm">
          <p className="text-gray-500">Data ujian tidak ditemukan.</p>
        </div>
      ) : (
        <>
          {/* Exam Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 print:border-none print:p-0 print:mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {data.nama_ujian}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-6 print:gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <BookOpen size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">
                    Mata Pelajaran
                  </p>
                  <p className="font-semibold text-gray-900">
                    {data.nama_mapel.substring(0, data.nama_mapel.length - 4)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">
                    Kelas Ujian
                  </p>
                  <p className="font-semibold text-gray-900">{data.kelas}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckSquare size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">
                    Jml Soal
                  </p>
                  <p className="font-semibold text-gray-900">
                    {data.jumlah_soal} Butir
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">
                    Alokasi Waktu
                  </p>
                  <p className="font-semibold text-gray-900">
                    {data.waktu} Menit
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Participant Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:border-none print:shadow-none">
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between gap-4 items-center bg-gray-50 print:hidden">
              <h3 className="font-bold text-gray-900">
                Daftar Peserta ({participants.length})
              </h3>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Cari nama / NIS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
                <Search
                  className="absolute left-3 top-2 text-gray-400"
                  size={14}
                />
              </div>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left border-collapse print:text-xs">
                <thead>
                  <tr className="bg-white border-b border-gray-200 text-sm print:text-xs">
                    <th className="px-6 py-4 print:px-2 print:py-2 font-semibold text-gray-600">
                      No
                    </th>
                    <th className="px-6 py-4 print:px-2 print:py-2 font-semibold text-gray-600">
                      Peserta
                    </th>
                    <th className="px-6 py-4 print:px-2 print:py-2 font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="px-6 py-4 print:px-2 print:py-2 font-semibold text-gray-600">
                      Waktu Mulai
                    </th>
                    <th className="px-6 py-4 print:px-2 print:py-2 font-semibold text-gray-600 text-center">
                      Jml Benar
                    </th>
                    <th className="px-6 py-4 print:px-2 print:py-2 font-semibold text-gray-600 text-center">
                      Persentasi
                    </th>
                    <th className="px-6 py-4 print:px-2 print:py-2 font-semibold text-gray-600 text-center">
                      Nilai Akhir
                    </th>
                    <th className="px-6 py-4 print:hidden font-semibold text-gray-600 text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Tidak ada data peserta ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((p, idx) => (
                      <tr
                        key={p.id_ikut_ujian}
                        className="hover:bg-gray-50 transition-colors border-b border-gray-50 print:border-gray-200"
                      >
                        <td className="px-6 py-4 print:px-2 print:py-2 text-sm print:text-xs text-gray-500">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-4 print:px-2 print:py-2">
                          <div className="font-medium text-gray-900 print:whitespace-nowrap">
                            {p.nama}
                          </div>
                          <div className="text-xs text-gray-500">
                            {p.nim} • Kls {p.kelas}
                          </div>
                        </td>
                        <td className="px-6 py-4 print:px-2 print:py-2">
                          {p.status === "N" ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-100 print:bg-transparent text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full print:hidden"></span>{" "}
                              Selesai
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-amber-100 print:bg-transparent text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse print:hidden"></span>{" "}
                              Mengerjakan
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 print:px-2 print:py-2 text-sm print:text-xs text-gray-600">
                          {new Date(p.tgl_mulai).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          WIB
                        </td>
                        <td className="px-6 py-4 print:px-2 print:py-2 text-center font-medium text-gray-700">
                          {p.status === "N" ? p.jml_benar : "-"}
                        </td>
                        <td className="px-6 py-4 print:px-2 print:py-2 text-center font-bold text-lg print:text-sm">
                          {p.status === "N" ? (
                            <span
                              className={
                                p.nilai >= 70
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              }
                            >
                              {parseFloat(p.nilai).toFixed(0)}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 print:px-2 print:py-2 text-center font-bold text-lg print:text-sm">
                          {p.status === "N" ? (
                            <span className="text-emerald-600">
                              {parseFloat(p.nilai).toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right print:hidden">
                          <div className="flex items-center justify-end gap-2">
                            {p.status === "Y" && (
                              <button
                                onClick={() =>
                                  handleAction(
                                    "paksa_selesai",
                                    p.id_ikut_ujian,
                                    p.nama,
                                  )
                                }
                                disabled={processingId === p.id_ikut_ujian}
                                className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                                title="Paksa selesaikan ujian"
                              >
                                Paksa Selesai
                              </button>
                            )}
                            <button
                              onClick={() =>
                                handleAction("reset", p.id_ikut_ujian, p.nama)
                              }
                              disabled="yes"
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                              title="Reset ulang ujian peserta"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

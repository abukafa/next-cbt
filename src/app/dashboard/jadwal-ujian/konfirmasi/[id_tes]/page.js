"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { Clock, BookOpen, User, Key, AlertTriangle } from "lucide-react";

export default function KonfirmasiUjianPage({ params }) {
  const { id_tes } = use(params);
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id_tes]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/jadwal-ujian-siswa/${id_tes}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        setError(json.error || "Gagal mengambil data");
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  const handleMulai = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Silakan masukkan token ujian!");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/ujian/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_tes: parseInt(id_tes),
          token: token.toUpperCase(),
        }),
      });

      const result = await res.json();

      if (res.ok && result.id_ikut_ujian) {
        // Berhasil gabung/memulai ujian
        router.push(`/ujian/play/${result.id_ikut_ujian}`);
      } else {
        alert(result.error || "Token salah atau terjadi kesalahan");
        setSubmitting(false);
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 text-red-600 p-6 rounded-lg border border-red-200">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle /> Error
          </h2>
          <p>{error}</p>
          <button
            onClick={() => router.push("/dashboard/jadwal-ujian")}
            className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
          >
            Kembali
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Konfirmasi Data Ujian
        </h1>
        <p className="text-gray-600">
          Periksa kembali data Anda sebelum memulai ujian.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Data Siswa */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-emerald-500 px-6 py-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <User size={20} /> Data Peserta
            </h2>
          </div>
          <div className="p-6">
            <table className="w-full text-left border-collapse">
              <tbody>
                <tr className="border-b border-gray-100">
                  <th className="py-3 text-gray-500 font-medium w-1/3">
                    NIM / NIS
                  </th>
                  <td className="py-3 font-semibold text-gray-900">
                    {data.siswa.nim}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th className="py-3 text-gray-500 font-medium w-1/3">
                    Nama Lengkap
                  </th>
                  <td className="py-3 font-semibold text-gray-900">
                    {data.siswa.nama}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th className="py-3 text-gray-500 font-medium w-1/3">
                    Kelas
                  </th>
                  <td className="py-3 font-semibold text-gray-900">
                    {data.siswa.kelas}
                  </td>
                </tr>
                <tr>
                  <th className="py-3 text-gray-500 font-medium w-1/3">
                    Jurusan
                  </th>
                  <td className="py-3 font-semibold text-gray-900">
                    {data.siswa.jurusan}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Kanan: Data Ujian & Input Token */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="bg-blue-600 px-6 py-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen size={20} /> Detail Ujian
            </h2>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <table className="w-full text-left border-collapse mb-6">
              <tbody>
                <tr className="border-b border-gray-100">
                  <th className="py-3 text-gray-500 font-medium w-1/3">
                    Mata Pelajaran
                  </th>
                  <td className="py-3 font-semibold text-gray-900">
                    {data.tes.nama_mapel.substring(
                      0,
                      data.tes.nama_mapel.length - 4,
                    )}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th className="py-3 text-gray-500 font-medium w-1/3">
                    Nama Ujian
                  </th>
                  <td className="py-3 font-semibold text-gray-900">
                    {data.tes.nama_ujian}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th className="py-3 text-gray-500 font-medium w-1/3">
                    Guru Pengampu
                  </th>
                  <td className="py-3 font-semibold text-gray-900">
                    {data.tes.nama_guru}
                  </td>
                </tr>
                <tr>
                  <th className="py-3 text-gray-500 font-medium w-1/3">
                    Alokasi Waktu
                  </th>
                  <td className="py-3 font-semibold text-gray-900 flex items-center gap-1">
                    <Clock size={16} className="text-emerald-500" />{" "}
                    {data.tes.waktu} Menit
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Input Token Form */}
            <form
              onSubmit={handleMulai}
              className="mt-auto bg-gray-50 p-6 rounded-lg border border-gray-200"
            >
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Key size={16} /> TOKEN UJIAN
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  placeholder="MASUKKAN TOKEN"
                  className="w-full text-center text-3xl font-bold tracking-widest uppercase p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  disabled={submitting}
                />
                <p className="text-xs text-gray-500 text-center mt-2">
                  Minta token ujian kepada guru pengawas Anda.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 rounded-lg text-white font-bold text-lg flex justify-center items-center gap-2 transition-colors ${
                  submitting
                    ? "bg-emerald-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg"
                }`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Memproses...
                  </>
                ) : (
                  "MULAI UJIAN"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

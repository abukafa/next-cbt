"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { DashboardLayout } from "@/components/layout";
import { Printer, Filter, Settings2, FileText } from "lucide-react";
import { calculateInterpolatedScore } from "@/lib/scoring";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function DaftarHadirPage() {
  const { data: optionsData, isLoading: loadingOpts } = useSWR("/api/daftar-hadir", fetcher);
  const exams = optionsData?.exams || [];

  const [selectedExamId, setSelectedExamId] = useState("");
  const [examDetail, setExamDetail] = useState(null);

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Customization State
  const [customNamaUjian, setCustomNamaUjian] = useState(
    "PENILAIAN AKHIR SEMESTER",
  );
  const [customSekolah, setCustomSekolah] = useState("SMP TERPADU BUGELAN");
  const [customTahun, setCustomTahun] = useState("Tahun Ajaran 2025/2026");
  const [showNilai, setShowNilai] = useState(false);
  const [showKehadiran, setShowKehadiran] = useState(true);
  const [logoBase64, setLogoBase64] = useState(null);

  useEffect(() => {
    // Load logo from local storage
    const savedLogo = localStorage.getItem("cbt_logo");
    if (savedLogo) {
      setLogoBase64(savedLogo);
    }
  }, []);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setLogoBase64(base64String);
        localStorage.setItem("cbt_logo", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoBase64(null);
    localStorage.removeItem("cbt_logo");
  };

  // Options fetching handled by SWR

  const handleFetchAttendance = async (e) => {
    e.preventDefault();
    if (!selectedExamId) return;

    setLoadingStudents(true);
    try {
      const res = await fetch(`/api/daftar-hadir?id_tes=${selectedExamId}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setExamDetail(data.tes);
      }
    } catch (error) {
      console.error(error);
      alert("Gagal memuat data daftar hadir");
    } finally {
      setLoadingStudents(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTodayDate = () => {
    return new Date().toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate stats for score interpolation
  const hadirStudents = students.filter((s) => s.hadir && s.nilai !== null);
  const scores = hadirStudents.map((s) => parseFloat(s.nilai) || 0);
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const maxScore = scores.length > 0 ? 100 : 0;

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Cetak Daftar Hadir
          </h1>
          <p className="text-gray-600">
            Tampilkan daftar kehadiran peserta berdasarkan jadwal ujian.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          disabled={students.length === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          <Printer size={20} /> Cetak Daftar Hadir
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 print:hidden">
        {/* Filter Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4 border-b pb-2">
            <Filter size={18} className="text-emerald-500" /> Data Ujian
          </h2>
          <form onSubmit={handleFetchAttendance} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pilih Ujian
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"
                disabled={loadingOpts}
                required
              >
                <option value="">-- Pilih Jadwal Ujian --</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.nama_ujian} - {exam.kelas} - {exam.mapel_nama}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loadingStudents || !selectedExamId}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition-colors"
            >
              {loadingStudents ? "Memuat..." : "Tampilkan Daftar Hadir"}
            </button>
          </form>
        </div>

        {/* Customization Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4 border-b pb-2">
            <Settings2 size={18} className="text-emerald-500" /> Kustomisasi
            Tampilan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kop Ujian
              </label>
              <input
                type="text"
                value={customNamaUjian}
                onChange={(e) => setCustomNamaUjian(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Instansi / Sekolah
              </label>
              <input
                type="text"
                value={customSekolah}
                onChange={(e) => setCustomSekolah(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teks Sub-Header (Tahun Ajaran)
              </label>
              <input
                type="text"
                value={customTahun}
                onChange={(e) => setCustomTahun(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo Sekolah
              </label>
              {logoBase64 ? (
                <div className="flex items-center gap-3 border border-gray-300 rounded-lg p-2 bg-gray-50">
                  <img
                    src={logoBase64}
                    alt="Logo"
                    className="w-10 h-10 object-contain bg-white border border-gray-200"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700">
                      Logo Tersimpan
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 bg-red-50 rounded"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full border border-gray-300 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-emerald-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              )}
            </div>

            <div className="flex flex-col gap-2 mt-4 md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showKehadiran}
                  onChange={(e) => setShowKehadiran(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Tampilkan Kehadiran / Tanda Tangan.
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showNilai}
                  onChange={(e) => setShowNilai(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Tampilkan Kolom Nilai Peserta
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Print Preview Area */}
      {students && students.length > 0 && examDetail ? (
        <div className="print:m-0 print:p-0 bg-white p-8 rounded-xl border border-gray-200 shadow-sm print:border-none print:shadow-none">
          {/* Header */}
          <div className="flex items-center justify-center border-b-4 border-gray-900 pb-4 mb-6">
            {logoBase64 && (
              <div className="shrink-0 mr-6">
                <img
                  src={logoBase64}
                  alt="Logo"
                  className="w-24 h-24 object-contain"
                />
              </div>
            )}
            <div className="text-center">
              <h1 className="font-bold text-xl uppercase tracking-wide">
                {customNamaUjian}
              </h1>
              <h2 className="font-extrabold text-2xl uppercase tracking-wider my-1">
                {customSekolah}
              </h2>
              <h3 className="font-semibold text-md">{customTahun}</h3>
            </div>
          </div>

          <h4 className="text-center font-bold text-xl uppercase mb-6">
            Daftar Hadir Peserta
          </h4>

          {/* Sub Info */}
          <div className="flex justify-between text-sm mb-4">
            <div className="space-y-1">
              <p>
                <span className="font-semibold inline-block w-32">
                  Mata Pelajaran
                </span>
                : {examDetail.mapel_nama}
              </p>
              <p>
                <span className="font-semibold inline-block w-32">
                  Guru Mapel
                </span>
                : {examDetail.guru_nama}
              </p>
            </div>
            <div className="space-y-1">
              <p>
                <span className="font-semibold inline-block w-36">Kelas</span>:{" "}
                {examDetail.kelas} - {examDetail.jurusan}
              </p>
              <p>
                <span className="font-semibold inline-block w-36">
                  Tanggal Pelaksanaan
                </span>
                : {formatDate(examDetail.tgl_mulai)}
              </p>
            </div>
          </div>

          {/* Table */}
          <table className="w-full border-collapse border border-gray-900 text-sm">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-200">
                <th className="border border-gray-900 py-2 px-3 w-12 text-center">
                  No
                </th>
                <th className="border border-gray-900 py-2 px-3 w-32 text-center">
                  No. Peserta
                </th>
                <th className="border border-gray-900 py-2 px-3 text-left">
                  Nama Peserta
                </th>
                {showNilai && (
                  <th className="border border-gray-900 py-2 px-3 w-20 text-center">
                    Nilai
                  </th>
                )}
                <th className="border border-gray-900 py-2 px-3 w-40 text-center">
                  {showKehadiran ? "Kehadiran" : "Tanda Tangan"}
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((siswa, idx) => (
                <tr key={siswa.id}>
                  <td className="border border-gray-900 py-2 px-3 text-center">
                    {idx + 1}
                  </td>
                  <td className="border border-gray-900 py-2 px-3 text-center font-mono">
                    {siswa.nim}
                  </td>
                  <td className="border border-gray-900 py-2 px-3 uppercase">
                    {siswa.nama}
                  </td>
                  {showNilai && (
                    <td className="border border-gray-900 py-2 px-3 text-center font-semibold">
                      {siswa.nilai !== null
                        ? calculateInterpolatedScore(
                            siswa.nilai,
                            minScore,
                            maxScore,
                          ).toFixed(2)
                        : "-"}
                    </td>
                  )}
                  <td className="border border-gray-900 py-2 px-3 text-center">
                    {showKehadiran ? (
                      <span
                        className={
                          siswa.hadir
                            ? "font-bold text-emerald-700 print:text-black"
                            : "text-gray-500 print:text-gray-600 italic"
                        }
                      >
                        {siswa.hadir ? "Hadir" : "Tidak Hadir"}
                      </span>
                    ) : (
                      // Empty space for signature
                      <div
                        className={`h-8 flex items-center ${idx % 2 === 0 ? "justify-start ml-2" : "justify-center"}`}
                      >
                        <span className="text-xs text-gray-400 print:text-gray-500">
                          {idx + 1}.
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer Signature */}
          <div className="flex justify-end mt-12 print:mt-16 text-sm">
            <div className="text-center w-64">
              <p className="">....................., {getTodayDate()}</p>
              <p className="mb-16 font-semibold">Pengawas Ujian</p>
              <p className="font-semibold underline">_______________________</p>
              <p className="mt-1">NIP. ..................................</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm print:hidden">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <p>
            Pilih jadwal ujian untuk memunculkan pratinjau daftar hadir peserta.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}

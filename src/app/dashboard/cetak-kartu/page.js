"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout";
import { Printer, Filter, Settings2, User } from "lucide-react";

export default function CetakKartuPage() {
  const [loadingOpts, setLoadingOpts] = useState(true);
  const [kelasOptions, setKelasOptions] = useState([]);
  const [jurusanOptions, setJurusanOptions] = useState([]);

  const [filterKelas, setFilterKelas] = useState("");
  const [filterJurusan, setFilterJurusan] = useState("");

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Customization State
  const [customNamaUjian, setCustomNamaUjian] = useState(
    "PENILAIAN AKHIR SEMESTER",
  );
  const [customSekolah, setCustomSekolah] = useState("SMK NEGERI 1 CONTOH");
  const [customTahun, setCustomTahun] = useState("Tahun Ajaran 2025/2026");
  const [showPhoto, setShowPhoto] = useState(true);
  const [logoBase64, setLogoBase64] = useState(null);

  useEffect(() => {
    fetchOptions();
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

  const fetchOptions = async () => {
    try {
      const res = await fetch("/api/cetak-kartu");
      if (res.ok) {
        const data = await res.json();
        setKelasOptions(data.kelasOptions);
        setJurusanOptions(data.jurusanOptions);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingOpts(false);
    }
  };

  const handleFetchStudents = async (e) => {
    e.preventDefault();
    setLoadingStudents(true);
    try {
      const res = await fetch(
        `/api/cetak-kartu?kelas=${filterKelas}&jurusan=${filterJurusan}`,
      );
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
      }
    } catch (error) {
      console.error(error);
      alert("Gagal memuat data siswa");
    } finally {
      setLoadingStudents(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Cetak Kartu Ujian
          </h1>
          <p className="text-gray-600">
            Sesuaikan tampilan kartu dan cetak peserta berdasarkan kelas.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          disabled={students.length === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          <Printer size={20} /> Cetak Kartu
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 print:hidden">
        {/* Filter Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4 border-b pb-2">
            <Filter size={18} className="text-emerald-500" /> Filter Peserta
          </h2>
          <form onSubmit={handleFetchStudents} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kelas
              </label>
              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"
                disabled={loadingOpts}
              >
                <option value="">-- Semua Kelas --</option>
                {kelasOptions.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jurusan
              </label>
              <select
                value={filterJurusan}
                onChange={(e) => setFilterJurusan(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"
                disabled={loadingOpts}
              >
                {jurusanOptions.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loadingStudents}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition-colors"
            >
              {loadingStudents ? "Memuat..." : "Tampilkan Siswa"}
            </button>
          </form>
        </div>

        {/* Customization Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4 border-b pb-2">
            <Settings2 size={18} className="text-emerald-500" /> Kustomisasi
            Tampilan Kartu
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Ujian (Kop Kartu)
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
                Teks Sub-Header (Misal: Tahun Ajaran)
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
            <div className="flex items-center mt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPhoto}
                  onChange={(e) => setShowPhoto(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Tampilkan Bingkai Foto Siswa
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Print Preview Area */}
      {students.length > 0 ? (
        <div className="print:m-0 print:p-0">
          <h3 className="text-gray-500 text-sm font-bold mb-4 uppercase tracking-wider print:hidden">
            Pratinjau Kartu Ujian ({students.length} Peserta)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 print:gap-4 w-full max-w-5xl mx-auto print:max-w-none">
            {students.map((siswa) => (
              <div
                key={siswa.id}
                className="bg-white border-2 border-gray-900 rounded-lg overflow-hidden break-inside-avoid print:shadow-none shadow-sm"
              >
                {/* Card Header */}
                <div className="border-b-2 border-gray-900 p-3 print:p-2 bg-gray-50 print:bg-transparent flex items-center">
                  {logoBase64 && (
                    <div className="shrink-0 mr-3 print:mr-2">
                      <img
                        src={logoBase64}
                        alt="Logo"
                        className="w-14 h-14 print:w-12 print:h-12 object-contain"
                      />
                    </div>
                  )}
                  <div className="flex-1 text-center pr-10">
                    <h3 className="font-bold text-sm print:text-xs uppercase leading-tight">
                      {customNamaUjian}
                    </h3>
                    <h4 className="font-bold text-base print:text-sm uppercase leading-tight">
                      {customSekolah}
                    </h4>
                    <p className="text-xs print:text-[10px] mt-0.5">
                      {customTahun}
                    </p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 print:p-3 flex gap-4 print:gap-3">
                  {showPhoto && (
                    <div className="w-20 h-28 print:w-16 print:h-24 border-2 border-dashed border-gray-400 flex items-center justify-center shrink-0 bg-gray-50 print:border-solid print:border-gray-800">
                      <div className="text-center">
                        <User
                          size={24}
                          className="mx-auto text-gray-300 print:hidden"
                        />
                        <span className="text-[10px] print:text-[8px] text-gray-400 print:text-black">
                          Pas Foto
                          <br />
                          3x4
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex-1">
                    <table className="w-full text-sm print:text-xs">
                      <tbody>
                        <tr>
                          <td className="py-1 print:py-0.5 font-semibold w-24 print:w-20 align-top">
                            Nama Peserta
                          </td>
                          <td className="py-1 print:py-0.5 align-top w-4 print:w-2">
                            :
                          </td>
                          <td className="py-1 print:py-0.5 font-bold uppercase leading-tight">
                            {siswa.nama}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 print:py-0.5 font-semibold align-top">
                            No. Peserta
                          </td>
                          <td className="py-1 print:py-0.5 align-top">:</td>
                          <td className="py-1 print:py-0.5 font-mono tracking-wider">
                            {siswa.nim}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 print:py-0.5 font-semibold align-top">
                            Kls/Jrsn
                          </td>
                          <td className="py-1 print:py-0.5 align-top">:</td>
                          <td className="py-1 print:py-0.5">
                            {siswa.jurusan} - {siswa.id_jurusan}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="mt-3 pt-3 print:mt-2 print:pt-2 border-t border-dashed border-gray-300">
                      <table className="w-full text-sm print:text-xs">
                        <tbody>
                          <tr>
                            <td className="py-0.5 font-semibold text-emerald-700 print:text-black w-24 print:w-20">
                              Username
                            </td>
                            <td className="py-0.5 w-4 print:w-2">:</td>
                            <td className="py-0.5 font-bold font-mono text-base print:text-sm tracking-widest">
                              {siswa.username}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-0.5 font-semibold text-emerald-700 print:text-black">
                              Password
                            </td>
                            <td className="py-0.5">:</td>
                            <td className="py-0.5 text-xs print:text-[10px] italic text-gray-600 print:text-black">
                              Sama dengan Username
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm print:hidden">
          <Printer size={48} className="mx-auto text-gray-300 mb-4" />
          <p>Gunakan filter di atas untuk memunculkan pratinjau kartu ujian.</p>
        </div>
      )}
    </DashboardLayout>
  );
}

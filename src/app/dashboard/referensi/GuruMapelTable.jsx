"use client";

import { useState, useEffect } from "react";
import { DataTable, Button, Modal } from "@/components/ui";

export default function GuruMapelTable() {
  const [data, setData] = useState([]);
  const [allMapel, setAllMapel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedGuru, setSelectedGuru] = useState(null);
  const [selectedMapel, setSelectedMapel] = useState(null);
  const [checkedMapel, setCheckedMapel] = useState([]);
  const [targetGuruId, setTargetGuruId] = useState("");

  useEffect(() => {
    fetchData();
    fetchMapels();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/referensi/guru-mapel");
      const json = await res.json();
      if (Array.isArray(json)) {
        setData(json);
      } else {
        console.error("API returned error:", json);
        alert(`Gagal mengambil data: ${json.error || 'Unknown error'}`);
        setData([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMapels = async () => {
    try {
      const res = await fetch("/api/mapel");
      const json = await res.json();
      const sortedMapel = json.sort((a, b) => a.nama.localeCompare(b.nama));
      setAllMapel(sortedMapel);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = (item) => {
    setSelectedGuru(item);
    const mapelIds = item.mapels.map((m) => m.id_mapel);
    setCheckedMapel(mapelIds);
    setIsModalOpen(true);
  };

  const handleOpenTransferModal = (row, mapel) => {
    setSelectedGuru(row);
    setSelectedMapel(mapel);
    setTargetGuruId("");
    setIsTransferModalOpen(true);
  };

  const handleToggleMapel = (id_mapel) => {
    if (checkedMapel.includes(id_mapel)) {
      setCheckedMapel(checkedMapel.filter((id) => id !== id_mapel));
    } else {
      setCheckedMapel([...checkedMapel, id_mapel]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/referensi/guru-mapel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_guru: selectedGuru.id_guru,
          mapel_ids: checkedMapel,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert("Gagal menyimpan data");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!targetGuruId) {
      alert("Silakan pilih guru penerima");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/referensi/guru-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_guru_lama: selectedGuru.id_guru,
          id_guru_baru: targetGuruId,
          id_mapel: selectedMapel.id_mapel,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        alert(result.message || "Transfer berhasil");
        setIsTransferModalOpen(false);
        fetchData();
      } else {
        alert(result.error || "Gagal mentransfer data");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan");
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    {
      label: "Guru",
      key: "guru_info",
      width: "250px",
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.nama_guru}</div>
          <div className="text-xs text-gray-500">{row.nip}</div>
        </div>
      ),
    },
    {
      label: "Daftar Mata Pelajaran & Aksi",
      key: "mapels",
      render: (row) => {
        if (!row.mapels || row.mapels.length === 0) {
          return (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 italic text-sm">
                Belum ada mapel
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleOpenModal(row)}
              >
                Atur Mapel
              </Button>
            </div>
          );
        }
        return (
          <div className="flex flex-col gap-2 w-full">
            {[...row.mapels].map((m) => (
              <div
                key={m.id_mapel}
                className="flex justify-between items-center pb-2 border-b border-gray-100 last:border-0 last:pb-0"
              >
                <span
                  className={`text-sm font-medium ${m.is_siluman ? "text-red-600" : "text-emerald-700"}`}
                >
                  {m.nama_mapel}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleOpenTransferModal(row, m)}
                  >
                    Transfer
                  </Button>
                </div>
              </div>
            ))}
            <div className="pt-2 mt-1 flex justify-end">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleOpenModal(row)}
              >
                Atur Mapel
              </Button>
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">
          Pengampu Mata Pelajaran
        </h2>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={loading}
        // No add button, because Guru addition is managed in Master Data -> Guru
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Atur Mapel: ${selectedGuru?.nama_guru}`}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="text-sm text-gray-600 mb-2">
            Centang mata pelajaran yang diajarkan oleh guru ini:
          </div>

          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
            {allMapel.map((m) => {
              // Check if mapel is assigned to another teacher
              const isAssignedToOther = data.some(
                (g) => g.id_guru !== selectedGuru?.id_guru && g.mapels.some((gm) => gm.id_mapel === m.id && !gm.is_siluman)
              );

              return (
                <label
                  key={m.id}
                  className={`flex items-center gap-3 p-2 rounded transition-colors ${
                    isAssignedToOther ? "opacity-60 cursor-not-allowed bg-gray-100" : "hover:bg-gray-100 cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 disabled:bg-gray-200"
                    checked={checkedMapel.includes(m.id)}
                    onChange={() => handleToggleMapel(m.id)}
                    disabled={isAssignedToOther}
                  />
                  <span className={`text-sm font-medium ${isAssignedToOther ? "text-gray-500" : "text-gray-900"}`}>
                    {m.nama} {isAssignedToOther && <span className="text-xs font-normal text-red-500 ml-1">(Sudah ada pengampu)</span>}
                  </span>
                </label>
              );
            })}
            {allMapel.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-4">
                Belum ada data mata pelajaran.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => !isSaving && setIsTransferModalOpen(false)}
        title={`Transfer Data: ${selectedGuru?.nama_guru}`}
      >
        <form onSubmit={handleTransferSubmit} className="flex flex-col gap-4">
          <div className="text-sm text-gray-600 mb-2">
            Pindahkan semua kepemilikan Bank Soal & Riwayat Ujian untuk mata
            pelajaran{" "}
            <strong className="text-gray-900">
              {selectedMapel?.nama_mapel}
            </strong>{" "}
            milik{" "}
            <strong className="text-gray-900">{selectedGuru?.nama_guru}</strong>{" "}
            ke Guru lain. Hak akses mengajar guru ini untuk mapel tersebut juga
            akan dicabut secara otomatis.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pilih Guru Penerima:
            </label>
            <select
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={targetGuruId}
              onChange={(e) => setTargetGuruId(e.target.value)}
              required
            >
              <option value="">-- Pilih Guru --</option>
              {data
                .filter((g) => g.id_guru !== selectedGuru?.id_guru)
                .map((g) => (
                  <option key={g.id_guru} value={g.id_guru}>
                    {g.nama_guru} (NIP: {g.nip})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsTransferModalOpen(false)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button type="submit" variant="danger" disabled={isSaving}>
              {isSaving ? "Memproses..." : "Transfer Sekarang"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { DashboardLayout } from "@/components/layout";
import {
  DataTable,
  Button,
  Modal,
  Input,
  Select,
  ConfirmDialog,
} from "@/components/ui";
import * as XLSX from "xlsx";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function SiswaPage() {
  const { data: siswaData, error, isLoading, mutate } = useSWR("/api/siswa", fetcher);
  const [kelasOptions, setKelasOptions] = useState([]);
  const [jurusanOptions, setJurusanOptions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const initialForm = { nis: "", nama: "", kelas: "", jurusan: "" };
  const [formData, setFormData] = useState(initialForm);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    fetchKelas();
    fetchJurusan();
  }, []);

  // fetchData handled by SWR

  const fetchKelas = async () => {
    try {
      const res = await fetch("/api/kelas");
      const json = await res.json();
      const options = (Array.isArray(json) ? json : []).map((k) => ({
        value: k.kelas,
        label: k.kelas,
      }));
      setKelasOptions([{ value: "", label: "-- Pilih Kelas --" }, ...options]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJurusan = async () => {
    try {
      const res = await fetch("/api/jurusan");
      const json = await res.json();
      const options = (Array.isArray(json) ? json : []).map((k) => ({
        value: k.jurusan,
        label: k.jurusan,
      }));
      setJurusanOptions([
        { value: "", label: "-- Pilih Jurusan --" },
        ...options,
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setIsEdit(true);
      setSelectedId(item.id);
      setFormData({
        nis: item.nim, // legacy uses nim
        nama: item.nama,
        kelas: item.jurusan || "", // legacy stores kelas in 'jurusan'
        jurusan: item.id_jurusan || "", // legacy stores jurusan in 'id_jurusan'
      });
    } else {
      setIsEdit(false);
      setSelectedId(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isEdit ? `/api/siswa/${selectedId}` : "/api/siswa";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        mutate();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Expected columns from excel: NIM, Nama, Kelas, Jurusan
        // Map keys to API expected keys
        const mappedData = jsonData
          .map((row) => ({
            nim: row["NIM"] || row["nim"],
            nama: row["Nama"] || row["nama"],
            jurusan: row["Kelas"] || row["kelas"], // legacy maps Kelas to jurusan
            id_jurusan: row["Jurusan"] || row["jurusan"], // legacy maps Jurusan to id_jurusan
          }))
          .filter((r) => r.nim && r.nama);

        if (mappedData.length === 0) {
          alert(
            "Format Excel salah atau kosong. Pastikan ada kolom NIM dan Nama.",
          );
          setImporting(false);
          return;
        }

        const res = await fetch("/api/siswa/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mappedData),
        });

        const result = await res.json();
        if (res.ok) {
          alert(result.message);
          setIsImportModalOpen(false);
          setImportFile(null);
          mutate();
        } else {
          alert(result.error || "Gagal melakukan import data");
        }
        setImporting(false);
      };
      reader.readAsArrayBuffer(importFile);
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan membaca file Excel.");
      setImporting(false);
    }
  };

  const handleToggleUserStatus = async (siswaId, currentStatus) => {
    // Optimistic UI update could be done here, but let's just wait for API for simplicity
    try {
      const res = await fetch("/api/siswa/user-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_single", siswaId }),
      });
      if (res.ok) {
        mutate();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAllUsers = async (targetState) => {
    if (
      !confirm(
        targetState
          ? "Aktifkan semua user untuk siswa yang belum memiliki akun?"
          : "Non-aktifkan (hapus) semua akun user siswa?",
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/siswa/user-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_all", targetState }),
      });

      const result = await res.json();
      if (res.ok) {
        alert(
          targetState
            ? `Berhasil mengaktifkan ${result.count || 0} user baru.`
            : "Berhasil menonaktifkan seluruh user siswa.",
        );
        mutate();
      } else {
        alert(result.error || "Gagal melakukan aksi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/siswa/${selectedId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setIsConfirmOpen(false);
        mutate();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { label: "NIS", key: "nim", className: "hidden md:table-cell" }, // display from 'nim' field
    { label: "Nama Siswa", key: "nama" },
    { label: "Kelas", key: "jurusan" }, // display from 'jurusan' field
    {
      label: "Status User",
      key: "hasUser",
      className: "hidden md:table-cell",
      render: (row) => (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={row.hasUser || false}
            onChange={() => handleToggleUserStatus(row.id, row.hasUser)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          <span className="ml-3 text-sm font-medium text-gray-700">
            {row.hasUser ? "Aktif" : "Non-aktif"}
          </span>
        </label>
      ),
    },
    {
      label: "Aksi",
      key: "action",
      render: (row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleOpenModal(row)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              setSelectedId(row.id);
              setIsConfirmOpen(true);
            }}
          >
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Data Siswa</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="hidden md:inline-flex"
            onClick={() => setIsImportModalOpen(true)}
          >
            + Import Excel
          </Button>
          <div className="flex bg-gray-100 rounded-lg p-1 overflow-hidden shadow-inner mx-2 hidden md:inline-flex">
            <button
              onClick={() => handleToggleAllUsers(true)}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-l-md transition-colors"
            >
              Aktifkan Semua
            </button>
            <button
              onClick={() => handleToggleAllUsers(false)}
              className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-r-md transition-colors border-l border-white"
            >
              Non-aktifkan Semua
            </button>
          </div>
          <Button onClick={() => handleOpenModal()}>+ Tambah Siswa</Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={Array.isArray(siswaData) ? siswaData : []}
        isLoading={isLoading}
        searchable={true}
        pagination={true}
        // using our custom Add button above
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEdit ? "Edit Siswa" : "Tambah Siswa"}
        size="lg"
      >
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="md:col-span-2">
            <Input
              label="NIS"
              value={formData.nis}
              onChange={(e) =>
                setFormData({ ...formData, nis: e.target.value })
              }
              required
              placeholder="Contoh: 12345678"
            />
          </div>
          <div className="md:col-span-2">
            <Input
              label="Nama Lengkap"
              value={formData.nama}
              onChange={(e) =>
                setFormData({ ...formData, nama: e.target.value })
              }
              required
              placeholder="Contoh: Budi Santoso"
            />
          </div>
          <div className="md:col-span-1">
            <Select
              label="Kelas"
              value={formData.kelas}
              onChange={(e) =>
                setFormData({ ...formData, kelas: e.target.value })
              }
              options={kelasOptions}
              required
            />
          </div>
          <div className="md:col-span-1">
            <Select
              label="Jurusan"
              value={formData.jurusan}
              onChange={(e) =>
                setFormData({ ...formData, jurusan: e.target.value })
              }
              options={jurusanOptions}
              required
            />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isImportModalOpen}
        onClose={() => !importing && setIsImportModalOpen(false)}
        title="Import Data Siswa"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-4">
            <p className="font-bold mb-2">Panduan Import Excel:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Format file harus <strong>.xlsx</strong>.
              </li>
              <li>
                Baris pertama harus berisi header: <strong>NIM</strong>,{" "}
                <strong>Nama</strong>, <strong>Kelas</strong>,{" "}
                <strong>Jurusan</strong>.
              </li>
              <li>
                Siswa akan otomatis dibuatkan akun dengan password berupa NIM
                (menggunakan MD5).
              </li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih File Excel
            </label>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => setImportFile(e.target.files[0])}
              className="w-full border border-gray-300 rounded p-2"
              required
              disabled={importing}
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsImportModalOpen(false)}
              disabled={importing}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={importing || !importFile}
            >
              {importing ? "Memproses..." : "Mulai Import"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Hapus Data"
        message="Apakah Anda yakin ingin menghapus siswa ini? Data nilai dan ujian juga akan terhapus."
        isDangerous={true}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}

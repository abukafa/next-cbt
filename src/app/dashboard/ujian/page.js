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
import { useSession } from "next-auth/react";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function UjianPage() {
  const { data: ujianData, error, isLoading, mutate } = useSWR("/api/ujian", fetcher);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userKonId = parseInt(session?.user?.kon_id);

  // Options
  const [guruOptions, setGuruOptions] = useState([]);
  const [mapelOptions, setMapelOptions] = useState([]);
  const [kelasOptions, setKelasOptions] = useState([]);
  const [jurusanOptions, setJurusanOptions] = useState([]);
  const [guruMapelRelations, setGuruMapelRelations] = useState([]);

  // Use datetime-local format for inputs (YYYY-MM-DDThh:mm)
  const formatDateTimeLocal = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d)) return "";
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const initialForm = {
    id_guru: "",
    id_mapel: "",
    nama_ujian: "",
    jumlah_soal: 50,
    kelas: "",
    jurusan: "",
    waktu: 120,
    jenis: "acak",
    detil_jenis: "",
    tgl_mulai: "",
    terlambat: "",
  };

  const [formData, setFormData] = useState(initialForm);
  const [isEdit, setIsEdit] = useState(false);
  const [availableSoal, setAvailableSoal] = useState(null);

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    if (formData.id_guru && formData.id_mapel && formData.kelas) {
      fetch("/api/ujian/check-soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_guru: formData.id_guru,
          id_mapel: formData.id_mapel,
          kelas: formData.kelas,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setAvailableSoal(data.count);
        })
        .catch(() => setAvailableSoal(null));
    } else {
      setAvailableSoal(null);
    }
  }, [formData.id_guru, formData.id_mapel, formData.kelas]);

  // Data fetching handled by SWR

  const fetchOptions = async () => {
    try {
      const [guruRes, mapelRes, kelasRes, jurusanRes, guruMapelRes] =
        await Promise.all([
          fetch("/api/guru").then((r) => r.json()),
          fetch("/api/mapel").then((r) => r.json()),
          fetch("/api/kelas").then((r) => r.json()),
          fetch("/api/jurusan").then((r) => r.json()),
          fetch("/api/guru-mapel").then((r) => r.json()),
        ]);

      setGuruMapelRelations(Array.isArray(guruMapelRes) ? guruMapelRes : []);

      setGuruOptions([
        { value: "", label: "-- Pilih Guru --" },
        ...(Array.isArray(guruRes) ? guruRes : [])
          .sort((a, b) => a.nama.localeCompare(b.nama))
          .map((g) => ({
            value: g.id.toString(),
            label: g.nama,
          })),
      ]);
      setMapelOptions([
        { value: "", label: "-- Pilih Mapel --" },
        ...(Array.isArray(mapelRes) ? mapelRes : [])
          .sort((a, b) => a.nama.localeCompare(b.nama))
          .map((m) => ({
            value: m.id.toString(),
            label: m.nama,
          })),
      ]);
      setKelasOptions([
        { value: "", label: "-- Pilih Kelas --" },
        ...(Array.isArray(kelasRes) ? kelasRes : []).map((k) => ({
          value: k.kelas,
          label: k.kelas,
        })),
      ]);
      setJurusanOptions([
        { value: "", label: "-- Pilih Jurusan --" },
        ...(Array.isArray(jurusanRes) ? jurusanRes : []).map((j) => ({
          value: j.jurusan,
          label: j.jurusan,
        })),
      ]);
    } catch (err) {
      console.error("Failed to fetch options", err);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setIsEdit(true);
      setSelectedId(item.id);
      setFormData({
        id_guru: item.id_guru.toString(),
        id_mapel: item.id_mapel.toString(),
        nama_ujian: item.nama_ujian,
        jumlah_soal: item.jumlah_soal,
        kelas: item.kelas,
        jurusan: item.jurusan,
        waktu: item.waktu,
        jenis: item.jenis,
        detil_jenis: item.detil_jenis,
        tgl_mulai: formatDateTimeLocal(item.tgl_mulai),
        terlambat: formatDateTimeLocal(item.terlambat),
      });
    } else {
      setIsEdit(false);
      setSelectedId(null);
      setFormData({
        ...initialForm,
        id_guru: userRole === "guru" ? userKonId.toString() : "",
      });
    }
    setIsModalOpen(true);
  };

  const handleChange = (field, value) => {
    if (field === "id_mapel" && value) {
      if (userRole !== "guru") {
        const relation = guruMapelRelations.find(
          (r) => r.id_mapel.toString() === value,
        );
        if (relation) {
          setFormData((prev) => ({
            ...prev,
            [field]: value,
            id_guru: relation.id_guru.toString(),
          }));
          return;
        }
      }
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isEdit ? `/api/ujian/${selectedId}` : "/api/ujian";
      const method = isEdit ? "PUT" : "POST";

      const payload = { ...formData };

      if (payload.tgl_mulai) {
        payload.tgl_mulai = new Date(payload.tgl_mulai).toISOString();
      }
      if (payload.terlambat) {
        payload.terlambat = new Date(payload.terlambat).toISOString();
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        mutate();
      } else {
        alert("Gagal menyimpan data ujian.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/ujian/${selectedId}`, {
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

  // Generate new token manually for existing exam
  const handleRegenerateToken = async (id) => {
    try {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let newToken = "";
      for (let i = 0; i < 5; i++) {
        newToken += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const res = await fetch(`/api/ujian/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: newToken }), // only update token
      });

      if (res.ok) {
        mutate();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { label: "Nama Ujian", key: "nama_ujian" },
    { label: "Mapel", key: "nama_mapel" },
    { label: "Kelas", key: "kelas", render: (row) => `${row.kelas}` },
    {
      label: "Jadwal",
      key: "tgl_mulai",
      className: "whitespace-nowrap",
      render: (row) => {
        const mulai = new Date(row.tgl_mulai).toLocaleString("id-ID");
        const telat = new Date(row.terlambat).toLocaleString("id-ID");
        return (
          <div className="text-sm">
            <div>
              <span className="text-green-600 font-medium">Mulai:</span> {mulai}
            </div>
            <div>
              <span className="text-red-600 font-medium">Tutup:</span> {telat}
            </div>
            <div className="text-gray-500">{row.waktu} menit</div>
          </div>
        );
      },
    },
    {
      label: "Token",
      key: "token",
      width: "120px",
      render: (row) => {
        const isGuru = userRole === "guru";
        const isOwner = row.id_guru === userKonId;
        const disabled = isGuru && !isOwner;

        return (
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-lg font-bold bg-gray-100 px-2 py-1 rounded text-gray-800 tracking-widest">
              {row.token}
            </span>
            {!disabled && (
              <button
                onClick={() => handleRegenerateToken(row.id)}
                className="text-xs text-blue-500 hover:text-blue-700 underline"
              >
                Ganti Token
              </button>
            )}
          </div>
        );
      },
    },
    {
      label: "Aksi",
      key: "action",
      width: "150px",
      render: (row) => {
        const isGuru = userRole === "guru";
        const isOwner = row.id_guru === userKonId;
        const disabled = isGuru && !isOwner;

        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleOpenModal(row)}
              disabled={disabled}
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
              disabled={disabled}
            >
              Hapus
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Jadwal Ujian</h1>
      </div>

      <DataTable
        columns={columns}
        data={Array.isArray(ujianData) ? ujianData : []}
        isLoading={isLoading}
        onAdd={() => handleOpenModal()}
        searchable={true}
        pagination={true}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEdit ? "Edit Ujian" : "Tambah Ujian"}
        size="lg"
      >
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="md:col-span-2">
            <Input
              label="Nama Ujian"
              value={formData.nama_ujian}
              onChange={(e) => handleChange("nama_ujian", e.target.value)}
              required
              placeholder="Contoh: Ujian Tengah Semester Ganjil 2026"
            />
          </div>
          <Select
            label="Mapel"
            value={formData.id_mapel}
            onChange={(e) => handleChange("id_mapel", e.target.value)}
            options={
              userRole === "guru"
                ? mapelOptions.filter(
                    (m) =>
                      m.value === "" ||
                      guruMapelRelations.some(
                        (r) =>
                          r.id_guru === userKonId &&
                          r.id_mapel.toString() === m.value,
                      ),
                  )
                : mapelOptions
            }
            required
          />
          <Select
            label="Guru Pengampu"
            value={formData.id_guru}
            onChange={(e) => handleChange("id_guru", e.target.value)}
            options={guruOptions}
            required
            disabled={
              userRole === "guru" ||
              (userRole !== "guru" &&
                formData.id_mapel !== "" &&
                guruMapelRelations.some(
                  (r) => r.id_mapel.toString() === formData.id_mapel,
                ))
            }
          />

          <Select
            label="Kelas Sasaran"
            value={formData.kelas}
            onChange={(e) => handleChange("kelas", e.target.value)}
            options={kelasOptions}
            required
          />
          <Select
            label="Jurusan Sasaran"
            value={formData.jurusan}
            onChange={(e) => handleChange("jurusan", e.target.value)}
            options={jurusanOptions}
            required
          />

          <Input
            label="Tanggal & Waktu Mulai"
            type="datetime-local"
            value={formData.tgl_mulai}
            onChange={(e) => handleChange("tgl_mulai", e.target.value)}
            required
          />
          <Input
            label="Batas Login Terlambat"
            type="datetime-local"
            value={formData.terlambat}
            onChange={(e) => handleChange("terlambat", e.target.value)}
            required
          />

          <Input
            label="Durasi Waktu Ujian (Menit)"
            type="number"
            min="1"
            value={formData.waktu}
            onChange={(e) => handleChange("waktu", e.target.value)}
            required
          />

          <Select
            label="Jenis Soal"
            value={formData.jenis}
            onChange={(e) => handleChange("jenis", e.target.value)}
            options={[
              { value: "acak", label: "Acak (Random)" },
              { value: "set", label: "Urut (Set)" },
            ]}
            required
          />

          <div className="flex flex-col">
            <Input
              label="Jumlah Soal Ditampilkan"
              type="number"
              min="1"
              value={formData.jumlah_soal}
              onChange={(e) => handleChange("jumlah_soal", e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col">
            {availableSoal !== null && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">
                  Bank Soal Aktif Tersedia:{" "}
                  <strong
                    className={
                      availableSoal < formData.jumlah_soal
                        ? "text-red-600"
                        : "text-emerald-600"
                    }
                  >
                    {availableSoal}
                  </strong>
                </span>
                {availableSoal < formData.jumlah_soal && (
                  <p className="text-red-500 text-xs mt-2 font-medium bg-red-50 p-2 rounded border border-red-100">
                    ⚠️ Peringatan: Jumlah soal yang diminta (
                    {formData.jumlah_soal}) melebihi ketersediaan soal di Bank
                    Soal. Soal yang akan muncul di ujian siswa hanya sejumlah
                    soal yang tersedia.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan Jadwal
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Hapus Ujian"
        message="Apakah Anda yakin ingin menghapus jadwal ujian ini? Data hasil ujian siswa untuk ujian ini akan terhapus."
        isDangerous={true}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}

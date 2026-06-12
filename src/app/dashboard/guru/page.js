"use client";

import { useState } from "react";
import useSWR from "swr";
import { DashboardLayout } from "@/components/layout";
import {
  DataTable,
  Button,
  Modal,
  Input,
  ConfirmDialog,
} from "@/components/ui";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function GuruPage() {
  const { data: guruData, error, isLoading, mutate } = useSWR("/api/guru", fetcher);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const initialForm = { nip: "", nama: "" };
  const [formData, setFormData] = useState(initialForm);
  const [isEdit, setIsEdit] = useState(false);

  // Data fetching handled by SWR

  const handleOpenModal = (item = null) => {
    if (item) {
      setIsEdit(true);
      setSelectedId(item.id);
      setFormData({
        nip: item.nip,
        nama: item.nama,
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
      const url = isEdit ? `/api/guru/${selectedId}` : "/api/guru";
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

  const handleToggleUserStatus = async (guruId, currentStatus) => {
    try {
      const res = await fetch("/api/guru/user-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_single", guruId }),
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
          ? "Aktifkan semua user untuk guru yang belum memiliki akun?"
          : "Non-aktifkan (hapus) semua akun user guru?",
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/guru/user-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_all", targetState }),
      });

      const result = await res.json();
      if (res.ok) {
        alert(
          targetState
            ? `Berhasil mengaktifkan ${result.count || 0} user baru.`
            : "Berhasil menonaktifkan seluruh user guru.",
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
      const res = await fetch(`/api/guru/${selectedId}`, {
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
    { label: "NIP", key: "nip", className: "hidden lg:table-cell" },
    { label: "Nama Guru", key: "nama" },
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
        <h1 className="text-2xl font-bold text-gray-900">Data Guru</h1>
        <div className="flex gap-2">
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
          <Button onClick={() => handleOpenModal()}>+ Tambah Guru</Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={Array.isArray(guruData) ? guruData : []}
        isLoading={isLoading}
        searchable={true}
        pagination={true}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEdit ? "Edit Guru" : "Tambah Guru"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="NIP"
            value={formData.nip}
            onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
            required
            placeholder="Contoh: 198001012005011001"
          />
          <Input
            label="Nama Lengkap"
            value={formData.nama}
            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            required
            placeholder="Contoh: Budi Santoso, S.Pd"
          />
          <div className="flex justify-end gap-2 mt-4">
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

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Hapus Data"
        message="Apakah Anda yakin ingin menghapus guru ini?"
        isDangerous={true}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}

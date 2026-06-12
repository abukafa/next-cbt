"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { DataTable, Button, Modal, Input, ConfirmDialog } from "@/components/ui";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function KelasTable() {
  const { data: session } = useSession();
  const isRoot = session?.user?.username === 'root';
  const { data: kelasData, error, isLoading, mutate } = useSWR("/api/kelas", fetcher);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  
  const initialForm = { nama: "" };
  const [formData, setFormData] = useState(initialForm);
  const [isEdit, setIsEdit] = useState(false);

  // Data fetching handled by SWR

  const handleOpenModal = (item = null) => {
    if (item) {
      setIsEdit(true);
      setSelectedId(item.id);
      setFormData({ 
        nama: item.kelas
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
      const url = isEdit ? `/api/kelas/${selectedId}` : "/api/kelas";
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

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/kelas/${selectedId}`, {
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
    { label: "ID", key: "id", width: "80px" },
    { label: "Nama Kelas", key: "kelas" },
    {
      label: "Aksi",
      key: "action",
      width: "120px",
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleOpenModal(row)}>
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="danger" 
            disabled={!isRoot}
            title={!isRoot ? "Hanya admin root yang dapat menghapus" : ""}
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
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Data Kelas</h2>
      </div>

      <DataTable 
        columns={columns} 
        data={Array.isArray(kelasData) ? kelasData : []} 
        isLoading={isLoading} 
        onAdd={() => handleOpenModal()} 
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEdit ? "Edit Kelas" : "Tambah Kelas"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input 
            label="Nama Kelas" 
            value={formData.nama}
            onChange={(e) => setFormData({...formData, nama: e.target.value})}
            required
            placeholder="Contoh: VII"
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
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
        message="Apakah Anda yakin ingin menghapus kelas ini?"
        isDangerous={true}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

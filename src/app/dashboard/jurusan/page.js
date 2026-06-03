"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout";
import { DataTable, Button, Modal, Input, ConfirmDialog } from "@/components/ui";

export default function JurusanPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  
  const initialForm = { nama: "" };
  const [formData, setFormData] = useState(initialForm);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/jurusan");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setIsEdit(true);
      setSelectedId(item.id);
      setFormData({ 
        nama: item.jurusan
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
      const url = isEdit ? `/api/jurusan/${selectedId}` : "/api/jurusan";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/jurusan/${selectedId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setIsConfirmOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { label: "ID", key: "id", width: "100px" },
    { label: "Nama Jurusan", key: "jurusan" },
    {
      label: "Aksi",
      key: "action",
      width: "150px",
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleOpenModal(row)}>
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
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Program Keahlian / Jurusan</h1>
      </div>

      <DataTable 
        columns={columns} 
        data={data} 
        isLoading={loading} 
        onAdd={() => handleOpenModal()} 
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEdit ? "Edit Jurusan" : "Tambah Jurusan"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input 
            label="Nama Jurusan" 
            value={formData.nama}
            onChange={(e) => setFormData({...formData, nama: e.target.value})}
            required
            placeholder="Contoh: Teknik Komputer dan Jaringan"
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
        message="Apakah Anda yakin ingin menghapus jurusan ini? Pastikan tidak ada data kelas/siswa yang terhubung."
        isDangerous={true}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}

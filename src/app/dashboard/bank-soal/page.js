"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { DataTable, Button, ConfirmDialog, Modal, Select } from "@/components/ui";
import * as XLSX from "xlsx";

export default function BankSoalPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importParams, setImportParams] = useState({ id_guru: "", id_mapel: "", id_kelas: "" });
  
  const [guruOptions, setGuruOptions] = useState([]);
  const [mapelOptions, setMapelOptions] = useState([]);
  const [kelasOptions, setKelasOptions] = useState([]);

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const [guruRes, mapelRes, kelasRes] = await Promise.all([
        fetch("/api/guru").then(r => r.json()),
        fetch("/api/mapel").then(r => r.json()),
        fetch("/api/kelas").then(r => r.json())
      ]);

      setGuruOptions([
        { value: "", label: "-- Pilih Guru --" },
        ...(Array.isArray(guruRes) ? guruRes : []).map(g => ({ value: g.id.toString(), label: g.nama }))
      ]);
      setMapelOptions([
        { value: "", label: "-- Pilih Mapel --" },
        ...(Array.isArray(mapelRes) ? mapelRes : []).map(m => ({ value: m.id.toString(), label: m.nama }))
      ]);
      setKelasOptions([
        { value: "", label: "-- Pilih Kelas --" },
        ...(Array.isArray(kelasRes) ? kelasRes : []).map(k => ({ value: k.id.toString(), label: k.kelas }))
      ]);
    } catch (err) {
      console.error("Failed to fetch options", err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/soal");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/soal/${selectedId}`, {
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

  const handleToggleStatus = async (id, currentBobot) => {
    const newBobot = currentBobot > 0 ? 0 : 1;
    
    // Optimistic UI update
    setData(prev => prev.map(item => item.id === id ? { ...item, bobot: newBobot } : item));

    try {
      const res = await fetch(`/api/soal/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bobot: newBobot }),
      });
      
      if (!res.ok) {
        // Revert on error
        const result = await res.json();
        alert(result.error || "Gagal mengubah status soal");
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
      fetchData();
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = new Uint8Array(e.target.result);
        const workbook = XLSX.read(fileData, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Expected columns: soal, opsi_a, opsi_b, opsi_c, opsi_d, opsi_e, jawaban, bobot
        const mappedData = jsonData.map(row => ({
          soal: row["soal"] || row["Soal"] || row["Pertanyaan"] || "",
          opsi_a: row["opsi_a"] || row["Opsi A"] || row["A"] || "",
          opsi_b: row["opsi_b"] || row["Opsi B"] || row["B"] || "",
          opsi_c: row["opsi_c"] || row["Opsi C"] || row["C"] || "",
          opsi_d: row["opsi_d"] || row["Opsi D"] || row["D"] || "",
          opsi_e: row["opsi_e"] || row["Opsi E"] || row["E"] || "",
          jawaban: row["jawaban"] || row["Jawaban"] || row["Kunci"] || "A",
          bobot: row["bobot"] !== undefined ? row["bobot"] : (row["Bobot"] !== undefined ? row["Bobot"] : 1)
        })).filter(r => r.soal && r.jawaban);

        if (mappedData.length === 0) {
          alert("Format Excel salah atau kosong. Pastikan ada kolom soal dan jawaban.");
          setImporting(false);
          return;
        }

        const payload = {
          ...importParams,
          data: mappedData
        };

        const res = await fetch("/api/soal/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await res.json();
        if (res.ok) {
          alert(result.message);
          setIsImportModalOpen(false);
          setImportFile(null);
          setImportParams({ id_guru: "", id_mapel: "", id_kelas: "" });
          fetchData();
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

  const columns = [
    { label: "ID", key: "id", width: "80px" },
    { label: "Guru", key: "nama_guru" },
    { label: "Mapel", key: "nama_mapel" },
    { label: "Kelas", key: "nama_kelas" },
    { 
      label: "Pertanyaan", 
      key: "soal",
      render: (row) => {
        // Strip HTML tags for preview
        let plainText = row.soal.replace(/<[^>]+>/g, '');
        // Decode common HTML entities
        plainText = plainText
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"');
          
        return (
          <div className="truncate max-w-xs">
            {plainText.length > 50 ? plainText.substring(0, 50) + "..." : plainText}
          </div>
        );
      }
    },
    { 
      label: "Status (Bobot)", 
      key: "bobot", 
      width: "120px",
      render: (row) => {
        const isAktif = row.bobot > 0;
        return (
          <div className="flex flex-col items-center gap-1">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isAktif}
                onChange={() => handleToggleStatus(row.id, row.bobot)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
            <span className={`text-xs font-medium ${isAktif ? 'text-emerald-600' : 'text-gray-500'}`}>
              {isAktif ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
        );
      }
    },
    {
      label: "Aksi",
      key: "action",
      width: "150px",
      render: (row) => (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={() => router.push(`/dashboard/bank-soal/edit/${row.id}`)}
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
        <h1 className="text-2xl font-bold text-gray-900">Bank Soal</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
            + Import Excel
          </Button>
          <Button onClick={() => router.push("/dashboard/bank-soal/create")}>
            + Tambah Soal
          </Button>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={data} 
        isLoading={loading} 
        searchable={true}
        pagination={true}
      />

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        title="Hapus Soal"
        message="Apakah Anda yakin ingin menghapus soal ini?"
        isDangerous={true}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
      />

      <Modal
        isOpen={isImportModalOpen}
        onClose={() => !importing && setIsImportModalOpen(false)}
        title="Import Bank Soal"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-4">
            <p className="font-bold mb-2">Panduan Import Excel:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Format file harus <strong>.xlsx</strong>.</li>
              <li>Baris pertama harus berisi header: <strong>Soal</strong>, <strong>Opsi A</strong> s/d <strong>Opsi E</strong>, <strong>Jawaban</strong>, dan <strong>Bobot</strong>.</li>
              <li>Pilih Guru, Mapel, dan Kelas yang akan menjadi pemilik dari soal-soal ini.</li>
            </ul>
          </div>

          <Select
            label="Guru Pembuat"
            value={importParams.id_guru}
            onChange={(e) => setImportParams({...importParams, id_guru: e.target.value})}
            options={guruOptions}
            required
            disabled={importing}
          />
          
          <Select
            label="Mata Pelajaran"
            value={importParams.id_mapel}
            onChange={(e) => setImportParams({...importParams, id_mapel: e.target.value})}
            options={mapelOptions}
            required
            disabled={importing}
          />

          <Select
            label="Kelas"
            value={importParams.id_kelas}
            onChange={(e) => setImportParams({...importParams, id_kelas: e.target.value})}
            options={kelasOptions}
            required
            disabled={importing}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pilih File Excel</label>
            <input 
              type="file" 
              accept=".xlsx, .xls"
              onChange={(e) => setImportFile(e.target.files[0])}
              className="w-full border border-gray-300 rounded p-2 bg-white"
              required
              disabled={importing}
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsImportModalOpen(false)} disabled={importing}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={importing || !importFile}>
              {importing ? "Memproses..." : "Mulai Import"}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

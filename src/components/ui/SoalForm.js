"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Input, Select, Button } from "@/components/ui";
import "react-quill-new/dist/quill.snow.css";

// Prevent SSR issues with React Quill
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const toolbarOptions = [
  ["bold", "italic", "underline", "strike"], // toggled buttons
  ["blockquote", "code-block"],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ script: "sub" }, { script: "super" }], // superscript/subscript
  [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ color: [] }, { background: [] }], // dropdown with defaults from theme
  ["link", "image", "video"],
  ["clean"], // remove formatting button
];

export default function SoalForm({ initialData = null, isEdit = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Options for selects
  const [guruOptions, setGuruOptions] = useState([]);
  const [mapelOptions, setMapelOptions] = useState([]);
  const [kelasOptions, setKelasOptions] = useState([]);

  const [formData, setFormData] = useState({
    id_guru: "",
    id_mapel: "",
    id_kelas: "",
    bobot: 1,
    soal: "",
    opsi_a: "",
    opsi_b: "",
    opsi_c: "",
    opsi_d: "",
    opsi_e: "",
    jawaban: "A",
  });

  useEffect(() => {
    fetchOptions();
    if (initialData) {
      setFormData({
        id_guru: initialData.id_guru || "",
        id_mapel: initialData.id_mapel || "",
        id_kelas: initialData.id_kelas || "",
        bobot: initialData.bobot ?? 1,
        soal: initialData.soal || "",
        opsi_a: initialData.opsi_a || "",
        opsi_b: initialData.opsi_b || "",
        opsi_c: initialData.opsi_c || "",
        opsi_d: initialData.opsi_d || "",
        opsi_e: initialData.opsi_e || "",
        jawaban: initialData.jawaban || "A",
      });
    }
  }, [initialData]);

  const fetchOptions = async () => {
    try {
      const [guruRes, mapelRes, kelasRes] = await Promise.all([
        fetch("/api/guru").then((r) => r.json()),
        fetch("/api/mapel").then((r) => r.json()),
        fetch("/api/kelas").then((r) => r.json()),
      ]);

      setGuruOptions([
        { value: "", label: "-- Pilih Guru --" },
        ...(Array.isArray(guruRes) ? guruRes : []).map((g) => ({
          value: g.id.toString(),
          label: g.nama,
        })),
      ]);
      setMapelOptions([
        { value: "", label: "-- Pilih Mapel --" },
        ...(Array.isArray(mapelRes) ? mapelRes : []).map((m) => ({
          value: m.id.toString(),
          label: m.nama,
        })),
      ]);
      setKelasOptions([
        { value: "", label: "-- Pilih Kelas --" },
        ...(Array.isArray(kelasRes) ? kelasRes : []).map((k) => ({
          value: k.id.toString(),
          label: k.kelas,
        })),
      ]);
    } catch (err) {
      console.error("Failed to fetch options", err);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEdit ? `/api/soal/${initialData.id}` : "/api/soal";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/dashboard/bank-soal");
        router.refresh();
      } else {
        alert("Gagal menyimpan data!");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const jawabanOptions = [
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
    { value: "D", label: "D" },
    { value: "E", label: "E" },
  ];

  const renderEditor = (label, field) => (
    <div className="mb-12">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="bg-white resize-y overflow-hidden h-48 min-h-[150px] border border-gray-200 rounded-md flex flex-col">
        <ReactQuill
          theme="snow"
          value={formData[field]}
          onChange={(val) => handleChange(field, val)}
          modules={{ toolbar: toolbarOptions }}
          className="h-full flex flex-col [&>.ql-container]:flex-1 [&>.ql-container]:overflow-hidden [&>.ql-editor]:overflow-y-auto"
        />
      </div>
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100"
    >
      {/* Top Meta Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-6 border-b border-gray-200">
        <Select
          label="Guru"
          value={formData.id_guru}
          onChange={(e) => handleChange("id_guru", e.target.value)}
          options={guruOptions}
          required
        />
        <Select
          label="Mapel"
          value={formData.id_mapel}
          onChange={(e) => handleChange("id_mapel", e.target.value)}
          options={mapelOptions}
          required
        />
        <Select
          label="Kelas"
          value={formData.id_kelas}
          onChange={(e) => handleChange("id_kelas", e.target.value)}
          options={kelasOptions}
          required
        />
        <Input
          label="Bobot Nilai"
          type="number"
          value={formData.bobot}
          onChange={(e) => handleChange("bobot", e.target.value)}
          required
        />
      </div>

      {/* Question Editor */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Pertanyaan Utama
        </h3>
        {renderEditor("Teks Pertanyaan", "soal")}
      </div>

      {/* Options Editor */}
      <div className="border-gray-200 pt-12">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Pilihan Jawaban
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
          {renderEditor("Pilihan A", "opsi_a")}
          {renderEditor("Pilihan B", "opsi_b")}
          {renderEditor("Pilihan C", "opsi_c")}
          {renderEditor("Pilihan D", "opsi_d")}
          {renderEditor("Pilihan E", "opsi_e")}
        </div>
      </div>

      {/* Answer Key */}
      <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="w-full md:w-64">
          <Select
            label="Kunci Jawaban"
            value={formData.jawaban}
            onChange={(e) => handleChange("jawaban", e.target.value)}
            options={jawabanOptions}
            required
          />
        </div>

        <div className="flex gap-4 self-end md:self-auto">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/dashboard/bank-soal")}
          >
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Soal"}
          </Button>
        </div>
      </div>
    </form>
  );
}

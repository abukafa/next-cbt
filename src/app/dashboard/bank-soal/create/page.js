"use client";

import { DashboardLayout } from "@/components/layout";
import SoalForm from "@/components/ui/SoalForm";

export default function CreateSoalPage() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tambah Soal Baru</h1>
        <p className="text-gray-500 mt-1">Buat soal ujian baru menggunakan editor di bawah ini.</p>
      </div>

      <SoalForm isEdit={false} />
    </DashboardLayout>
  );
}

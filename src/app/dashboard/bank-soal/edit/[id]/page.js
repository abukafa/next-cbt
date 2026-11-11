"use client";

import { use } from "react";
import useSWR from "swr";
import { DashboardLayout } from "@/components/layout";
import SoalForm from "@/components/ui/SoalForm";
import { fetcher } from "@/lib/fetcher";

export default function EditSoalPage({ params }) {
  const { id } = use(params);
  const {
    data: initialData,
    error,
    isLoading,
  } = useSWR(id ? `/api/soal/${id}` : null, fetcher);

  return (
    <DashboardLayout>
      {isLoading ? (
        <div className="text-center p-8 text-gray-500">Memuat data soal...</div>
      ) : initialData ? (
        <SoalForm initialData={initialData} isEdit={true} />
      ) : (
        <div className="text-center p-8 text-red-500">
          {error?.message || "Gagal memuat soal."}
        </div>
      )}
    </DashboardLayout>
  );
}

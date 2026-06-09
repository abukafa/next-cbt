"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout";
import SoalForm from "@/components/ui/SoalForm";

// Page Component wrapped in Next 15+ promise standard for params
export default function EditSoalPage({ params }) {
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const resolvedParams = await params;
        const res = await fetch(`/api/soal/${resolvedParams.id}`);
        const data = await res.json();
        setInitialData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params]);

  return (
    <DashboardLayout>

      {loading ? (
        <div className="text-center p-8 text-gray-500">Memuat data soal...</div>
      ) : initialData ? (
        <SoalForm initialData={initialData} isEdit={true} />
      ) : (
        <div className="text-center p-8 text-red-500">Gagal memuat soal.</div>
      )}
    </DashboardLayout>
  );
}

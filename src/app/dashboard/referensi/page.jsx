"use client";

import { DashboardLayout } from "@/components/layout";
import KelasTable from "./KelasTable";
import JurusanTable from "./JurusanTable";
import MapelTable from "./MapelTable";
import GuruMapelTable from "./GuruMapelTable";

export default function ReferensiPage() {
  return (
    <DashboardLayout>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Referensi Data</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Column 1: Kelas & Jurusan */}
        <div>
          <KelasTable />
          <MapelTable />
        </div>

        {/* Column 2: Mapel */}
        <div>
          <JurusanTable />
          <GuruMapelTable />
        </div>
      </div>
    </DashboardLayout>
  );
}

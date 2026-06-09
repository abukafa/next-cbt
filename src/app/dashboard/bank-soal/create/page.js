"use client";

import { DashboardLayout } from "@/components/layout";
import SoalForm from "@/components/ui/SoalForm";

export default function CreateSoalPage() {
  return (
    <DashboardLayout>

      <SoalForm isEdit={false} />
    </DashboardLayout>
  );
}

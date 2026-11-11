"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { fetcher } from "@/lib/fetcher";
import { DashboardLayout } from "@/components/layout";
import { Button, Input } from "@/components/ui";

const roleLabels = {
  admin: "Administrator",
  guru: "Guru",
  siswa: "Siswa",
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const { data: profile, error, isLoading } = useSWR("/api/profile", fetcher);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi password baru tidak sama.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json();

      if (!response.ok) {
        setPasswordError(result.error || "Gagal mengganti password.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Password berhasil diganti.");
    } catch {
      setPasswordError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const detail = profile?.detail;
  const infoRows =
    profile?.role === "guru"
      ? [
          ["Nama", detail?.nama],
          ["NIP", detail?.nip],
        ]
      : profile?.role === "siswa"
        ? [
            ["Nama", detail?.nama],
            ["NIS", detail?.nim],
            ["Kelas", detail?.kelas],
            ["Jurusan", detail?.jurusan],
          ]
        : [];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Profil Saya</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Informasi Akun
          </h2>
          {isLoading ? (
            <p className="text-gray-500">Memuat informasi profil...</p>
          ) : error ? (
            <p role="alert" className="text-red-600">
              Gagal memuat informasi profil: {error.message}
            </p>
          ) : (
            <dl className="divide-y divide-gray-100">
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-gray-500">Username</dt>
                <dd className="font-medium text-gray-900">
                  {profile?.username ||
                    session?.user?.name ||
                    session?.user?.email ||
                    "-"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-gray-500">Role</dt>
                <dd className="font-medium text-gray-900">
                  {roleLabels[profile?.role] || "-"}
                </dd>
              </div>
              {profile?.info && (
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-gray-500">Tipe akun</dt>
                  <dd className="font-medium text-gray-900">{profile.info}</dd>
                </div>
              )}
              {infoRows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-3">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="text-right font-medium text-gray-900">
                    {value || "-"}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Ganti Password
          </h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              label="Password saat ini"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
            <Input
              label="Password baru (minimal 8 karakter, maksimal 72 byte)"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
            <Input
              label="Konfirmasi password baru"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
            {passwordError && (
              <p role="alert" className="text-sm text-red-600">
                {passwordError}
              </p>
            )}
            {passwordSuccess && (
              <p role="status" className="text-sm text-emerald-700">
                {passwordSuccess}
              </p>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Password Baru"}
            </Button>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}

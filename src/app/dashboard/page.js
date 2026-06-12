"use client";

import { useState } from "react";
import useSWR from "swr";
import { DashboardLayout } from "@/components/layout";
import { StatCard } from "@/components/ui";
import { Users, BookOpen, FileText } from "lucide-react";
import { useSession } from "next-auth/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const { data: session } = useSession();
  const isSiswa = session?.user?.role === "siswa";

  const [filterKelas, setFilterKelas] = useState("Semua");
  const { data, error, isLoading } = useSWR("/api/dashboard", fetcher);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const adminStats = data?.admin_stats;
  const statusUjian = data?.status_ujian;

  // Process Schedule Data
  const rawJadwal = statusUjian?.tabel_jadwal || [];
  const uniqueClasses = [
    "Semua",
    ...new Set(rawJadwal.map((j) => j.kelas).filter(Boolean)),
  ].sort();

  const filteredJadwal =
    filterKelas === "Semua"
      ? rawJadwal
      : rawJadwal.filter((j) => j.kelas === filterKelas);

  const getDateStr = (d) => {
    const date = new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const groupedJadwal = {};
  filteredJadwal.forEach((j) => {
    const dStr = getDateStr(j.tgl_mulai);
    if (!groupedJadwal[dStr]) groupedJadwal[dStr] = [];
    groupedJadwal[dStr].push(j);
  });
  const sortedDates = Object.keys(groupedJadwal).sort();

  return (
    <DashboardLayout>
      <div className="mb-6 flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">CBT System Summary</p>
        </div>
      </div>

      {!isSiswa && adminStats && (
        <>
          {/* ROW 1: 3 CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 print:hidden">
            <StatCard
              label="Total Guru"
              value={adminStats.total_guru || 0}
              icon={Users}
            />
            <StatCard
              label="Total Siswa"
              value={adminStats.total_siswa || 0}
              icon={Users}
            />
            <StatCard
              label="Total Mata Pelajaran"
              value={adminStats.total_mapel || 0}
              icon={BookOpen}
            />
          </div>

          {/* ROW 2: 2 CARDS (Bar Chart colspan-2, Pie Chart colspan-1) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 print:hidden">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Distribusi Mapel per Guru
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adminStats.chart_guru_mapel}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280" }}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "#f3f4f6" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar dataKey="Mapel" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Siswa per Kelas
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={adminStats.chart_siswa_jurusan}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {adminStats.chart_siswa_jurusan.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ROW 3: 1 CARD (Bar Chart colspan-3) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 print:hidden">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Distribusi Bank Soal per Mapel
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...(adminStats.chart_bank_soal || [])].sort((a, b) =>
                    a.name.localeCompare(b.name),
                  )}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280" }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "#f3f4f6" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar dataKey="Soal" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* STATUS UJIAN SECTION (For Admin & Siswa) */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 print:hidden">
          <FileText className="text-emerald-600" />
          Status Ujian
        </h2>

        {statusUjian && (
          <>
            {/* ROW 4: 2 CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 print:hidden">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Status Ujian
                </h3>
                <div className="h-64">
                  {statusUjian.chart_status_ujian?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusUjian.chart_status_ujian}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {statusUjian.chart_status_ujian.map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.name === "Selesai"
                                    ? "#10b981"
                                    : "#f59e0b"
                                }
                              />
                            ),
                          )}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{ borderRadius: "8px", border: "none" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      Belum ada ujian
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Peserta per Ujian Aktif
                </h3>
                <div className="h-64">
                  {statusUjian.chart_ujian_test?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={statusUjian.chart_ujian_test}
                        layout="vertical"
                        margin={{ left: 10, right: 30 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                          stroke="#e5e7eb"
                        />
                        <XAxis
                          type="number"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          axisLine={false}
                          tickLine={false}
                          width={200}
                          interval={0}
                          tick={{ fill: "#6b7280", fontSize: 11 }}
                        />
                        <RechartsTooltip
                          cursor={{ fill: "#f3f4f6" }}
                          contentStyle={{ borderRadius: "8px", border: "none" }}
                        />
                        <Bar
                          dataKey="Peserta"
                          fill="#8b5cf6"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      Belum ada peserta ujian
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ROW 5: 1 CARD (Table) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center flex-wrap gap-4 print:hidden">
                <h3 className="text-lg font-bold text-gray-900">
                  Jadwal Ujian Terkini
                </h3>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Filter Kelas:
                  </label>
                  <select
                    value={filterKelas}
                    onChange={(e) => setFilterKelas(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {uniqueClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => window.print()}
                    className="ml-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    Cetak
                  </button>
                </div>
              </div>
              <div className="hidden print:block mb-6 px-6 pt-4 text-center">
                <h2 className="text-2xl font-bold text-gray-900 uppercase">
                  Jadwal Ujian Terkini
                </h2>
                {filterKelas !== "Semua" && (
                  <p className="text-lg text-gray-700 mt-2">
                    Kelas: <span className="font-semibold">{filterKelas}</span>
                  </p>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-emerald-50 border-b border-emerald-100 text-sm font-bold text-emerald-900">
                      <th className="px-4 py-3 text-center w-12 border-r border-emerald-100">
                        No
                      </th>
                      <th className="px-4 py-3 border-r border-emerald-100">
                        Hari & Tanggal
                      </th>
                      <th className="px-4 py-3 text-center border-r border-emerald-100">
                        Jam Ke-
                      </th>
                      <th className="px-4 py-3 text-center border-r border-emerald-100">
                        Waktu
                      </th>
                      <th className="px-4 py-3 border-r border-emerald-100">
                        Mata Pelajaran
                      </th>
                      {!isSiswa && (
                        <th className="px-4 py-3 text-center">Token</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedDates.length > 0 ? (
                      sortedDates.map((dateStr, dayIndex) => {
                        const exams = groupedJadwal[dateStr];
                        // Sort by start time inside the day
                        exams.sort(
                          (a, b) =>
                            new Date(a.tgl_mulai) - new Date(b.tgl_mulai),
                        );

                        const classJamCounters = {};

                        return exams.map((exam, examIndex) => {
                          const clsKey = exam.kelas + "_" + exam.jurusan;
                          if (!classJamCounters[clsKey]) {
                            classJamCounters[clsKey] = 0;
                          }
                          classJamCounters[clsKey]++;
                          const jamKe = classJamCounters[clsKey];
                          const startTime = new Date(exam.tgl_mulai);
                          const endTime = new Date(exam.terlambat);
                          const timeStr = `${startTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} - ${endTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
                          const dateFormatted = startTime.toLocaleDateString(
                            "id-ID",
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          );

                          let mapelName = exam.nama_mapel || "";
                          if (mapelName.length > 4) {
                            mapelName = mapelName.substring(
                              0,
                              mapelName.length - 4,
                            );
                          }

                          return (
                            <tr
                              key={exam.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              {examIndex === 0 && (
                                <>
                                  <td
                                    className="px-4 py-3 text-center border-r border-gray-200 bg-white"
                                    rowSpan={exams.length}
                                  >
                                    <span className="font-semibold text-gray-700">
                                      {dayIndex + 1}
                                    </span>
                                  </td>
                                  <td
                                    className="px-4 py-3 font-medium text-gray-900 border-r border-gray-200 bg-white"
                                    rowSpan={exams.length}
                                  >
                                    {dateFormatted}
                                  </td>
                                </>
                              )}
                              <td className="px-4 py-3 text-center text-gray-600 border-r border-gray-200 font-medium">
                                {jamKe}
                              </td>
                              <td className="px-4 py-3 text-gray-600 border-r border-gray-200 text-center whitespace-nowrap">
                                {timeStr}
                              </td>
                              <td className="px-4 py-3 text-gray-800 border-r border-gray-200">
                                <div className="font-semibold">{mapelName}</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {exam.nama_ujian} &bull; Kelas {exam.kelas}{" "}
                                  {exam.jurusan}
                                </div>
                              </td>
                              {!isSiswa && (
                                <td className="px-4 py-3 text-center">
                                  {exam.token ? (
                                    <span className="inline-block bg-blue-100 text-blue-800 font-mono text-xs font-bold px-2.5 py-1 rounded border border-blue-200">
                                      {exam.token}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-sm">
                                      -
                                    </span>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        });
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={isSiswa ? 5 : 6}
                          className="px-6 py-12 text-center text-gray-500 bg-gray-50/50"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <BookOpen className="h-10 w-10 text-gray-300 mb-3" />
                            <p>
                              Tidak ada jadwal ujian untuk kelas yang dipilih.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

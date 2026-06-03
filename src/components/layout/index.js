"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Modal, Button } from "@/components/ui";
import {
  Menu,
  X,
  Home,
  Users,
  BookOpen,
  FileText,
  BarChart3,
  LogOut,
  ChevronDown,
  Clock,
  GraduationCap,
} from "lucide-react";

/**
 * CBT Application - Layout Components
 * Sidebar Navigation, TopBar, MainLayout
 */

// ============================================================================
// SIDEBAR NAVIGATION
// ============================================================================

export function Sidebar({ isOpen, onClose, userRole = "admin" }) {
  const pathname = usePathname();
  const [expandedMenu, setExpandedMenu] = useState(null);

  // Menu items with nested structure
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      href: "/dashboard",
    },
    {
      id: "master-data",
      label: "Master Data",
      icon: FileText,
      submenu: [
        { label: "Siswa", href: "/dashboard/siswa" },
        { label: "Guru", href: "/dashboard/guru" },
        { label: "Referensi (Kls, Jrsn, Mapel)", href: "/dashboard/referensi" },
      ],
    },
    {
      id: "ujian",
      label: "Ujian",
      icon: BookOpen,
      submenu: [
        { label: "Bank Soal", href: "/dashboard/bank-soal" },
        { label: "Ujian", href: "/dashboard/ujian" },
      ],
    },
    {
      id: "hasil",
      label: "Hasil",
      icon: BarChart3,
      submenu: [
        { label: "Hasil Ujian", href: "/dashboard/hasil-ujian" },
        { label: "Cetak Kartu", href: "/dashboard/cetak-kartu" },
      ],
    },
  ];

  // Filter menu based on role
  const filteredMenuItems = menuItems.filter((item) => {
    if (userRole === "siswa") {
      // Siswa only sees Dashboard (Beranda) and Jadwal Ujian
      return item.id === "dashboard" || item.id === "jadwal-ujian";
    }
    if (userRole === "guru") {
      // Guru sees everything EXCEPT jadwal-ujian and master-data
      return item.id !== "jadwal-ujian" && item.id !== "master-data";
    }
    // Admin sees everything EXCEPT jadwal-ujian (they use Ujian instead)
    return item.id !== "jadwal-ujian";
  });

  // Inject Jadwal Ujian item for siswa if not present
  if (userRole === "siswa") {
    filteredMenuItems.push({
      id: "jadwal-ujian",
      label: "Jadwal Ujian",
      icon: Clock,
      href: "/dashboard/jadwal-ujian",
    });
  }

  const toggleSubmenu = (id) => {
    setExpandedMenu(expandedMenu === id ? null : id);
  };

  const isActive = (href) => pathname === href;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 w-64 h-screen bg-white border-r border-gray-200 transform transition-transform duration-300 md:translate-x-0 print:hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                <GraduationCap size={20} />
              </span>
            </div>
            <span className="text-lg font-bold text-gray-900">CBT System</span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          {filteredMenuItems.map((item) => (
            <div key={item.id}>
              {item.submenu ? (
                // Menu with submenu
                <>
                  <button
                    onClick={() => toggleSubmenu(item.id)}
                    className={`w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      expandedMenu === item.id ? "bg-gray-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} className="text-gray-600" />
                      <span className="text-gray-900 font-medium">
                        {item.label}
                      </span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform ${
                        expandedMenu === item.id ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Submenu Items */}
                  {expandedMenu === item.id && (
                    <div className="bg-gray-50">
                      {item.submenu.map((submenu, idx) => (
                        <Link
                          key={idx}
                          href={submenu.href}
                          onClick={onClose}
                          className={`block px-12 py-2 text-sm transition-colors ${
                            isActive(submenu.href)
                              ? "bg-emerald-50 text-emerald-600 font-medium"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          {submenu.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // Menu without submenu
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`px-6 py-3 flex items-center gap-3 transition-colors ${
                    isActive(item.href)
                      ? "bg-emerald-50 text-emerald-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

// ============================================================================
// TOP BAR / HEADER
// ============================================================================

export function TopBar({ onMenuClick, userName = "User" }) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [serverTime, setServerTime] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    const timer = setInterval(() => setServerTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleProfileClick = async () => {
    setShowProfileModal(true);
    if (!profileData) {
      setLoadingProfile(true);
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        setProfileData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProfile(false);
      }
    }
  };

  const timeString = isMounted ? serverTime.toLocaleTimeString("id-ID") : "";
  const dateString = isMounted
    ? serverTime.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 print:hidden">
        <div className="flex items-center justify-between px-6 h-16">
          {/* Left Side */}
          <button
            onClick={onMenuClick}
            className="md:hidden text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Menu size={24} />
          </button>

          {/* Middle - Empty Space */}
          <div className="flex-1" />

          {/* Right Side */}
          <div className="flex items-center gap-6">
            {/* Server Time & Date */}
            <div className="hidden sm:flex flex-col items-end text-sm text-gray-600">
              <span className="font-medium text-gray-800">{dateString}</span>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{timeString}</span>
              </div>
            </div>

            {/* User Profile Avatar */}
            <div className="relative">
              <button
                onClick={handleProfileClick}
                className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-lg hover:ring-2 hover:ring-offset-2 hover:ring-emerald-500 transition-all focus:outline-none"
                title="Profil Pengguna"
              >
                {userName.charAt(0).toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Profil Pengguna"
      >
        <div className="p-4 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-3xl mb-4">
            {userName.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{userName}</h2>

          {loadingProfile ? (
            <div className="mt-4 text-gray-500">Memuat data...</div>
          ) : (
            <div className="mt-6 w-full max-w-sm space-y-4 text-left">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
                <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-200">
                  <span className="text-gray-500">Tipe Akun</span>
                  <span className="col-span-2 font-medium capitalize">
                    {profileData?.role || "-"}
                  </span>
                </div>

                {profileData?.role === "admin" && (
                  <>
                    <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-200">
                      <span className="text-gray-500">Peran</span>
                      <span className="col-span-2 font-medium">
                        Administrator
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 py-2 border-gray-200">
                      <span className="text-gray-500">Akses</span>
                      <span className="col-span-2 font-medium">Seperuser</span>
                    </div>
                  </>
                )}

                {profileData?.role === "guru" && profileData.detail && (
                  <>
                    <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-200">
                      <span className="text-gray-500">NIP</span>
                      <span className="col-span-2 font-medium">
                        {profileData.detail.nip}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 py-2">
                      <span className="text-gray-500">Nama</span>
                      <span className="col-span-2 font-medium">
                        {profileData.detail.nama}
                      </span>
                    </div>
                  </>
                )}

                {profileData?.role === "siswa" && profileData.detail && (
                  <>
                    <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-200">
                      <span className="text-gray-500">NIM</span>
                      <span className="col-span-2 font-medium">
                        {profileData.detail.nim}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-200">
                      <span className="text-gray-500">Nama</span>
                      <span className="col-span-2 font-medium">
                        {profileData.detail.nama}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 py-2 border-gray-200">
                      <span className="text-gray-500">Kelas</span>
                      <span className="col-span-2 font-medium">
                        {profileData.detail.kelas?.nama_kelas || "-"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowProfileModal(false)}
                >
                  Tutup
                </Button>
                <Button
                  variant="danger"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

// ============================================================================
// MAIN LAYOUT
// ============================================================================

export function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={session?.user?.role}
      />

      {/* Main Content */}
      <div className="md:ml-64 flex flex-col min-h-screen print:ml-0 print:bg-white">
        {/* Top Bar */}
        <TopBar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          userName={session?.user?.name || session?.user?.email || "User"}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 print:p-0 print:m-0">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4 text-center text-sm text-gray-600 print:hidden">
          <p>&copy; 2026 CBT System. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

// ============================================================================
// SIMPLE LAYOUT (For Auth Pages)
// ============================================================================

export function SimpleLayout({ children, title }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">CBT</span>
            </div>
          </div>
          {title && (
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          )}
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">{children}</div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>&copy; 2026 CBT System. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default {
  Sidebar,
  TopBar,
  DashboardLayout,
  SimpleLayout,
};

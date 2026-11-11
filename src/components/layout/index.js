"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Menu,
  X,
  Home,
  User,
  BookOpen,
  FileText,
  BarChart3,
  LogOut,
  ChevronDown,
  Clock,
} from "lucide-react";

/**
 * CBT Application - Layout Components
 * Sidebar Navigation, TopBar, MainLayout
 */

// ============================================================================
// SIDEBAR NAVIGATION
// ============================================================================

export function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const [expandedMenu, setExpandedMenu] = useState(null);
  const { data: session } = useSession();
  const role = session?.user?.role;

  // Menu items with nested structure
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      href: "/dashboard",
      roles: ["admin", "guru", "siswa"],
    },
    {
      id: "master-data",
      label: "Master Data",
      icon: FileText,
      roles: ["admin"],
      submenu: [
        { label: "Siswa", href: "/dashboard/siswa", roles: ["admin"] },
        { label: "Guru", href: "/dashboard/guru", roles: ["admin"] },
        {
          label: "Referensi",
          href: "/dashboard/referensi",
          roles: ["admin"],
        },
      ],
    },
    {
      id: "ujian",
      label: "Ujian",
      icon: BookOpen,
      roles: ["admin", "guru"],
      submenu: [
        {
          label: "Bank Soal",
          href: "/dashboard/bank-soal",
          roles: ["admin", "guru"],
        },
        {
          label: "Ujian",
          href: "/dashboard/ujian",
          roles: ["admin", "guru"],
        },
      ],
    },
    {
      id: "hasil",
      label: "Hasil",
      icon: BarChart3,
      roles: ["admin", "guru"],
      submenu: [
        {
          label: "Hasil Ujian",
          href: "/dashboard/hasil-ujian",
          roles: ["admin", "guru"],
        },
        {
          label: "Cetak Kartu",
          href: "/dashboard/cetak-kartu",
          roles: ["admin"],
        },
      ],
    },
    {
      id: "jadwal-ujian",
      label: "Jadwal Ujian",
      icon: Clock,
      href: "/dashboard/jadwal-ujian",
      roles: ["siswa"],
    },
  ];

  const visibleMenuItems = menuItems
    .filter((item) => item.roles.includes(role))
    .map((item) => ({
      ...item,
      submenu: item.submenu?.filter((submenu) => submenu.roles.includes(role)),
    }))
    .filter((item) => !item.submenu || item.submenu.length > 0);
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
        className={`fixed left-0 top-0 z-50 w-64 h-screen bg-white border-r border-gray-200 transform transition-transform duration-300 md:relative md:shrink-0 md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">CBT</span>
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
          {visibleMenuItems.map((item) => (
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

export function TopBar({ onMenuClick, userName = "User", userRole }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [serverTime, setServerTime] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    const timer = setInterval(() => setServerTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = isMounted ? serverTime.toLocaleTimeString("id-ID") : "";

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
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
          {/* Server Time */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
            <Clock size={16} />
            <span>{timeString}</span>
          </div>

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                <User size={20} className="text-white" />
                {/* {userName.charAt(0).toUpperCase()} */}
              </div>
              <span className="text-sm font-medium text-gray-900 hidden sm:block">
                {userName}
              </span>
              <ChevronDown size={16} className="text-gray-600" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {userName}
                  </p>
                  <p className="text-xs capitalize text-gray-500">
                    {userRole || "Pengguna"}
                  </p>
                </div>
                <Link
                  href="/dashboard/profile"
                  onClick={() => setShowDropdown(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Profil
                </Link>
                <hr className="my-1" />
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// MAIN LAYOUT
// ============================================================================

export function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0 min-h-screen">
        {/* Top Bar */}
        <TopBar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          userName={session?.user?.name || session?.user?.email || "User"}
          userRole={session?.user?.role}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4 text-center text-sm text-gray-600">
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

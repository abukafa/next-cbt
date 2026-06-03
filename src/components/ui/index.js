"use client";

import React, { useState, useMemo } from "react";

/**
 * CBT Application - Tailwind Component Library
 * Ready-to-use React components with Tailwind CSS
 */

// ============================================================================
// 1. BUTTON COMPONENTS
// ============================================================================

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  disabled = false,
  ...props
}) {
  const baseStyles =
    "font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center whitespace-nowrap";

  const variants = {
    primary:
      "bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700 focus:ring-emerald-500",
    secondary:
      "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 focus:ring-gray-300",
    danger:
      "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus:ring-red-500",
    warning:
      "bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 focus:ring-amber-500",
    ghost:
      "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-300",
  };

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({
  variant = "ghost",
  className = "",
  children,
  disabled = false,
  ...props
}) {
  const baseStyles =
    "p-2 rounded-lg transition-colors duration-200 disabled:opacity-50 focus:outline-none focus:ring-2";

  const variants = {
    primary: "text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-500",
    secondary: "text-gray-600 hover:bg-gray-100 focus:ring-gray-300",
    danger: "text-red-600 hover:bg-red-50 focus:ring-red-500",
    ghost: "text-gray-600 hover:bg-gray-100 focus:ring-gray-300",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonGroup({ children, className = "" }) {
  return <div className={`flex gap-2 ${className}`}>{children}</div>;
}

// ============================================================================
// 2. INPUT / FORM COMPONENTS
// ============================================================================

export function Input({
  label,
  error,
  helperText,
  className = "",
  required = false,
  ...props
}) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 
                     focus:border-transparent transition-colors
                     ${error ? "border-red-500 focus:ring-red-500" : ""}
                     ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      {helperText && <p className="text-sm text-gray-500 mt-1">{helperText}</p>}
    </div>
  );
}

export function Select({
  label,
  error,
  options = [],
  className = "",
  required = false,
  ...props
}) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 
                     focus:border-transparent transition-colors
                     ${error ? "border-red-500 focus:ring-red-500" : ""}
                     ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export function TextArea({
  label,
  error,
  rows = 4,
  className = "",
  required = false,
  ...props
}) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 
                     focus:border-transparent transition-colors resize-none
                     ${error ? "border-red-500 focus:ring-red-500" : ""}
                     ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export function FormGroup({ children, columns = 1, className = "" }) {
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  };

  return (
    <div className={`grid ${gridClass[columns]} gap-4 mb-4 ${className}`}>
      {children}
    </div>
  );
}

// ============================================================================
// 3. TABLE COMPONENTS
// ============================================================================

export function DataTable({
  columns = [],
  data = [],
  title,
  onAdd,
  onImport,
  onDeleteAll,
  isLoading = false,
  className = "",
  searchable = false,
  pagination = false,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter Data
  const filteredData = useMemo(() => {
    let result = Array.isArray(data) ? data : [];
    if (searchable && searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((row) => {
        return Object.values(row).some((val) =>
          String(val).toLowerCase().includes(lowerSearch)
        );
      });
    }
    return result;
  }, [data, searchable, searchTerm]);

  // Sort Data
  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key] || "";
        const bVal = b[sortConfig.key] || "";
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  // Paginate Data
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const actualPage = Math.max(1, Math.min(Number(currentPage) || 1, totalPages));

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (actualPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pagination, actualPage, pageSize]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Reset page when data/search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [filteredData.length, pageSize]);

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col ${className}`}
    >
      {/* Header */}
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}

      {/* Toolbar & Filter */}
      {(onAdd || onImport || onDeleteAll || searchable || pagination) && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex gap-2 flex-wrap">
            {onAdd && (
              <Button size="sm" onClick={onAdd}>
                + Tambah
              </Button>
            )}
            {onImport && (
              <Button size="sm" variant="secondary" onClick={onImport}>
                ⬇ Import
              </Button>
            )}
            {onDeleteAll && (
              <Button size="sm" variant="danger" onClick={onDeleteAll}>
                🗑 Hapus Semua
              </Button>
            )}
          </div>

          <div className="flex gap-4 items-center w-full sm:w-auto">
            {searchable && (
              <input
                type="text"
                placeholder="Cari data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-emerald-500"
              />
            )}
            {pagination && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Tampilkan</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="border border-gray-300 rounded p-1"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>baris</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 select-none"
                  style={{ width: col.width }}
                  onClick={() => requestSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortConfig?.key === col.key && (
                      <span className="text-gray-400">
                        {sortConfig.direction === "asc" ? " 🔼" : " 🔽"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <LoadingSpinner />
                </td>
              </tr>
            ) : !Array.isArray(paginatedData) || paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <EmptyState message="Tidak ada data ditemukan" />
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col) => (
                    <td
                      key={`${idx}-${col.key}`}
                      className="px-6 py-4 text-sm text-gray-900"
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <span className="text-sm text-gray-600">
            Halaman {actualPage} dari {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCurrentPage((prev) => Math.max(Number(prev) - 1, 1))}
              disabled={actualPage === 1}
            >
              Prev
            </Button>
            
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => setCurrentPage(e.target.value)}
              onBlur={() => setCurrentPage(actualPage)}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:outline-none focus:border-emerald-500"
            />

            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCurrentPage((prev) => Math.min(Number(prev) + 1, totalPages))}
              disabled={actualPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 4. MODAL / DIALOG COMPONENTS
// ============================================================================

export function Modal({
  isOpen = false,
  title,
  onClose,
  children,
  footer,
  size = "md",
  className = "",
}) {
  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`bg-white rounded-lg shadow-lg ${sizes[size]} w-full mx-4 ${className}`}
      >
        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  isOpen = false,
  title = "Konfirmasi",
  message = "Apakah Anda yakin?",
  onConfirm,
  onCancel,
  isDangerous = false,
}) {
  return (
    <Modal isOpen={isOpen} title={title} onClose={onCancel} size="sm">
      <p className="text-gray-600 mb-4">{message}</p>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Batal
        </Button>
        <Button
          variant={isDangerous ? "danger" : "primary"}
          size="sm"
          onClick={onConfirm}
        >
          Yakin
        </Button>
      </div>
    </Modal>
  );
}

// ============================================================================
// 5. ALERT / NOTIFICATION COMPONENTS
// ============================================================================

export function Alert({ type = "info", message, onClose, className = "" }) {
  const styles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <div
      className={`border rounded-lg p-4 mb-4 flex justify-between items-center ${styles[type]} ${className}`}
    >
      <p className="text-sm">
        {icons[type]} {message}
      </p>
      {onClose && (
        <button
          onClick={onClose}
          className="text-lg leading-none opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ============================================================================
// 6. CARD COMPONENTS
// ============================================================================

export function Card({ title, children, footer, className = "" }) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, trend, className = "" }) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p
              className={`text-sm mt-2 ${trend.positive ? "text-emerald-600" : "text-red-600"}`}
            >
              {trend.positive ? "↑" : "↓"} {trend.percent}% dari bulan lalu
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Icon className="text-emerald-600" size={24} />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 7. UTILITY COMPONENTS
// ============================================================================

export function LoadingSpinner({ size = "md" }) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div
      className={`${sizes[size]} border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin`}
    />
  );
}

export function Badge({ variant = "primary", children, className = "" }) {
  const styles = {
    primary: "bg-emerald-100 text-emerald-800",
    secondary: "bg-gray-100 text-gray-800",
    success: "bg-emerald-100 text-emerald-800",
    danger: "bg-red-100 text-red-800",
    warning: "bg-amber-100 text-amber-800",
    info: "bg-blue-100 text-blue-800",
  };

  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  message = "Tidak ada data",
  icon: Icon,
  action,
  className = "",
}) {
  return (
    <div className={`px-6 py-12 text-center ${className}`}>
      {Icon && (
        <div className="flex justify-center mb-4">
          <Icon size={48} className="text-gray-400" />
        </div>
      )}
      <p className="text-gray-600 mb-4">{message}</p>
      {action}
    </div>
  );
}

export function Breadcrumb({ items = [], className = "" }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {item.href ? (
            <a
              href={item.href}
              className="text-emerald-600 hover:text-emerald-700"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-gray-900">{item.label}</span>
          )}
          {idx < items.length - 1 && <span className="text-gray-400">/</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================================================
// 8. PAGINATION COMPONENT
// ============================================================================

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = "",
}) {
  return (
    <div className={`flex items-center justify-between pt-4 ${className}`}>
      <p className="text-sm text-gray-600">
        Halaman {currentPage} dari {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          ← Sebelumnya
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Selanjutnya →
        </Button>
      </div>
    </div>
  );
}

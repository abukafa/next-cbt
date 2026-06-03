/**
 * Common utility functions
 */

// Format date to Indonesian format
export function formatDate(date) {
  return new Date(date).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Format time
export function formatTime(date) {
  return new Date(date).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format datetime
export function formatDateTime(date) {
  return new Date(date).toLocaleString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Calculate score percentage
export function calculatePercentage(correct, total) {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

// Get status badge color
export function getStatusColor(status) {
  const colors = {
    active: "emerald",
    inactive: "gray",
    completed: "emerald",
    ongoing: "blue",
    draft: "gray",
    published: "emerald",
    closed: "red",
  };
  return colors[status] || "gray";
}

// Validate email
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Generate random string
export function generateRandomString(length = 10) {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

// Convert seconds to time format
export function secondsToTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  return `${minutes}m ${secs}s`;
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// API request helper
export async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Request Error:", error);
    throw error;
  }
}

// Parse CSV
export function parseCSV(csvText) {
  const lines = csvText.split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "") continue;
    const obj = {};
    const values = lines[i].split(",").map((v) => v.trim());
    headers.forEach((header, idx) => {
      obj[header] = values[idx];
    });
    data.push(obj);
  }

  return data;
}

// Export to CSV
export function downloadCSV(data, filename = "export.csv") {
  const headers = Object.keys(data[0] || {});
  const csv = [
    headers.join(","),
    ...data.map((row) => headers.map((h) => row[h]).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

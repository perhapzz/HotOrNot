"use client";

import { useState } from "react";
import { useToast } from "./Toast";

interface ExportButtonProps {
  type: "content" | "keyword" | "account" | "batch";
  id: string;
  className?: string;
}

export function ExportButton({ type, id, className = "" }: ExportButtonProps) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: "excel" | "pdf") => {
    setLoading(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/export/${type}/${id}?format=${format}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HotOrNot_${type}_${new Date().toISOString().split("T")[0]}.${format === "excel" ? "xlsx" : "pdf"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("导出失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
      >
        {loading ? (
          <span className="animate-pulse">导出中...</span>
        ) : (
          <>
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            导出
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-1 w-36 bg-white rounded-md shadow-lg border border-gray-200">
          <button
            onClick={() => handleExport("excel")}
            className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
          >
            📊 Excel (.xlsx)
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
          >
            📄 PDF
          </button>
        </div>
      )}
    </div>
  );
}

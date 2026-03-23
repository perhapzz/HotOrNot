"use client";

import { useState, useMemo } from "react";

interface FilterBarProps {
  /** Available platform options */
  platforms?: string[];
  /** Callback with filtered params */
  onFilter: (filters: FilterState) => void;
  /** Show platform filter */
  showPlatform?: boolean;
  /** Show date range filter */
  showDateRange?: boolean;
  /** Placeholder for search */
  placeholder?: string;
}

export interface FilterState {
  search: string;
  platform: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  "": "全部平台",
  xiaohongshu: "小红书",
  douyin: "抖音",
  bilibili: "B站",
  weibo: "微博",
};

export function FilterBar({
  platforms = ["xiaohongshu", "douyin", "bilibili", "weibo"],
  onFilter,
  showPlatform = true,
  showDateRange = true,
  placeholder = "搜索关键词、标题...",
}: FilterBarProps) {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const emit = (override: Partial<FilterState> = {}) => {
    onFilter({
      search,
      platform,
      dateFrom,
      dateTo,
      sortBy,
      ...override,
    });
  };

  const handleReset = () => {
    setSearch("");
    setPlatform("");
    setDateFrom("");
    setDateTo("");
    setSortBy("newest");
    onFilter({ search: "", platform: "", dateFrom: "", dateTo: "", sortBy: "newest" });
  };

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              emit({ search: e.target.value });
            }}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
        <button
          onClick={handleReset}
          className="px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
        >
          重置
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2">
        {showPlatform && (
          <select
            value={platform}
            onChange={(e) => {
              setPlatform(e.target.value);
              emit({ platform: e.target.value });
            }}
            className="text-sm border rounded-lg px-3 py-1.5 bg-white"
          >
            {["", ...platforms].map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABELS[p] || p}
              </option>
            ))}
          </select>
        )}

        {showDateRange && (
          <>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                emit({ dateFrom: e.target.value });
              }}
              className="text-sm border rounded-lg px-2 py-1.5"
              placeholder="开始日期"
            />
            <span className="text-gray-400 self-center">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                emit({ dateTo: e.target.value });
              }}
              className="text-sm border rounded-lg px-2 py-1.5"
              placeholder="结束日期"
            />
          </>
        )}

        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            emit({ sortBy: e.target.value });
          }}
          className="text-sm border rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="newest">最新优先</option>
          <option value="oldest">最早优先</option>
          <option value="score">热度排序</option>
        </select>
      </div>
    </div>
  );
}

/**
 * Client-side filter helper for hotlist/history items.
 */
export function useClientFilter<T extends Record<string, any>>(
  items: T[],
  filters: FilterState,
  options: {
    searchFields?: string[];
    platformField?: string;
    dateField?: string;
    scoreField?: string;
  } = {}
): T[] {
  const {
    searchFields = ["title", "keyword", "url"],
    platformField = "platform",
    dateField = "createdAt",
    scoreField = "score",
  } = options;

  return useMemo(() => {
    let result = [...items];

    // Text search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) =>
          String(item[field] || "")
            .toLowerCase()
            .includes(q)
        )
      );
    }

    // Platform filter
    if (filters.platform) {
      result = result.filter(
        (item) => item[platformField] === filters.platform
      );
    }

    // Date range
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      result = result.filter(
        (item) => new Date(item[dateField]) >= from
      );
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo + "T23:59:59");
      result = result.filter(
        (item) => new Date(item[dateField]) <= to
      );
    }

    // Sort
    if (filters.sortBy === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime()
      );
    } else if (filters.sortBy === "score") {
      result.sort(
        (a, b) => (Number(b[scoreField]) || 0) - (Number(a[scoreField]) || 0)
      );
    } else {
      result.sort(
        (a, b) =>
          new Date(b[dateField]).getTime() - new Date(a[dateField]).getTime()
      );
    }

    return result;
  }, [items, filters, searchFields, platformField, dateField, scoreField]);
}

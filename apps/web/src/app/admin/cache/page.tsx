"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/Toast";

interface CacheModuleConfig {
  name: string;
  key: string;
  hours: number;
  description: string;
}

const CACHE_MODULES: CacheModuleConfig[] = [
  {
    name: "关键词分析",
    key: "keywordAnalysis",
    hours: 24,
    description: "KEYWORD_ANALYSIS_CACHE_HOURS",
  },
  {
    name: "内容分析",
    key: "contentAnalysis",
    hours: 6,
    description: "CONTENT_ANALYSIS_CACHE_HOURS",
  },
  {
    name: "账号分析",
    key: "accountAnalysis",
    hours: 12,
    description: "ACCOUNT_ANALYSIS_CACHE_HOURS",
  },
  {
    name: "热点数据",
    key: "hotlistData",
    hours: 3,
    description: "HOTLIST_DATA_CACHE_HOURS",
  },
];

export default function CacheManagementPage() {
  const toast = useToast();
  const [config, setConfig] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch("/api/cache/config");
        if (res.ok) {
          const data = await res.json();
          setConfig(data.data ?? data);
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  async function handleClearCache(moduleKey: string) {
    setClearing(moduleKey);
    try {
      const res = await fetch(`/api/cache/clear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: moduleKey }),
      });
      if (res.ok) {
        toast.success(`${moduleKey} 缓存已清除`);
      } else {
        toast.error("清除失败，请重试");
      }
    } catch {
      toast.error("请求失败");
    } finally {
      setClearing(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">缓存管理</h2>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                模块
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                缓存时长
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                环境变量
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {CACHE_MODULES.map((mod) => {
              const hours = config?.[mod.key] ?? mod.hours;
              return (
                <tr key={mod.key} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">
                      {mod.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {hours} 小时
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                      {mod.description}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleClearCache(mod.key)}
                      disabled={clearing === mod.key}
                      className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {clearing === mod.key ? "清除中..." : "清除缓存"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          💡 缓存时长可通过环境变量配置。修改后需重启服务生效。
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

interface ApiKeyItem {
  _id: string;
  key?: string;
  keyPreview: string;
  name: string;
  permissions: string[];
  rateLimit: number;
  totalCalls: number;
  lastUsedAt?: string;
  createdAt: string;
}

const PERM_LABELS: Record<string, string> = {
  "analysis:content": "内容分析",
  "analysis:keyword": "关键词分析",
  "hotlist:read": "热榜数据",
};

export default function DeveloperPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/developer/keys");
      const json = await res.json();
      if (json.success) setKeys(json.data);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const createKey = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const json = await res.json();
      if (json.success) {
        setNewKey(json.data.key);
        setNewName("");
        fetchKeys();
        setMsg({ type: "ok", text: "API key 创建成功！请立即保存，此 key 不会再次显示。" });
      } else {
        setMsg({ type: "err", text: json.error });
      }
    } catch {
      setMsg({ type: "err", text: "创建失败" });
    } finally {
      setCreating(false);
    }
  };

  const deleteKey = async (keyId: string) => {
    if (!confirm("确定删除此 API key？")) return;
    try {
      const res = await fetch("/api/developer/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });
      const json = await res.json();
      if (json.success) {
        setKeys((k) => k.filter((item) => item._id !== keyId));
        setMsg({ type: "ok", text: "已删除" });
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader activePath="/developer" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {msg && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {msg.text}
            <button onClick={() => setMsg(null)} className="float-right font-bold">×</button>
          </div>
        )}

        {newKey && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm font-medium text-yellow-800 mb-2">⚠️ 请立即保存此 API Key（仅显示一次）：</p>
            <code className="block p-3 bg-white rounded-lg text-sm break-all font-mono">{newKey}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newKey);
                setNewKey(null);
              }}
              className="mt-2 px-3 py-1 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              📋 复制并关闭
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Key */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold mb-4">🔑 创建 API Key</h2>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Key 名称（如：我的应用）"
                className="w-full px-3 py-2 border rounded-lg mb-3 text-sm"
                maxLength={50}
              />
              <button
                onClick={createKey}
                disabled={creating || !newName.trim()}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? "创建中..." : "创建 Key"}
              </button>
              <p className="text-xs text-gray-400 mt-2">每个账户最多 5 个 key，默认 60 次/分钟</p>
            </div>
          </div>

          {/* Keys List + Docs */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Keys */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold mb-4">📋 我的 API Keys</h2>
              {loading ? (
                <p className="text-gray-400 text-sm">加载中...</p>
              ) : keys.length === 0 ? (
                <p className="text-gray-400 text-sm">暂无 API key</p>
              ) : (
                <div className="space-y-3">
                  {keys.map((k) => (
                    <div key={k._id} className="p-4 border border-gray-100 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{k.name}</h3>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{k.keyPreview}</p>
                        </div>
                        <button
                          onClick={() => deleteKey(k._id)}
                          className="px-3 py-1 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                        >
                          删除
                        </button>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>调用: {k.totalCalls}</span>
                        <span>限流: {k.rateLimit}/min</span>
                        <span>
                          权限: {k.permissions.map((p) => PERM_LABELS[p] || p).join(", ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* API Documentation */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold mb-4">📖 API 文档</h2>
              <p className="text-sm text-gray-600 mb-4">
                所有请求需在 Header 中携带 <code className="bg-gray-100 px-1 rounded">X-API-Key</code>
              </p>

              <div className="space-y-6">
                {/* Content Analysis */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">POST /api/v1/analysis/content</h3>
                  <p className="text-xs text-gray-500 mb-2">权限: analysis:content</p>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto">{`curl -X POST https://hotornot.app/api/v1/analysis/content \\
  -H "X-API-Key: hon_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://douyin.com/video/123"}'

// Response
{
  "success": true,
  "data": {
    "id": "...",
    "platform": "douyin",
    "title": "...",
    "analysis": { "score": 85, "pros": [...], "cons": [...] }
  }
}`}</pre>
                </div>

                {/* Keyword Analysis */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">POST /api/v1/analysis/keyword</h3>
                  <p className="text-xs text-gray-500 mb-2">权限: analysis:keyword</p>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto">{`curl -X POST https://hotornot.app/api/v1/analysis/keyword \\
  -H "X-API-Key: hon_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"keyword": "美食", "platform": "xiaohongshu"}'`}</pre>
                </div>

                {/* Hotlist */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">GET /api/v1/hotlist/:platform</h3>
                  <p className="text-xs text-gray-500 mb-2">权限: hotlist:read · 平台: douyin, xiaohongshu, bilibili, weibo</p>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto">{`curl https://hotornot.app/api/v1/hotlist/douyin \\
  -H "X-API-Key: hon_your_key_here"

// Response
{
  "success": true,
  "data": {
    "platform": "douyin",
    "fetchedAt": "2026-03-23T15:00:00Z",
    "items": [{ "title": "...", "rank": 1, "hotValue": 50000 }, ...]
  }
}`}</pre>
                </div>

                {/* Error Codes */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">错误码</h3>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-gray-500">
                        <th className="text-left py-2">状态码</th>
                        <th className="text-left py-2">含义</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600">
                      <tr className="border-b border-gray-50"><td className="py-2">401</td><td>缺少 API key 或 key 无效</td></tr>
                      <tr className="border-b border-gray-50"><td className="py-2">403</td><td>权限不足</td></tr>
                      <tr className="border-b border-gray-50"><td className="py-2">429</td><td>超出速率限制</td></tr>
                      <tr><td className="py-2">500</td><td>服务器内部错误</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

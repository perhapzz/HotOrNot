"use client";

import { useState, useEffect } from "react";

interface Channel {
  type: "dingtalk" | "feishu" | "email";
  webhook?: string;
  address?: string;
  enabled: boolean;
}

interface Rule {
  platform: string;
  keyword?: string;
  threshold: number;
}

export default function NotificationSettingsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (data.data) {
          setChannels(data.data.channels || []);
          setRules(data.data.rules || []);
          setEnabled(data.data.enabled !== false);
        }
      })
      .catch(() => {});
  }, []);

  const addChannel = (type: Channel["type"]) => {
    setChannels([...channels, { type, enabled: true }]);
  };

  const updateChannel = (index: number, updates: Partial<Channel>) => {
    const updated = [...channels];
    updated[index] = { ...updated[index], ...updates };
    setChannels(updated);
  };

  const removeChannel = (index: number) => {
    setChannels(channels.filter((_, i) => i !== index));
  };

  const addRule = () => {
    setRules([...rules, { platform: "all", threshold: 10 }]);
  };

  const updateRule = (index: number, updates: Partial<Rule>) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], ...updates };
    setRules(updated);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channels, rules, enabled }),
      });
      const data = await res.json();
      setMessage(data.success ? "保存成功 ✅" : "保存失败");
    } catch {
      setMessage("保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">通知设置</h1>
        <p className="text-gray-500 mb-8">
          配置热榜变动通知，支持钉钉、飞书 Webhook 和邮件推送
        </p>

        {/* Master toggle */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">启用通知</h2>
              <p className="text-sm text-gray-500">
                总开关，关闭后所有通知暂停
              </p>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                enabled ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  enabled ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Channels */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">通知渠道</h2>

          {channels.map((ch, i) => (
            <div
              key={i}
              className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg"
            >
              <span className="text-sm font-medium w-16">
                {ch.type === "dingtalk"
                  ? "钉钉"
                  : ch.type === "feishu"
                    ? "飞书"
                    : "邮件"}
              </span>
              {ch.type === "email" ? (
                <input
                  type="email"
                  value={ch.address || ""}
                  onChange={(e) =>
                    updateChannel(i, { address: e.target.value })
                  }
                  placeholder="email@example.com"
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                />
              ) : (
                <input
                  type="url"
                  value={ch.webhook || ""}
                  onChange={(e) =>
                    updateChannel(i, { webhook: e.target.value })
                  }
                  placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                />
              )}
              <button
                onClick={() => updateChannel(i, { enabled: !ch.enabled })}
                className={`text-xs px-2 py-1 rounded ${
                  ch.enabled
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {ch.enabled ? "启用" : "禁用"}
              </button>
              <button
                onClick={() => removeChannel(i)}
                className="text-red-400 hover:text-red-600 text-sm"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => addChannel("dingtalk")}
              className="text-sm px-3 py-1.5 border rounded-md hover:bg-gray-50"
            >
              + 钉钉
            </button>
            <button
              onClick={() => addChannel("feishu")}
              className="text-sm px-3 py-1.5 border rounded-md hover:bg-gray-50"
            >
              + 飞书
            </button>
            <button
              onClick={() => addChannel("email")}
              className="text-sm px-3 py-1.5 border rounded-md hover:bg-gray-50"
            >
              + 邮件
            </button>
          </div>
        </div>

        {/* Rules */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">关注规则</h2>

          {rules.map((rule, i) => (
            <div
              key={i}
              className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg"
            >
              <select
                value={rule.platform}
                onChange={(e) => updateRule(i, { platform: e.target.value })}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">全部平台</option>
                <option value="douyin">抖音</option>
                <option value="xiaohongshu">小红书</option>
                <option value="bilibili">B站</option>
                <option value="weibo">微博</option>
              </select>
              <input
                type="text"
                value={rule.keyword || ""}
                onChange={(e) => updateRule(i, { keyword: e.target.value })}
                placeholder="关键词（可选）"
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">排名变动≥</span>
                <input
                  type="number"
                  value={rule.threshold}
                  onChange={(e) =>
                    updateRule(i, { threshold: Number(e.target.value) })
                  }
                  className="w-16 px-2 py-2 border rounded-md text-sm"
                  min={1}
                />
              </div>
              <button
                onClick={() => removeRule(i)}
                className="text-red-400 hover:text-red-600 text-sm"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={addRule}
            className="text-sm px-3 py-1.5 border rounded-md hover:bg-gray-50 mt-2"
          >
            + 添加规则
          </button>
        </div>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存设置"}
          </button>
          {message && (
            <span className="text-sm text-gray-600">{message}</span>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, FormEvent } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useToast } from "@/components/Toast";
import { useOnboarding } from "@/components/Onboarding";

type Tab = "profile" | "password" | "notification" | "preference" | "data";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "profile", label: "个人资料", icon: "👤" },
  { key: "password", label: "修改密码", icon: "🔒" },
  { key: "notification", label: "通知设置", icon: "🔔" },
  { key: "preference", label: "偏好设置", icon: "⚙️" },
  { key: "data", label: "数据管理", icon: "📦" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const toast = useToast();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader title="用户设置" subtitle="管理你的账户和偏好" />

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Tabs */}
        <div className="flex overflow-x-auto gap-1 mb-6 bg-white dark:bg-gray-800 rounded-lg p-1 border dark:border-gray-700">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-md whitespace-nowrap transition-colors ${
                tab === t.key
                  ? "bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          {tab === "profile" && <ProfileTab toast={toast} />}
          {tab === "password" && <PasswordTab toast={toast} />}
          {tab === "notification" && <NotificationTab toast={toast} />}
          {tab === "preference" && <PreferenceTab toast={toast} />}
          {tab === "data" && <DataTab toast={toast} />}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setUsername(d.data.username || "");
          setEmail(d.data.email || "");
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (res.ok) toast.success("个人资料已更新");
      else toast.error("更新失败");
    } catch {
      toast.error("请求失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 max-w-md">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">个人资料</h3>
      <div>
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">用户名</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">邮箱</label>
        <input
          value={email}
          disabled
          className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 dark:bg-gray-700 dark:border-gray-600"
        />
        <p className="text-xs text-gray-400 mt-1">邮箱不可修改</p>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "保存中..." : "保存"}
      </button>
    </form>
  );
}

function PasswordTab({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirm) {
      toast.error("两次输入的密码不一致");
      return;
    }
    if (newPwd.length < 6) {
      toast.error("密码至少 6 个字符");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: newPwd }),
      });
      if (res.ok) {
        toast.success("密码已更新");
        setCurrent("");
        setNewPwd("");
        setConfirm("");
      } else {
        const d = await res.json();
        toast.error(d.error || "密码修改失败");
      }
    } catch {
      toast.error("请求失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">修改密码</h3>
      <div>
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">当前密码</label>
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">新密码</label>
        <input
          type="password"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">确认新密码</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "更新中..." : "更新密码"}
      </button>
    </form>
  );
}

function NotificationTab({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
    const saved = localStorage.getItem("hotornot_notify_enabled");
    if (saved === "true") setEnabled(true);
  }, []);

  const toggle = async () => {
    if (!enabled && permission !== "granted") {
      const p = await Notification.requestPermission();
      setPermission(p);
      if (p !== "granted") {
        toast.error("请在浏览器设置中允许通知");
        return;
      }
    }
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("hotornot_notify_enabled", String(next));
    toast.success(next ? "通知已开启" : "通知已关闭");
  };

  return (
    <div className="space-y-4 max-w-md">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">通知设置</h3>
      <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-600">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">浏览器通知</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">关注的关键词上热榜时提醒</p>
        </div>
        <button
          onClick={toggle}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-6" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
      {permission === "denied" && (
        <p className="text-sm text-red-500">浏览器已拒绝通知权限，请在设置中手动开启</p>
      )}
    </div>
  );
}

function PreferenceTab({ toast }: { toast: ReturnType<typeof useToast> }) {
  const { reset: resetOnboarding } = useOnboarding();
  const [lang, setLang] = useState("zh");

  useEffect(() => {
    const saved = localStorage.getItem("hotornot_lang") || "zh";
    setLang(saved);
  }, []);

  return (
    <div className="space-y-6 max-w-md">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">偏好设置</h3>

      {/* Language */}
      <div>
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">语言</label>
        <select
          value={lang}
          onChange={(e) => {
            setLang(e.target.value);
            localStorage.setItem("hotornot_lang", e.target.value);
            toast.success("语言偏好已保存，刷新后生效");
          }}
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="zh">中文</option>
          <option value="en">English</option>
        </select>
      </div>

      {/* Theme — already in header toggle, but link here */}
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          主题设置请使用页面右上角的 ☀️/🌙 切换按钮
        </p>
      </div>

      {/* Re-trigger onboarding */}
      <div>
        <button
          onClick={() => {
            resetOnboarding();
            toast.success("引导已重置，刷新页面后将重新显示");
          }}
          className="px-4 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          🔄 重新显示新手引导
        </button>
      </div>
    </div>
  );
}

function DataTab({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/export", { credentials: "include" });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hotornot-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("数据导出成功");
    } catch {
      toast.error("导出失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">数据管理</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        导出你的所有分析记录和个人数据为 JSON 文件。
      </p>
      <button
        onClick={handleExport}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "导出中..." : "📥 导出我的数据"}
      </button>
    </div>
  );
}

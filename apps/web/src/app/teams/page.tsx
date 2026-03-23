"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

interface TeamMember {
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: TeamMember[];
  inviteCode: string;
  createdAt: string;
}

interface SharedItem {
  _id: string;
  analysisId: string;
  analysisType: string;
  sharedBy: string;
  note?: string;
  createdAt: string;
}

const ROLE_NAMES: Record<string, string> = { owner: "所有者", admin: "管理员", member: "成员" };
const TYPE_NAMES: Record<string, string> = { content: "内容分析", account: "账号分析", keyword: "关键词分析" };

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinTeamId, setJoinTeamId] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [sharedItems, setSharedItems] = useState<SharedItem[]>([]);
  const [showInvite, setShowInvite] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/teams");
      const json = await res.json();
      if (json.success) setTeams(json.data);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const createTeam = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });
      const json = await res.json();
      if (json.success) {
        setTeams((t) => [json.data, ...t]);
        setNewName("");
        setNewDesc("");
        setMsg({ type: "ok", text: "团队创建成功" });
      } else {
        setMsg({ type: "err", text: json.error });
      }
    } catch {
      setMsg({ type: "err", text: "创建失败" });
    } finally {
      setCreating(false);
    }
  };

  const joinTeam = async () => {
    if (!joinTeamId || !joinCode) return;
    try {
      const res = await fetch(`/api/teams/${joinTeamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: joinCode }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg({ type: "ok", text: "已加入团队" });
        fetchTeams();
        setJoinCode("");
        setJoinTeamId("");
      } else {
        setMsg({ type: "err", text: json.error });
      }
    } catch {
      setMsg({ type: "err", text: "加入失败" });
    }
  };

  const viewTeamFeed = async (team: Team) => {
    setSelectedTeam(team);
    try {
      const res = await fetch(`/api/teams/${team._id}/share?limit=20`);
      const json = await res.json();
      if (json.success) setSharedItems(json.data);
    } catch {}
  };

  const copyInvite = (team: Team) => {
    const text = `加入团队「${team.name}」\n团队ID: ${team._id}\n邀请码: ${team.inviteCode}`;
    navigator.clipboard.writeText(text);
    setShowInvite(team._id);
    setTimeout(() => setShowInvite(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader activePath="/teams" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {msg && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {msg.text}
            <button onClick={() => setMsg(null)} className="float-right font-bold">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Create + Join */}
          <div className="space-y-6">
            {/* Create */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold mb-4">➕ 创建团队</h2>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="团队名称"
                className="w-full px-3 py-2 border rounded-lg mb-3 text-sm"
                maxLength={50}
              />
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="团队描述（可选）"
                className="w-full px-3 py-2 border rounded-lg mb-3 text-sm"
                maxLength={200}
              />
              <button
                onClick={createTeam}
                disabled={creating || !newName.trim()}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? "创建中..." : "创建团队"}
              </button>
            </div>

            {/* Join */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold mb-4">🔗 加入团队</h2>
              <input
                value={joinTeamId}
                onChange={(e) => setJoinTeamId(e.target.value)}
                placeholder="团队 ID"
                className="w-full px-3 py-2 border rounded-lg mb-3 text-sm"
              />
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="邀请码"
                className="w-full px-3 py-2 border rounded-lg mb-3 text-sm"
              />
              <button
                onClick={joinTeam}
                disabled={!joinTeamId || !joinCode}
                className="w-full py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
              >
                加入团队
              </button>
            </div>
          </div>

          {/* Right: Team list + Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* My teams */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold mb-4">👥 我的团队</h2>
              {teams.length === 0 ? (
                <p className="text-gray-400 text-sm">暂无团队，创建一个开始协作吧</p>
              ) : (
                <div className="space-y-3">
                  {teams.map((team) => (
                    <div
                      key={team._id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTeam?._id === team._id ? "border-indigo-300 bg-indigo-50" : "border-gray-100 hover:bg-gray-50"
                      }`}
                      onClick={() => viewTeamFeed(team)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{team.name}</h3>
                          {team.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{team.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {team.members.length} 成员 · 创建于 {new Date(team.createdAt).toLocaleDateString("zh-CN")}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyInvite(team);
                          }}
                          className="px-3 py-1 text-xs border border-gray-200 rounded-lg hover:bg-gray-100"
                        >
                          {showInvite === team._id ? "✅ 已复制" : "📋 邀请"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Team feed */}
            {selectedTeam && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">
                  📄 「{selectedTeam.name}」共享分析
                </h2>
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    成员: {selectedTeam.members.map((m) => `${m.userId.slice(-4)}(${ROLE_NAMES[m.role]})`).join(", ")}
                  </span>
                </div>
                {sharedItems.length === 0 ? (
                  <p className="text-gray-400 text-sm">暂无共享分析</p>
                ) : (
                  <div className="space-y-2">
                    {sharedItems.map((item) => (
                      <div key={item._id} className="p-3 border border-gray-100 rounded-lg text-sm">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">
                            {TYPE_NAMES[item.analysisType] || item.analysisType}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(item.createdAt).toLocaleDateString("zh-CN")}
                          </span>
                        </div>
                        {item.note && (
                          <p className="text-gray-600 mt-1">{item.note}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">ID: {item.analysisId}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

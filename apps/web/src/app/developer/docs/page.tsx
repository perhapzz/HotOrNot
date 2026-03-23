"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  auth: "api_key" | "cookie" | "none";
  params?: { name: string; type: string; required: boolean; description: string }[];
  body?: { name: string; type: string; required: boolean; description: string }[];
  response: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "POST",
    path: "/api/v1/analysis/content",
    description: "分析单条内容 URL（小红书、抖音、B站、微博）",
    auth: "api_key",
    body: [
      { name: "url", type: "string", required: true, description: "内容链接" },
    ],
    response: '{ "success": true, "data": { "id": "...", "analysis": { "overallScore": 85, "summary": "...", "suggestions": [...] } } }',
  },
  {
    method: "POST",
    path: "/api/v1/analysis/keyword",
    description: "分析关键词热度和竞争情况",
    auth: "api_key",
    body: [
      { name: "keyword", type: "string", required: true, description: "要分析的关键词" },
      { name: "platform", type: "string", required: false, description: "平台：xiaohongshu | douyin | bilibili | weibo" },
    ],
    response: '{ "success": true, "data": { "id": "...", "analysis": { "hotScore": 72, "competition": "中等", "suggestions": [...] } } }',
  },
  {
    method: "POST",
    path: "/api/v1/analysis/account",
    description: "分析账号影响力和运营建议",
    auth: "api_key",
    body: [
      { name: "platform", type: "string", required: true, description: "平台名" },
      { name: "username", type: "string", required: true, description: "账号用户名" },
    ],
    response: '{ "success": true, "data": { "id": "...", "analysis": { "overallScore": 78, "influence": "中高", "suggestions": [...] } } }',
  },
  {
    method: "POST",
    path: "/api/v1/analysis/compare",
    description: "竞品对比分析（2-5 个目标）",
    auth: "api_key",
    body: [
      { name: "targets", type: "string[]", required: true, description: "2-5 个 URL 或用户名" },
      { name: "type", type: "string", required: true, description: "content 或 account" },
    ],
    response: '{ "success": true, "data": { "results": [...], "comparison": { "dimensions": [...], "items": [...] } } }',
  },
  {
    method: "GET",
    path: "/api/v1/hotlist/{platform}",
    description: "获取平台热榜数据",
    auth: "none",
    params: [
      { name: "platform", type: "string", required: true, description: "douyin | xiaohongshu | bilibili | weibo" },
    ],
    response: '{ "success": true, "data": { "items": [{ "title": "...", "rank": 1, "heat": 1000000 }] } }',
  },
  {
    method: "GET",
    path: "/api/v1/user/history",
    description: "获取用户分析历史",
    auth: "api_key",
    params: [
      { name: "type", type: "string", required: false, description: "content | keyword | account" },
      { name: "page", type: "number", required: false, description: "页码（默认 1）" },
    ],
    response: '{ "success": true, "data": { "items": [...], "total": 42, "page": 1 } }',
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-100 text-green-700",
  POST: "bg-blue-100 text-blue-700",
  PUT: "bg-yellow-100 text-yellow-700",
  DELETE: "bg-red-100 text-red-700",
};

function generateCurl(ep: Endpoint): string {
  const headers = ep.auth === "api_key" ? '-H "X-API-Key: YOUR_API_KEY" ' : "";
  if (ep.method === "GET") {
    return `curl ${headers}${process.env.NEXT_PUBLIC_SITE_URL || "https://hotornot.app"}${ep.path}`;
  }
  const body = ep.body
    ? `-d '${JSON.stringify(Object.fromEntries(ep.body.map((b) => [b.name, b.type === "string[]" ? ["example1", "example2"] : `example_${b.name}`])))}'`
    : "";
  return `curl -X ${ep.method} ${headers}-H "Content-Type: application/json" \\\n  ${body} \\\n  ${process.env.NEXT_PUBLIC_SITE_URL || "https://hotornot.app"}${ep.path}`;
}

function generateJS(ep: Endpoint): string {
  const headers: Record<string, string> = {};
  if (ep.auth === "api_key") headers["X-API-Key"] = "YOUR_API_KEY";
  if (ep.body) headers["Content-Type"] = "application/json";

  const body = ep.body
    ? `,\n  body: JSON.stringify(${JSON.stringify(Object.fromEntries(ep.body.map((b) => [b.name, b.type === "string[]" ? ["example"] : `example`])), null, 4)})`
    : "";

  return `const res = await fetch("${process.env.NEXT_PUBLIC_SITE_URL || "https://hotornot.app"}${ep.path}", {
  method: "${ep.method}",
  headers: ${JSON.stringify(headers, null, 4)}${body}
});
const data = await res.json();
console.log(data);`;
}

function generatePython(ep: Endpoint): string {
  const headers: Record<string, string> = {};
  if (ep.auth === "api_key") headers["X-API-Key"] = "YOUR_API_KEY";
  if (ep.body) headers["Content-Type"] = "application/json";

  if (ep.method === "GET") {
    return `import requests\n\nres = requests.get(\n    "${process.env.NEXT_PUBLIC_SITE_URL || "https://hotornot.app"}${ep.path}",\n    headers=${JSON.stringify(headers)}\n)\nprint(res.json())`;
  }

  const body = ep.body
    ? Object.fromEntries(ep.body.map((b) => [b.name, b.type === "string[]" ? ["example"] : "example"]))
    : {};

  return `import requests\n\nres = requests.${ep.method.toLowerCase()}(\n    "${process.env.NEXT_PUBLIC_SITE_URL || "https://hotornot.app"}${ep.path}",\n    headers=${JSON.stringify(headers)},\n    json=${JSON.stringify(body)}\n)\nprint(res.json())`;
}

export default function ApiDocsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tryItInputs, setTryItInputs] = useState<Record<string, string>>({});
  const [tryItResults, setTryItResults] = useState<Record<string, string>>({});
  const [codeLang, setCodeLang] = useState<"curl" | "js" | "python">("curl");

  const tryIt = async (ep: Endpoint) => {
    const key = ep.path;
    try {
      const apiKey = tryItInputs[`${key}_apikey`] || "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers["X-API-Key"] = apiKey;

      let url = ep.path;
      let options: RequestInit = { method: ep.method, headers };

      if (ep.body) {
        const body: Record<string, any> = {};
        ep.body.forEach((b) => {
          const val = tryItInputs[`${key}_${b.name}`] || "";
          body[b.name] = b.type === "string[]" ? val.split(",").map((s) => s.trim()) : val;
        });
        options.body = JSON.stringify(body);
      }

      const res = await fetch(url, options);
      const data = await res.json();
      setTryItResults({ ...tryItResults, [key]: JSON.stringify(data, null, 2) });
    } catch (err: any) {
      setTryItResults({ ...tryItResults, [key]: `Error: ${err.message}` });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          📚 API 文档
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          使用 API Key 访问 HotOrNot 的全部分析能力。
          在 <a href="/settings" className="text-blue-600 underline">设置页</a> 创建 API Key。
        </p>

        {/* Auth section */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 mb-6">
          <h2 className="font-medium mb-2">🔑 认证方式</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            在请求 header 中添加 <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm">X-API-Key: hon_your_key_here</code>
          </p>
        </div>

        {/* Code language selector */}
        <div className="flex gap-1 mb-4">
          {(["curl", "js", "python"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setCodeLang(lang)}
              className={`px-3 py-1 text-xs rounded ${
                codeLang === lang
                  ? "bg-gray-800 text-white dark:bg-white dark:text-gray-800"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              {lang === "js" ? "JavaScript" : lang === "python" ? "Python" : "cURL"}
            </button>
          ))}
        </div>

        {/* Endpoints */}
        <div className="space-y-3">
          {ENDPOINTS.map((ep) => {
            const key = ep.path;
            const isOpen = expanded === key;
            return (
              <div
                key={key}
                className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : key)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-750"
                >
                  <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded ${METHOD_COLORS[ep.method]}`}>
                    {ep.method}
                  </span>
                  <code className="text-sm font-mono text-gray-700 dark:text-gray-300">
                    {ep.path}
                  </code>
                  <span className="text-sm text-gray-500 ml-auto">{ep.description}</span>
                </button>

                {isOpen && (
                  <div className="p-4 border-t dark:border-gray-700 space-y-4">
                    {/* Parameters */}
                    {(ep.params || ep.body) && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">参数</h4>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-500">
                              <th className="pb-1">名称</th>
                              <th className="pb-1">类型</th>
                              <th className="pb-1">必填</th>
                              <th className="pb-1">说明</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...(ep.params || []), ...(ep.body || [])].map((p) => (
                              <tr key={p.name} className="border-t dark:border-gray-700">
                                <td className="py-1 font-mono text-blue-600">{p.name}</td>
                                <td className="py-1 text-gray-500">{p.type}</td>
                                <td className="py-1">{p.required ? "✅" : "—"}</td>
                                <td className="py-1 text-gray-600 dark:text-gray-400">{p.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Code sample */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">代码示例</h4>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto">
                        {codeLang === "curl"
                          ? generateCurl(ep)
                          : codeLang === "js"
                            ? generateJS(ep)
                            : generatePython(ep)}
                      </pre>
                    </div>

                    {/* Response */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">响应示例</h4>
                      <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-xs overflow-x-auto">
                        {ep.response}
                      </pre>
                    </div>

                    {/* Try it */}
                    <div className="border-t dark:border-gray-700 pt-4">
                      <h4 className="text-sm font-medium mb-2">🧪 在线试用</h4>
                      {ep.auth === "api_key" && (
                        <input
                          placeholder="API Key (hon_...)"
                          value={tryItInputs[`${key}_apikey`] || ""}
                          onChange={(e) =>
                            setTryItInputs({ ...tryItInputs, [`${key}_apikey`]: e.target.value })
                          }
                          className="w-full mb-2 px-3 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                        />
                      )}
                      {(ep.body || []).map((b) => (
                        <input
                          key={b.name}
                          placeholder={`${b.name} (${b.description})`}
                          value={tryItInputs[`${key}_${b.name}`] || ""}
                          onChange={(e) =>
                            setTryItInputs({ ...tryItInputs, [`${key}_${b.name}`]: e.target.value })
                          }
                          className="w-full mb-2 px-3 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                        />
                      ))}
                      <button
                        onClick={() => tryIt(ep)}
                        className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        发送请求
                      </button>
                      {tryItResults[key] && (
                        <pre className="mt-2 bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto max-h-48">
                          {tryItResults[key]}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ArticleRow {
  id: string;
  title_zh: string;
  sources: { name: string } | null;
  published_at: string | null;
  hidden: boolean;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function AdminArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetch("/api/admin/articles")
      .then((r) => {
        if (r.status === 401) router.push("/admin");
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setArticles(data);
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function toggleHidden(id: string, hidden: boolean) {
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, hidden } : a))
    );
    await fetch("/api/admin/articles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, hidden }),
    });
  }

  async function triggerFetch() {
    setFetching(true);
    await fetch("/api/admin/fetch", { method: "POST" });
    setFetching(false);
    // 刷新列表
    const r = await fetch("/api/admin/articles");
    const data = await r.json();
    if (Array.isArray(data)) setArticles(data);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-noto-serif-sc), serif" }}>
          文章管理
        </h2>
        <button
          onClick={triggerFetch}
          disabled={fetching}
          className="text-sm px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: "var(--brand)", color: "#fff" }}
        >
          {fetching ? "抓取中..." : "手动抓取"}
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>加载中...</p>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted)" }}>标题</th>
                <th className="text-left px-4 py-3 font-medium w-28" style={{ color: "var(--muted)" }}>信源</th>
                <th className="text-left px-4 py-3 font-medium w-16" style={{ color: "var(--muted)" }}>日期</th>
                <th className="text-center px-4 py-3 font-medium w-20" style={{ color: "var(--muted)" }}>显示</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr
                  key={a.id}
                  className="border-t"
                  style={{
                    background: "var(--card-bg)",
                    borderColor: "var(--border)",
                    opacity: a.hidden ? 0.5 : 1,
                  }}
                >
                  <td className="px-4 py-3 leading-snug">
                    <span className="line-clamp-1">{a.title_zh}</span>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>
                    {a.sources?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>
                    {formatDate(a.published_at)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleHidden(a.id, !a.hidden)}
                      className="w-10 h-6 rounded-full transition-colors relative"
                      style={{
                        background: a.hidden ? "var(--border)" : "var(--brand)",
                      }}
                    >
                      <span
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                        style={{ left: a.hidden ? "2px" : "calc(100% - 22px)" }}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

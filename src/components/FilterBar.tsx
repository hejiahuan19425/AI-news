"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

const FILTERS = [
  { value: "", label: "全部" },
  { value: "tech", label: "科技媒体" },
  { value: "news", label: "综合新闻" },
];

interface Props {
  currentSearch?: string;
  currentFilter?: string;
}

export default function FilterBar({ currentSearch = "", currentFilter = "" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);

  const navigate = useCallback(
    (q: string, filter: string) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (filter) params.set("filter", filter);
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [router, pathname]
  );

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {/* 搜索框 */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") navigate(search, currentFilter ?? "");
        }}
        placeholder="搜索文章..."
        className="flex-1 text-sm rounded-lg px-3 py-1.5 outline-none"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          color: "var(--text)",
        }}
      />

      {/* 筛选按钮 */}
      <div className="flex gap-1">
        {FILTERS.map((f) => {
          const active = (currentFilter ?? "") === f.value;
          return (
            <button
              key={f.value}
              onClick={() => navigate(search, f.value)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
              style={{
                background: active ? "var(--brand)" : "var(--card-bg)",
                color: active ? "#fff" : "var(--muted)",
                border: "1px solid " + (active ? "var(--brand)" : "var(--border)"),
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

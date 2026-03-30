import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Article } from "@/lib/articles";

export const revalidate = 300;

async function getArticle(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from("articles")
    .select("*, sources(name, type)")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Article;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

interface Section {
  title: string;
  content: string | null;
}

function DetailSection({ title, content }: Section) {
  if (!content) return null;
  return (
    <div className="mb-6 pl-4" style={{ borderLeft: "3px solid var(--brand)" }}>
      <h3
        className="text-sm font-semibold mb-2 uppercase tracking-wide"
        style={{ color: "var(--brand)" }}
      >
        {title}
      </h3>
      <p className="text-base leading-relaxed" style={{ color: "var(--text)" }}>
        {content}
      </p>
    </div>
  );
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  const sourceName = article.sources?.name ?? "未知来源";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 返回 */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm mb-6 transition-colors"
          style={{ color: "var(--muted)" }}
        >
          ← 返回
        </Link>

        {/* 来源 + 时间 */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: "var(--brand)18",
              color: "var(--brand)",
            }}
          >
            {sourceName}
          </span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {formatDate(article.published_at)}
          </span>
        </div>

        {/* 标题 */}
        <h1
          className="text-2xl font-bold leading-snug mb-4"
          style={{ fontFamily: "var(--font-noto-serif-sc), serif" }}
        >
          {article.title_zh}
        </h1>

        {/* 摘要 */}
        <p
          className="text-base leading-relaxed mb-8 pb-8 border-b"
          style={{ color: "var(--muted)", borderColor: "var(--border)" }}
        >
          {article.summary_zh}
        </p>

        {/* 三段详情 */}
        <DetailSection title="发生了什么" content={article.detail_what} />
        <DetailSection title="为什么重要" content={article.detail_why} />
        <DetailSection title="相关背景" content={article.detail_background} />

        {/* 标签 */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-sm px-2 py-1 rounded"
                style={{ background: "var(--border)", color: "var(--muted)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 原文链接 */}
        <div className="mt-8 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
          <a
            href={article.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: "var(--brand)", color: "#fff" }}
          >
            阅读原文 ↗
          </a>
        </div>
      </div>
    </div>
  );
}

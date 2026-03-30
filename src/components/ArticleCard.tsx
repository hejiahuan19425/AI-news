import Link from "next/link";
import type { Article } from "@/lib/articles";

const SOURCE_COLORS: Record<string, string> = {
  "BBC Technology": "#bb1919",
  "TechCrunch AI": "#0a8a3c",
  "The Verge": "#ff3c00",
  "Wired AI": "#000000",
  "MIT Technology Review": "#8b0000",
  "VentureBeat AI": "#1a73e8",
  "Ars Technica AI": "#ff6600",
  "The Guardian Technology": "#005689",
  "CNN Business": "#cc0000",
  "Bloomberg Technology": "#1f1f1f",
  "Engadget": "#00adef",
  "OpenAI Blog": "#10a37f",
  "Google AI Blog": "#4285f4",
  "Washington Post Technology": "#231f20",
};

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const hours = date.getHours().toString().padStart(2, "0");
  const mins = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

interface Props {
  article: Article;
}

export default function ArticleCard({ article }: Props) {
  const sourceName = article.sources?.name ?? "未知来源";
  const color = SOURCE_COLORS[sourceName] ?? "var(--brand)";

  return (
    <Link
      href={`/article/${article.id}`}
      className="block rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
      }}
    >
      {/* 来源 + 时间 */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: color + "18",
            color,
          }}
        >
          {sourceName}
        </span>
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          {formatTime(article.published_at)}
        </span>
      </div>

      {/* 标题 */}
      <h2
        className="text-base font-bold leading-snug mb-1"
        style={{ fontFamily: "var(--font-noto-serif-sc), serif" }}
      >
        {article.title_zh}
      </h2>

      {/* 摘要 */}
      <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "var(--muted)" }}>
        {article.summary_zh}
      </p>

      {/* 标签 */}
      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {article.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: "var(--border)",
                color: "var(--muted)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

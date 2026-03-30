import { getArticles, groupArticlesByDate } from "@/lib/articles";
import ArticleCard from "@/components/ArticleCard";
import FilterBar from "@/components/FilterBar";

export const revalidate = 300; // 5分钟缓存

interface Props {
  searchParams: Promise<{ q?: string; filter?: string }>;
}

export default async function HomePage({ searchParams }: Props) {
  const { q, filter } = await searchParams;
  const articles = await getArticles(q, filter);
  const groups = groupArticlesByDate(articles);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* 顶部 Header */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{ background: "var(--bg)", borderColor: "var(--border)" }}
      >
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{
              fontFamily: "var(--font-noto-serif-sc), serif",
              color: "var(--brand)",
            }}
          >
            AI 观察
          </h1>
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            每日精选 AI 故事
          </span>
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <FilterBar currentSearch={q} currentFilter={filter} />
        </div>
      </header>

      {/* 内容区 */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {groups.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--muted)" }}>
            {q ? `没有找到"${q}"相关的文章` : "暂无文章，请稍后再来"}
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.label} className="mb-8">
              <div
                className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2 border-b"
                style={{ color: "var(--muted)", borderColor: "var(--border)" }}
              >
                {group.label}
              </div>
              <div className="flex flex-col gap-3">
                {group.articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}

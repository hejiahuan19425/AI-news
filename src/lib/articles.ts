import { supabase } from "./supabase";

export interface Article {
  id: string;
  source_id: string;
  title_original: string | null;
  title_zh: string;
  summary_zh: string;
  detail_what: string | null;
  detail_why: string | null;
  detail_background: string | null;
  tags: string[];
  original_url: string;
  published_at: string | null;
  created_at: string;
  hidden: boolean;
  sources: {
    name: string;
    type: string;
  } | null;
}

export interface ArticlesByDate {
  label: string;
  articles: Article[];
}

export async function getArticles(search?: string, filter?: string): Promise<Article[]> {
  let query = supabase
    .from("articles")
    .select("*, sources(name, type)")
    .eq("hidden", false)
    .order("published_at", { ascending: false })
    .limit(200);

  if (search) {
    query = query.or(`title_zh.ilike.%${search}%,summary_zh.ilike.%${search}%`);
  }

  if (filter === "tech") {
    query = query.eq("sources.type", "rss");
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to fetch articles:", error.message);
    return [];
  }

  return (data ?? []) as Article[];
}

export function groupArticlesByDate(articles: Article[]): ArticlesByDate[] {
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const groups: Map<string, { label: string; articles: Article[] }> = new Map();

  for (const article of articles) {
    const date = article.published_at
      ? new Date(article.published_at)
      : new Date(article.created_at);
    const dateStr = date.toDateString();

    let label: string;
    if (dateStr === todayStr) {
      label = "今天";
    } else if (dateStr === yesterdayStr) {
      label = "昨天";
    } else {
      label = `${date.getMonth() + 1}月${date.getDate()}日`;
    }

    if (!groups.has(dateStr)) {
      groups.set(dateStr, { label, articles: [] });
    }
    groups.get(dateStr)!.articles.push(article);
  }

  return Array.from(groups.values());
}

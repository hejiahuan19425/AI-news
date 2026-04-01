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

function titleSimilarity(a: string, b: string): number {
  const tokenize = (s: string) =>
    s.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, " ").split(/\s+/).filter((w) => w.length > 1);
  const wordsA = new Set(tokenize(a));
  const wordsB = new Set(tokenize(b));
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

function deduplicateByTitle(articles: Article[]): Article[] {
  const kept: Article[] = [];
  for (const article of articles) {
    const isDuplicate = kept.some((k) => titleSimilarity(k.title_zh, article.title_zh) > 0.5);
    if (!isDuplicate) kept.push(article);
  }
  return kept;
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

  return deduplicateByTitle((data ?? []) as Article[]);
}

// 返回北京时间的 YYYY-MM-DD 字符串
function toBeijingDateStr(date: Date): string {
  const bjOffset = 8 * 60; // UTC+8，单位分钟
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
  const bjDate = new Date(utcMs + bjOffset * 60000);
  return `${bjDate.getFullYear()}-${bjDate.getMonth() + 1}-${bjDate.getDate()}`;
}

export function groupArticlesByDate(articles: Article[]): ArticlesByDate[] {
  const now = new Date();
  const todayStr = toBeijingDateStr(now);
  const yesterday = new Date(now.getTime() - 86400000);
  const yesterdayStr = toBeijingDateStr(yesterday);

  const groups: Map<string, { label: string; articles: Article[] }> = new Map();

  for (const article of articles) {
    const date = article.published_at
      ? new Date(article.published_at)
      : new Date(article.created_at);
    const dateStr = toBeijingDateStr(date);

    let label: string;
    if (dateStr === todayStr) {
      label = "今天";
    } else if (dateStr === yesterdayStr) {
      label = "昨天";
    } else {
      const bjOffset = 8 * 60;
      const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
      const bjDate = new Date(utcMs + bjOffset * 60000);
      label = `${bjDate.getMonth() + 1}月${bjDate.getDate()}日`;
    }

    if (!groups.has(dateStr)) {
      groups.set(dateStr, { label, articles: [] });
    }
    groups.get(dateStr)!.articles.push(article);
  }

  return Array.from(groups.values());
}

import Parser from "rss-parser";
import { supabase } from "./supabase";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; AI-News-Bot/1.0; +https://github.com/hejiahuan19425/AI-news)",
  },
});

export interface RawArticle {
  sourceId: string;
  sourceName: string;
  titleOriginal: string;
  contentSnippet: string;
  originalUrl: string;
  publishedAt: string | null;
}

interface Source {
  id: string;
  name: string;
  type: string;
  url: string;
}

export async function fetchAllSources(): Promise<RawArticle[]> {
  // 1. 从 Supabase 读取所有启用的 RSS 信源
  const { data: sources, error } = await supabase
    .from("sources")
    .select("id, name, type, url")
    .eq("enabled", true)
    .eq("type", "rss");

  if (error) {
    console.error("Failed to fetch sources:", error.message);
    return [];
  }

  // 2. 获取已有文章的 URL 集合（用于去重）
  const { data: existingArticles } = await supabase
    .from("articles")
    .select("original_url");

  const existingUrls = new Set(
    (existingArticles ?? []).map((a: { original_url: string }) => a.original_url)
  );

  // 3. 逐个抓取信源
  const allNewArticles: RawArticle[] = [];

  for (const source of sources as Source[]) {
    try {
      const articles = await fetchSingleSource(source, existingUrls);
      allNewArticles.push(...articles);
      console.log(`✓ ${source.name}: ${articles.length} new articles`);
    } catch (err) {
      console.error(`✗ ${source.name}: ${(err as Error).message}`);
    }
  }

  console.log(`\nTotal new articles: ${allNewArticles.length}`);
  return allNewArticles;
}

async function fetchSingleSource(
  source: Source,
  existingUrls: Set<string>
): Promise<RawArticle[]> {
  const feed = await parser.parseURL(source.url);
  const newArticles: RawArticle[] = [];

  for (const item of feed.items) {
    const url = item.link;
    if (!url || existingUrls.has(url)) continue;

    newArticles.push({
      sourceId: source.id,
      sourceName: source.name,
      titleOriginal: item.title || "",
      contentSnippet: item.contentSnippet || item.content || item.summary || "",
      originalUrl: url,
      publishedAt: item.isoDate || item.pubDate || null,
    });
  }

  return newArticles;
}

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
  // 1. 从 Supabase 读取所有启用的信源（RSS + JSON）
  const { data: sources, error } = await supabase
    .from("sources")
    .select("id, name, type, url")
    .eq("enabled", true)
    .in("type", ["rss", "twitter"]);

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
      const articles =
        source.url.endsWith(".json")
          ? await fetchJsonXSource(source, existingUrls)
          : await fetchSingleSource(source, existingUrls);
      allNewArticles.push(...articles);
      console.log(`✓ ${source.name}: ${articles.length} new articles`);
    } catch (err) {
      console.error(`✗ ${source.name}: ${(err as Error).message}`);
    }
  }

  console.log(`\nTotal new articles: ${allNewArticles.length}`);
  return allNewArticles;
}

async function fetchJsonXSource(
  source: Source,
  existingUrls: Set<string>
): Promise<RawArticle[]> {
  const res = await fetch(source.url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  const newArticles: RawArticle[] = [];
  for (const builder of data.x ?? []) {
    for (const tweet of builder.tweets ?? []) {
      if (!tweet.url || existingUrls.has(tweet.url)) continue;
      newArticles.push({
        sourceId: source.id,
        sourceName: `${builder.name} (@${builder.handle})`,
        titleOriginal: tweet.text,
        contentSnippet: tweet.text,
        originalUrl: tweet.url,
        publishedAt: tweet.createdAt ?? null,
      });
    }
  }
  return newArticles;
}

const MAX_PER_SOURCE = 10;

async function fetchSingleSource(
  source: Source,
  existingUrls: Set<string>
): Promise<RawArticle[]> {
  const feed = await parser.parseURL(source.url);
  const newArticles: RawArticle[] = [];

  for (const item of feed.items) {
    if (newArticles.length >= MAX_PER_SOURCE) break;
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

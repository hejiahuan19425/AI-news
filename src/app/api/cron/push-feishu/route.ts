import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Article } from "@/lib/articles";

const BATCH_SIZE = 8;

async function fetchRecentArticles(): Promise<Article[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("articles")
    .select("*, sources(name, type)")
    .eq("hidden", false)
    .gte("created_at", since)
    .order("published_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Article[];
}

function buildCard(articles: Article[], dateLabel: string, batchIdx: number, totalBatches: number) {
  const suffix = totalBatches > 1 ? ` (${batchIdx + 1}/${totalBatches})` : "";
  const elements: object[] = [
    {
      tag: "div",
      text: {
        tag: "lark_md",
        content: `聚合全球信源，用中文讲 AI 故事。今日共 **${articles.length + (totalBatches - 1 - batchIdx) * BATCH_SIZE}** 条${suffix}`,
      },
    },
    { tag: "hr" },
  ];

  for (const article of articles) {
    const source = article.sources?.name ?? "未知来源";
    const timeStr = article.published_at
      ? new Date(article.published_at).toLocaleTimeString("zh-CN", {
          hour: "2-digit", minute: "2-digit", timeZone: "Asia/Shanghai", hour12: false,
        })
      : "";
    const tags = (article.tags ?? []).slice(0, 4).map((t) => `\`${t}\``).join("  ");
    const lines = [
      `**[${article.title_zh}](${article.original_url})**`,
      `<font color='grey'>${source}${timeStr ? `  ·  ${timeStr}` : ""}</font>`,
      article.summary_zh ?? "",
      tags,
    ].filter(Boolean).join("\n");

    elements.push({ tag: "div", text: { tag: "lark_md", content: lines } });
    elements.push({ tag: "hr" });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (batchIdx === totalBatches - 1 && siteUrl) {
    elements.push({
      tag: "action",
      actions: [{ tag: "button", text: { tag: "plain_text", content: "查看全部文章 →" }, type: "primary", url: siteUrl }],
    });
  }

  return {
    msg_type: "interactive",
    card: {
      header: { title: { tag: "plain_text", content: `🤖  AI 观察  ·  ${dateLabel}${suffix}` }, template: "blue" },
      elements,
    },
  };
}

async function sendToFeishu(payload: object) {
  const webhook = process.env.FEISHU_WEBHOOK_URL!;
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await res.json();
  if (result.code !== 0) throw new Error(`飞书返回错误: ${result.msg}`);
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const articles = await fetchRecentArticles();

    if (articles.length === 0) {
      await sendToFeishu({ msg_type: "text", content: { text: "AI观察：今日暂无新文章。" } });
      return NextResponse.json({ ok: true, sent: 0 });
    }

    const now = new Date();
    const bj = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const dateLabel = `${bj.getUTCFullYear()}年${bj.getUTCMonth() + 1}月${bj.getUTCDate()}日`;

    const batches: Article[][] = [];
    for (let i = 0; i < articles.length; i += BATCH_SIZE) {
      batches.push(articles.slice(i, i + BATCH_SIZE));
    }

    for (let i = 0; i < batches.length; i++) {
      await sendToFeishu(buildCard(batches[i], dateLabel, i, batches.length));
      if (i < batches.length - 1) await new Promise((r) => setTimeout(r, 1500));
    }

    return NextResponse.json({ ok: true, sent: articles.length });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

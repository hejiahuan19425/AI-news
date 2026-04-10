import { config } from "dotenv";
config({ path: ".env.local" });

import { supabase } from "../src/lib/supabase";
import type { Article } from "../src/lib/articles";

const WEBHOOK = process.env.FEISHU_WEBHOOK_URL!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";
const BATCH_SIZE = 8;

// ── 数据获取 ───────────────────────────────────────────────

async function fetchRecentArticles(): Promise<Article[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("articles")
    .select("*, sources(name, type)")
    .eq("hidden", false)
    .gte("created_at", since)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Supabase error:", error.message);
    return [];
  }
  return (data ?? []) as Article[];
}

// ── 飞书卡片构造 ──────────────────────────────────────────

function buildCard(
  articles: Article[],
  dateLabel: string,
  batchIdx: number,
  totalBatches: number
): object {
  const suffix = totalBatches > 1 ? ` (${batchIdx + 1}/${totalBatches})` : "";

  const elements: object[] = [
    // 顶部引言
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
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Shanghai",
          hour12: false,
        })
      : "";
    const tags = (article.tags ?? [])
      .slice(0, 4)
      .map((t) => `\`${t}\``)
      .join("  ");

    const lines = [
      `**[${article.title_zh}](${article.original_url})**`,
      `<font color='grey'>${source}${timeStr ? `  ·  ${timeStr}` : ""}</font>`,
      article.summary_zh ?? "",
      tags,
    ]
      .filter(Boolean)
      .join("\n");

    elements.push({ tag: "div", text: { tag: "lark_md", content: lines } });
    elements.push({ tag: "hr" });
  }

  // 底部按钮（仅最后一批）
  if (batchIdx === totalBatches - 1 && SITE_URL) {
    elements.push({
      tag: "action",
      actions: [
        {
          tag: "button",
          text: { tag: "plain_text", content: "查看全部文章 →" },
          type: "primary",
          url: SITE_URL,
        },
      ],
    });
  }

  return {
    msg_type: "interactive",
    card: {
      header: {
        title: {
          tag: "plain_text",
          content: `🤖  AI 观察  ·  ${dateLabel}${suffix}`,
        },
        template: "blue",
      },
      elements,
    },
  };
}

// ── 发送 ──────────────────────────────────────────────────

async function send(payload: object): Promise<void> {
  const res = await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await res.json();
  if (result.code !== 0) throw new Error(`飞书返回错误: ${result.msg}`);
}

// ── 主流程 ────────────────────────────────────────────────

async function main() {
  if (!WEBHOOK) {
    console.error("未配置 FEISHU_WEBHOOK_URL，请在 .env.local 中添加");
    process.exit(1);
  }

  const articles = await fetchRecentArticles();
  console.log(`今日文章: ${articles.length} 条`);

  if (articles.length === 0) {
    await send({ msg_type: "text", content: { text: "AI观察：今日暂无新文章。" } });
    console.log("已发送空提醒");
    return;
  }

  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const bj = new Date(utcMs + 8 * 60 * 60000);
  const dateLabel = `${bj.getFullYear()}年${bj.getMonth() + 1}月${bj.getDate()}日`;

  // 分批（每批 BATCH_SIZE 条）
  const batches: Article[][] = [];
  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    batches.push(articles.slice(i, i + BATCH_SIZE));
  }

  for (let i = 0; i < batches.length; i++) {
    await send(buildCard(batches[i], dateLabel, i, batches.length));
    console.log(`已发送第 ${i + 1}/${batches.length} 批`);
    if (i < batches.length - 1) await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("推送完成 ✓");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

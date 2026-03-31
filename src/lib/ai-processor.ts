import { supabase } from "./supabase";
import type { RawArticle } from "./fetcher";

function getEnv() {
  return {
    baseUrl: process.env.AI_API_BASE_URL!,
    apiKey: process.env.AI_API_KEY!,
    model: process.env.AI_MODEL || "gemini-3.1-pro-preview",
  };
}

interface ProcessedArticle {
  is_ai_related: boolean;
  is_story: boolean;
  title_zh: string;
  summary_zh: string;
  detail_what: string;
  detail_why: string;
  detail_background: string;
  tags: string[];
}

// 这些信源的文章跳过 is_story 过滤，只要 is_ai_related 就保存
const OFFICIAL_SOURCES = new Set([
  "Anthropic Blog",
  "OpenAI Blog",
  "Google AI Blog",
  "Claude (@claudeai)",
  "Sam Altman (@sama)",
]);

const SYSTEM_PROMPT = `你是一个专业的 AI 新闻编辑，负责筛选并处理与 AI 相关的新闻。
请严格按照 JSON 格式返回结果，不要添加任何其他文字。`;

const USER_PROMPT_TEMPLATE = (title: string, snippet: string) => `
请分析以下新闻文章，并以 JSON 格式返回处理结果：

标题：${title}
内容摘要：${snippet}

请返回以下 JSON 结构（不要包含任何其他文字，只返回 JSON）：
{
  "is_ai_related": true/false,     // 是否与 AI 相关（包括人工智能、机器学习、大模型、自动化等）
  "is_story": true/false,          // 是否值得读者关注。以下情况应为 true：新模型/产品发布、研究报告、重大政策、行业事件、有影响力的人物观点。以下情况为 false：招聘广告、纯财报数据、无实质内容的简短公告
  "title_zh": "中文标题",           // 简洁的中文标题（如不相关或非故事，填空字符串）
  "summary_zh": "中文摘要",         // 2-3句话的中文摘要（如不相关或非故事，填空字符串）
  "detail_what": "发生了什么",      // 事件描述（如不相关或非故事，填空字符串）
  "detail_why": "为什么重要",       // 重要性分析（如不相关或非故事，填空字符串）
  "detail_background": "相关背景", // 背景知识（如不相关或非故事，填空字符串）
  "tags": ["标签1", "标签2"]       // 相关标签：公司名、话题、人物（如不相关或非故事，填空数组）
}
`;

async function callAI(title: string, snippet: string): Promise<ProcessedArticle | null> {
  const { baseUrl, apiKey, model } = getEnv();
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: USER_PROMPT_TEMPLATE(title, snippet) },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from AI API");

  return JSON.parse(content) as ProcessedArticle;
}

export async function processArticles(rawArticles: RawArticle[]): Promise<void> {
  console.log(`\nProcessing ${rawArticles.length} articles with AI...`);

  let saved = 0;
  let skipped = 0;
  let failed = 0;

  for (const article of rawArticles) {
    try {
      const result = await callAI(article.titleOriginal, article.contentSnippet);

      const isOfficial = OFFICIAL_SOURCES.has(article.sourceName);
      if (!result || !result.is_ai_related || (!result.is_story && !isOfficial)) {
        console.log(`  ✗ skip [not AI/story]: ${article.titleOriginal.slice(0, 60)}`);
        skipped++;
        continue;
      }

      const { error } = await supabase.from("articles").insert({
        source_id: article.sourceId,
        title_original: article.titleOriginal,
        title_zh: result.title_zh,
        summary_zh: result.summary_zh,
        detail_what: result.detail_what,
        detail_why: result.detail_why,
        detail_background: result.detail_background,
        tags: result.tags,
        original_url: article.originalUrl,
        published_at: article.publishedAt,
      });

      if (error) {
        console.error(`  ✗ db error: ${error.message}`);
        failed++;
      } else {
        console.log(`  ✓ saved: ${result.title_zh.slice(0, 60)}`);
        saved++;
      }
    } catch (err) {
      console.error(`  ✗ failed: ${article.titleOriginal.slice(0, 60)}\n    ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\nDone — saved: ${saved}, skipped: ${skipped}, failed: ${failed}`);
}

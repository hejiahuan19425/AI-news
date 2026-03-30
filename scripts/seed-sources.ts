import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface Source {
  name: string;
  type: "rss" | "scrape" | "twitter";
  url: string;
}

const seedSources: Source[] = [
  // ===== 高优先 — 综合新闻 =====
  {
    name: "Reuters Technology",
    type: "rss",
    url: "https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best",
  },
  {
    name: "BBC Technology",
    type: "rss",
    url: "https://feeds.bbci.co.uk/news/technology/rss.xml",
  },
  {
    name: "Fortune AI",
    type: "rss",
    url: "https://fortune.com/feed/fortune-feeds/ai/",
  },
  {
    name: "The Guardian Technology",
    type: "rss",
    url: "https://www.theguardian.com/technology/rss",
  },
  {
    name: "AP News Technology",
    type: "rss",
    url: "https://rsshub.app/apnews/topics/technology",
  },
  {
    name: "CNN Business",
    type: "rss",
    url: "http://rss.cnn.com/rss/money_technology.rss",
  },
  {
    name: "Bloomberg Technology",
    type: "rss",
    url: "https://feeds.bloomberg.com/technology/news.rss",
  },
  {
    name: "Washington Post Technology",
    type: "rss",
    url: "https://feeds.washingtonpost.com/rss/business/technology",
  },

  // ===== 高优先 — 科技媒体 =====
  {
    name: "TechCrunch AI",
    type: "rss",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
  },
  {
    name: "The Verge",
    type: "rss",
    url: "https://www.theverge.com/rss/index.xml",
  },
  {
    name: "Wired AI",
    type: "rss",
    url: "https://www.wired.com/feed/tag/ai/latest/rss",
  },
  {
    name: "Ars Technica AI",
    type: "rss",
    url: "https://feeds.arstechnica.com/arstechnica/technology-lab",
  },
  {
    name: "VentureBeat AI",
    type: "rss",
    url: "https://venturebeat.com/category/ai/feed/",
  },
  {
    name: "MIT Technology Review",
    type: "rss",
    url: "https://www.technologyreview.com/feed/",
  },
  {
    name: "The Information",
    type: "rss",
    url: "https://www.theinformation.com/feed",
  },
  {
    name: "Engadget",
    type: "rss",
    url: "https://www.engadget.com/rss.xml",
  },

  // ===== 中优先 — 官方博客 =====
  {
    name: "OpenAI Blog",
    type: "rss",
    url: "https://openai.com/blog/rss.xml",
  },
  {
    name: "Anthropic Blog",
    type: "rss",
    url: "https://www.anthropic.com/rss.xml",
  },
  {
    name: "Google AI Blog",
    type: "rss",
    url: "https://blog.google/technology/ai/rss/",
  },

  // ===== 中文信源 =====
  {
    name: "机器之心",
    type: "rss",
    url: "https://rsshub.app/jiqizhixin/daily",
  },
  {
    name: "量子位",
    type: "rss",
    url: "https://rsshub.app/qbitai/category/资讯",
  },
  {
    name: "36氪 AI 频道",
    type: "rss",
    url: "https://rsshub.app/36kr/motif/452080",
  },
  {
    name: "澎湃新闻 科技频道",
    type: "rss",
    url: "https://rsshub.app/thepaper/channel/25950",
  },
];

async function seed() {
  console.log(`Seeding ${seedSources.length} sources...`);

  for (const source of seedSources) {
    const { error } = await supabase
      .from("sources")
      .upsert(source, { onConflict: "url" })
      .select();

    if (error) {
      console.error(`Failed to insert ${source.name}:`, error.message);
    } else {
      console.log(`✓ ${source.name}`);
    }
  }

  console.log("Done!");
}

seed();

import { config } from "dotenv";
config({ path: ".env.local" });

import { fetchAllSources } from "../src/lib/fetcher";
import { processArticles } from "../src/lib/ai-processor";

async function main() {
  console.log("=== AI News Fetcher ===\n");

  const rawArticles = await fetchAllSources();

  if (rawArticles.length === 0) {
    console.log("No new articles found.");
    return;
  }

  await processArticles(rawArticles);

  console.log("\n=== Done ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

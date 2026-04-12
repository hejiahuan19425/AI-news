import { NextResponse } from "next/server";
import { fetchAllSources } from "@/lib/fetcher";
import { processArticles } from "@/lib/ai-processor";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rawArticles = await fetchAllSources();
    await processArticles(rawArticles);
    return NextResponse.json({ ok: true, count: rawArticles.length });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

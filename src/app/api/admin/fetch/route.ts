import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { fetchAllSources } from "@/lib/fetcher";
import { processArticles } from "@/lib/ai-processor";

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST() {
  if (!(await isAuthenticated())) return unauth();

  try {
    const rawArticles = await fetchAllSources();
    await processArticles(rawArticles);
    return NextResponse.json({ ok: true, count: rawArticles.length });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { retrieveContext } from "@/lib/rag";

export async function POST(req: NextRequest) {
  try {
    const { query, k } = (await req.json()) as { query: string; k?: number };
    if (!query?.trim()) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }
    const results = await retrieveContext(query, k ?? 4);
    return NextResponse.json({ results });
  } catch (err: unknown) {
    console.error("/api/rag/query error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}

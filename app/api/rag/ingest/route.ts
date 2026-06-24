import { NextRequest, NextResponse } from "next/server";
import { ollamaEmbed } from "@/lib/ollama";
import { supabaseServer } from "@/lib/supabase";

// POST { title, content } -> embeds content and stores it in the `documents`
// table for retrieval-augmented generation. See also scripts/ingest.ts for
// bulk-loading a folder of files.
export async function POST(req: NextRequest) {
  try {
    const { title, content } = (await req.json()) as { title?: string; content: string };
    if (!content?.trim()) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const embedding = await ollamaEmbed(content);
    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from("documents")
      .insert({ title: title ?? null, content, embedding })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id });
  } catch (err: any) {
    console.error("/api/rag/ingest error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}

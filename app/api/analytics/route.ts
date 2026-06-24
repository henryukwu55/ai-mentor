import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export const dynamic = "force-dynamic";


// Phase 4: basic analytics — session counts, message volume, and average
// frustration/engagement signal pulled from the sentiment captured on user
// messages (see WebcamSentiment + /api/chat).
export async function GET() {
  try {
    const supabase = supabaseServer();

    const { data: sessions, error: sessionsErr } = await supabase
      .from("sessions")
      .select("id, project_name, status, started_at, ended_at, students(full_name, email)")
      .order("started_at", { ascending: false })
      .limit(50);
    if (sessionsErr) throw sessionsErr;

    const { data: messages, error: messagesErr } = await supabase
      .from("messages")
      .select("session_id, role, sentiment, created_at")
      .not("sentiment", "is", null);
    if (messagesErr) throw messagesErr;

    const bySession: Record<string, { frustration: number[]; engagement: number[] }> = {};
    for (const m of messages || []) {
      if (!m.sentiment) continue;
      const s = (bySession[m.session_id] ??= { frustration: [], engagement: [] });
      if (typeof m.sentiment.frustration === "number") s.frustration.push(m.sentiment.frustration);
      if (typeof m.sentiment.engagement === "number") s.engagement.push(m.sentiment.engagement);
    }

    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

    const enriched = (sessions || []).map((s: any) => ({
      ...s,
      avgFrustration: avg(bySession[s.id]?.frustration ?? []),
      avgEngagement: avg(bySession[s.id]?.engagement ?? []),
    }));

    return NextResponse.json({ sessions: enriched });
  } catch (err: any) {
    console.error("/api/analytics error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { ollamaChat, type ChatMessage } from "@/lib/ollama";
import { retrieveContext } from "@/lib/rag";
import { supabaseServer } from "@/lib/supabase";

const MENTOR_SYSTEM_PROMPT = `You are a warm, encouraging AI coding mentor for software engineering
students. You ask clarifying questions, break problems into steps, and never just
hand over a full solution — guide the student toward the answer like a real mentor
doing pair-programming. Keep replies concise enough to be spoken aloud (2-5 sentences
unless the student asks for more detail). Use the provided CONTEXT if it's relevant;
ignore it if it isn't.`;

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, history, systemPrompt, sentiment } = (await req.json()) as {
      sessionId?: string;
      message: string;
      history?: ChatMessage[];
      systemPrompt?: string; // overrides the default persona (Phase 4 role-play)
      sentiment?: { dominant: string; frustration: number; engagement: number } | null;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    // 1. Pull relevant knowledge-base context (RAG)
    const context = await retrieveContext(message);
    const contextBlock = context.length
      ? `CONTEXT:\n${context.map((c, i) => `[${i + 1}] ${c}`).join("\n\n")}`
      : "CONTEXT: (none found)";

    // 2. Fold in webcam sentiment (Phase 2), if present, as soft guidance —
    // never quoted back verbatim, just used to steer tone.
    const sentimentBlock = sentiment
      ? `STUDENT VISUAL SENTIMENT (use to adapt tone, don't mention explicitly):
dominant expression=${sentiment.dominant}, frustration=${sentiment.frustration.toFixed(2)}, engagement=${sentiment.engagement.toFixed(2)}.
If frustration is high, slow down and simplify. If engagement is low, re-energize the explanation.`
      : "";

    // 3. Build the message list for the LLM
    const basePrompt = systemPrompt?.trim() || MENTOR_SYSTEM_PROMPT;
    const messages: ChatMessage[] = [
      { role: "system", content: `${basePrompt}\n\n${contextBlock}\n\n${sentimentBlock}` },
      ...(history ?? []),
      { role: "user", content: message },
    ];

    // 4. Call the open-source LLM via Ollama
    const reply = await ollamaChat(messages);

    // 5. Persist the exchange if we have a session
    if (sessionId) {
      const supabase = supabaseServer();
      await supabase.from("messages").insert([
        { session_id: sessionId, role: "user", content: message, sentiment: sentiment ?? null },
        { session_id: sessionId, role: "assistant", content: reply },
      ]);
    }

    return NextResponse.json({ reply, context });
  } catch (err: any) {
    console.error("/api/chat error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}

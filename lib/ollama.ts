// Thin wrapper around a local/self-hosted Ollama instance.
// Open source: https://github.com/ollama/ollama
// Run `ollama pull llama3.1` and `ollama pull nomic-embed-text` before use.

const BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || "tinyllama";
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
const TIMEOUT_MS = 60_000; // 60 s — generous for cold-start local models

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

// Fetch with an AbortController timeout so a stalled Ollama process
// doesn't hang the Next.js API route indefinitely.
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function ollamaChat(messages: ChatMessage[]): Promise<string> {
  const res = await fetchWithTimeout(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: CHAT_MODEL, messages, stream: false }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Ollama chat failed (${res.status}): ${body || res.statusText}`,
    );
  }
  const data = await res.json();
  return data.message?.content ?? "";
}

export async function ollamaEmbed(text: string): Promise<number[]> {
  const res = await fetchWithTimeout(`${BASE_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Ollama embeddings failed (${res.status}): ${body || res.statusText}`,
    );
  }
  const data = await res.json();
  return data.embedding as number[];
}

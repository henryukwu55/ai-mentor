// Thin wrapper around a local/self-hosted Ollama instance.
// Ollama is 100% open source: https://github.com/ollama/ollama
// Run `ollama pull llama3.1` and `ollama pull nomic-embed-text` before use.

const BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || "llama3.1";
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function ollamaChat(messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: CHAT_MODEL, messages, stream: false }),
  });
  if (!res.ok) {
    throw new Error(`Ollama chat failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.message?.content ?? "";
}

export async function ollamaEmbed(text: string): Promise<number[]> {
  const res = await fetch(`${BASE_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text }),
  });
  if (!res.ok) {
    throw new Error(`Ollama embeddings failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.embedding as number[];
}

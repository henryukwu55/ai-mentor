// Bulk-loads every .txt/.md file in ./scripts/knowledge-base into the
// `documents` table as embedded RAG chunks.
//
// Usage:
//   1. Drop project briefs / docs / FAQs as .txt or .md files into
//      scripts/knowledge-base/
//   2. npm run ingest

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
// Load .env.local first (Next.js convention), then .env as fallback.
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

const KB_DIR = path.join(__dirname, "knowledge-base");

function chunkText(text: string, maxLen = 800): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = "";
  for (const p of paragraphs) {
    if ((current + p).length > maxLen) {
      if (current) chunks.push(current.trim());
      current = p;
    } else {
      current += "\n\n" + p;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function embed(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text }),
  });
  if (!res.ok) throw new Error(`Embedding failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.embedding;
}

async function main() {
  if (!fs.existsSync(KB_DIR)) {
    console.log(`No knowledge-base directory found at ${KB_DIR}. Create it and add .txt/.md files.`);
    return;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const files = fs.readdirSync(KB_DIR).filter((f) => f.endsWith(".txt") || f.endsWith(".md"));

  let total = 0;
  for (const file of files) {
    const fullPath = path.join(KB_DIR, file);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const chunks = chunkText(raw);

    for (const chunk of chunks) {
      const embedding = await embed(chunk);
      const { error } = await supabase
        .from("documents")
        .insert({ title: file, content: chunk, embedding });
      if (error) console.error(`Failed to insert chunk from ${file}:`, error.message);
      else total++;
    }
    console.log(`Ingested ${chunks.length} chunk(s) from ${file}`);
  }
  console.log(`Done. ${total} chunks inserted.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

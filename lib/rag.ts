import { supabaseServer } from "./supabase";
import { ollamaEmbed } from "./ollama";

// Retrieve the top-k most relevant knowledge-base chunks via pgvector
// cosine-similarity search. Returns [] gracefully if Ollama is not running
// or the documents table is empty — chat still works, just without RAG context.
export async function retrieveContext(query: string, k = 4): Promise<string[]> {
  try {
    const embedding = await ollamaEmbed(query);
    const supabase  = supabaseServer();

    const { data, error } = await supabase.rpc("match_documents", {
      query_embedding: embedding,
      match_count: k,
    });

    if (error) {
      console.warn("RAG retrieval error (non-fatal):", error.message);
      return [];
    }

    return (data ?? []).map((row: { content: string }) => row.content);
  } catch (err) {
    // Ollama not running, network error, etc. — degrade gracefully.
    console.warn("RAG skipped (non-fatal):", err instanceof Error ? err.message : err);
    return [];
  }
}

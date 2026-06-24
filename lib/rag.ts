import { supabaseServer } from "./supabase";
import { ollamaEmbed } from "./ollama";

// Retrieve the top-k most relevant knowledge base chunks for a query,
// using pgvector cosine similarity search (see supabase/schema.sql).
export async function retrieveContext(query: string, k = 4): Promise<string[]> {
  const embedding = await ollamaEmbed(query);
  const supabase = supabaseServer();

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_count: k,
  });

  if (error) {
    console.error("RAG retrieval error:", error.message);
    return [];
  }

  return (data || []).map((row: { content: string }) => row.content);
}

import { sql } from "@/db";
import { createEmbedding, toVectorLiteral } from "./embeddings";

export type RagSource = {
  id: string;
  source_type: "knowledge_article" | "document";
  article_id: string | null;
  document_id: string | null;
  system_id: string | null;
  content: string;
  metadata: { title?: string; source?: string; [key: string]: unknown };
  similarity: number;
};

export async function searchRelevantChunks(question: string, systemId: string, limit = 8) {
  const embedding = await createEmbedding(question);
  const rows = await sql`SELECT * FROM match_document_chunks(${toVectorLiteral(embedding)}::vector, ${systemId}::uuid, ${limit}, 0.05)`;
  return rows as RagSource[];
}

export function buildContext(sources: RagSource[]) {
  return sources.map((source, index) => {
    const label = source.metadata?.title || source.metadata?.source || source.id;
    return `[Fonte ${index + 1}: ${label}; similaridade ${source.similarity.toFixed(2)}]\n${source.content}`;
  }).join("\n\n---\n\n");
}

export function hasLowConfidence(sources: RagSource[]) {
  if (sources.length === 0) return true;
  const best = Math.max(...sources.map((source) => source.similarity));
  return best < 0.18;
}

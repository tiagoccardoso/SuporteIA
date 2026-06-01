import { createHash } from "node:crypto";

export const EMBEDDING_DIMENSIONS = 1536;

export async function createEmbedding(text: string) {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  const tokens = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9_]+/g) ?? [];
  for (const token of tokens) {
    const digest = createHash("sha256").update(token).digest();
    const index = digest.readUInt16BE(0) % EMBEDDING_DIMENSIONS;
    const sign = digest[2] % 2 === 0 ? 1 : -1;
    vector[index] += sign * (1 + Math.log(token.length));
  }
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / norm).toFixed(6)));
}

export function toVectorLiteral(embedding: number[]) {
  return `[${embedding.join(",")}]`;
}

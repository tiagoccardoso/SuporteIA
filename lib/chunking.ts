export function chunkText(text: string, maxChars = 1200, overlap = 180) {
  const normalized = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
  if (!normalized) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    let end = Math.min(start + maxChars, normalized.length);
    const boundary = normalized.lastIndexOf("\n", end);
    if (boundary > start + maxChars * 0.5) end = boundary;
    chunks.push(normalized.slice(start, end).trim());
    if (end >= normalized.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks.filter(Boolean);
}

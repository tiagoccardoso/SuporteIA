"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, sql } from "@/db";
import { aiSettings, chatMessages, chatSessions, documentChunks, documents, feedbacks, knowledgeArticles, systems, ticketMessages, tickets, unansweredQuestions, users } from "@/db/schema";
import { clearSession, requireUser, setSession } from "@/lib/auth";
import { chunkText } from "@/lib/chunking";
import { extractTextFromFile } from "@/lib/documents";
import { createEmbedding, toVectorLiteral } from "@/lib/embeddings";
import { generateAnswer } from "@/lib/deepseek";
import { searchRelevantChunks } from "@/lib/rag";
import { verifyPassword } from "@/lib/password";
import { z } from "zod";
import { aiSettingsSchema, articleSchema, chatSchema, loginSchema, systemSchema, ticketSchema } from "@/lib/validation";

function formString(formData: FormData, key: string) { return String(formData.get(key) || ""); }

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({ email: formString(formData, "email"), password: formString(formData, "password") });
  if (!parsed.success) redirect("/login?error=invalid");
  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email.toLowerCase())).limit(1);
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) redirect("/login?error=credentials");
  await setSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() { await clearSession(); redirect("/login"); }

export async function saveSystemAction(formData: FormData) {
  await requireUser();
  const parsed = systemSchema.parse({ name: formString(formData, "name"), slug: formString(formData, "slug"), description: formString(formData, "description"), status: formString(formData, "status") || "active" });
  const id = formString(formData, "id");
  if (id) await db.update(systems).set({ ...parsed, updatedAt: new Date() }).where(eq(systems.id, id));
  else await db.insert(systems).values(parsed);
  revalidatePath("/systems");
}

async function replaceArticleChunks(articleId: string, systemId: string, title: string, content: string) {
  await db.delete(documentChunks).where(eq(documentChunks.articleId, articleId));
  const chunks = chunkText(content);
  for (let index = 0; index < chunks.length; index++) {
    const embedding = await createEmbedding(`${title}\n${chunks[index]}`);
    await sql`INSERT INTO document_chunks (source_type, article_id, system_id, chunk_index, content, embedding, metadata)
      VALUES ('knowledge_article', ${articleId}::uuid, ${systemId}::uuid, ${index}, ${chunks[index]}, ${toVectorLiteral(embedding)}::vector, ${JSON.stringify({ title, source: "Artigo" })}::jsonb)`;
  }
}

export async function saveArticleAction(formData: FormData) {
  const user = await requireUser();
  const parsed = articleSchema.parse({ title: formString(formData, "title"), content: formString(formData, "content"), systemId: formString(formData, "systemId"), category: formString(formData, "category") || "Geral", tags: formString(formData, "tags"), status: formString(formData, "status") || "draft" });
  const tags = (parsed.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean);
  const id = formString(formData, "id");
  let articleId = id;
  if (id) await db.update(knowledgeArticles).set({ title: parsed.title, content: parsed.content, systemId: parsed.systemId, category: parsed.category, tags, status: parsed.status, updatedAt: new Date() }).where(eq(knowledgeArticles.id, id));
  else {
    const [created] = await db.insert(knowledgeArticles).values({ title: parsed.title, content: parsed.content, systemId: parsed.systemId, category: parsed.category, tags, status: parsed.status, createdBy: user.id }).returning({ id: knowledgeArticles.id });
    articleId = created.id;
  }
  await replaceArticleChunks(articleId, parsed.systemId, parsed.title, parsed.content);
  revalidatePath("/knowledge");
  redirect("/knowledge");
}

export async function deleteArticleAction(formData: FormData) {
  await requireUser();
  await db.delete(knowledgeArticles).where(eq(knowledgeArticles.id, formString(formData, "id")));
  revalidatePath("/knowledge");
}

export async function uploadDocumentAction(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Arquivo obrigatório");
  const systemId = formString(formData, "systemId");
  const content = await extractTextFromFile(file);
  const [doc] = await db.insert(documents).values({ title: formString(formData, "title") || file.name, fileName: file.name, mimeType: file.type || "text/plain", content, systemId, uploadedBy: user.id }).returning({ id: documents.id, title: documents.title });
  const chunks = chunkText(content);
  for (let index = 0; index < chunks.length; index++) {
    const embedding = await createEmbedding(`${doc.title}\n${chunks[index]}`);
    await sql`INSERT INTO document_chunks (source_type, document_id, system_id, chunk_index, content, embedding, metadata)
      VALUES ('document', ${doc.id}::uuid, ${systemId}::uuid, ${index}, ${chunks[index]}, ${toVectorLiteral(embedding)}::vector, ${JSON.stringify({ title: doc.title, source: file.name })}::jsonb)`;
  }
  revalidatePath("/documents");
}

export async function askChatAction(formData: FormData) {
  const user = await requireUser();
  const parsed = chatSchema.parse({ question: formString(formData, "question"), systemId: formString(formData, "systemId"), sessionId: formString(formData, "sessionId") || undefined });
  let sessionId = parsed.sessionId;
  if (!sessionId) {
    const [session] = await db.insert(chatSessions).values({ title: parsed.question.slice(0, 80), systemId: parsed.systemId, createdBy: user.id }).returning({ id: chatSessions.id });
    sessionId = session.id;
  }
  await db.insert(chatMessages).values({ sessionId, role: "user", content: parsed.question });
  const sources = await searchRelevantChunks(parsed.question, parsed.systemId, 8);
  const [settings] = await db.select().from(aiSettings).orderBy(desc(aiSettings.createdAt)).limit(1);
  const result = await generateAnswer({ question: parsed.question, sources, settings });
  const [assistantMessage] = await db.insert(chatMessages).values({ sessionId, role: "assistant", content: result.answer, sources, confidence: result.confidence }).returning({ id: chatMessages.id });
  if (result.shouldOpenTicket) await db.insert(unansweredQuestions).values({ question: parsed.question, systemId: parsed.systemId, chatMessageId: assistantMessage.id, userId: user.id });
  revalidatePath("/chat");
  redirect(`/chat?session=${sessionId}`);
}

export async function feedbackAction(formData: FormData) {
  const user = await requireUser();
  const resolved = formString(formData, "resolved") === "1" ? 1 : 0;
  const messageId = formString(formData, "messageId");
  await db.insert(feedbacks).values({ messageId, userId: user.id, resolved, comment: formString(formData, "comment") || null });
  if (!resolved) await db.insert(unansweredQuestions).values({ question: formString(formData, "question"), systemId: formString(formData, "systemId"), chatMessageId: messageId, userId: user.id });
  revalidatePath("/chat");
}

export async function createTicketAction(formData: FormData) {
  const user = await requireUser();
  const parsed = ticketSchema.parse({ title: formString(formData, "title"), description: formString(formData, "description"), systemId: formString(formData, "systemId"), priority: formString(formData, "priority") || "medium" });
  const [ticket] = await db.insert(tickets).values({ ...parsed, createdBy: user.id }).returning({ id: tickets.id });
  revalidatePath("/tickets");
  redirect(`/tickets/${ticket.id}`);
}

export async function updateTicketAction(formData: FormData) {
  await requireUser();
  const status = z.enum(["open", "in_progress", "resolved", "closed"]).parse(formString(formData, "status"));
  const priority = z.enum(["low", "medium", "high"]).parse(formString(formData, "priority"));
  await db.update(tickets).set({ status, priority, updatedAt: new Date() }).where(eq(tickets.id, formString(formData, "id")));
  revalidatePath(`/tickets/${formString(formData, "id")}`);
}

export async function addTicketMessageAction(formData: FormData) {
  const user = await requireUser();
  const ticketId = formString(formData, "ticketId");
  await db.insert(ticketMessages).values({ ticketId, authorId: user.id, message: formString(formData, "message") });
  revalidatePath(`/tickets/${ticketId}`);
}

export async function saveAiSettingsAction(formData: FormData) {
  await requireUser();
  const parsed = aiSettingsSchema.parse({ model: formString(formData, "model"), temperature: formString(formData, "temperature"), maxTokens: formString(formData, "maxTokens"), basePrompt: formString(formData, "basePrompt") });
  const id = formString(formData, "id");
  if (id) await db.update(aiSettings).set({ ...parsed, updatedAt: new Date() }).where(eq(aiSettings.id, id));
  else await db.insert(aiSettings).values(parsed);
  revalidatePath("/settings/ai");
}

export async function convertQuestionToArticleAction(formData: FormData) {
  await requireUser();
  redirect(`/knowledge/new?question=${encodeURIComponent(formString(formData, "question"))}&system=${formString(formData, "systemId")}`);
}

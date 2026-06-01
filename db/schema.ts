import { customType, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["admin", "support", "viewer"]);
export const statusEnum = pgEnum("record_status", ["active", "inactive", "draft", "published", "archived"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "resolved", "closed"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high"]);
export const messageRoleEnum = pgEnum("message_role", ["user", "assistant", "system"]);
export const sourceTypeEnum = pgEnum("source_type", ["knowledge_article", "document"]);

const vector = customType<{ data: number[]; driverData: string }>({
  dataType() { return "vector(1536)"; },
  toDriver(value) { return `[${value.join(",")}]`; }
});

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
};

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").default("viewer").notNull(),
  ...timestamps
});

export const systems = pgTable("systems", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  status: statusEnum("status").default("active").notNull(),
  ...timestamps
});

export const knowledgeArticles = pgTable("knowledge_articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  systemId: uuid("system_id").references(() => systems.id, { onDelete: "set null" }),
  category: text("category").notNull().default("Geral"),
  tags: text("tags").array().notNull().default([]),
  status: statusEnum("status").default("draft").notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  content: text("content").notNull(),
  systemId: uuid("system_id").references(() => systems.id, { onDelete: "set null" }),
  uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps
});

export const documentChunks = pgTable("document_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceType: sourceTypeEnum("source_type").notNull(),
  articleId: uuid("article_id").references(() => knowledgeArticles.id, { onDelete: "cascade" }),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }),
  systemId: uuid("system_id").references(() => systems.id, { onDelete: "set null" }),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  embedding: vector("embedding").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps
});

export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  systemId: uuid("system_id").references(() => systems.id, { onDelete: "set null" }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => chatSessions.id, { onDelete: "cascade" }).notNull(),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  sources: jsonb("sources").$type<Array<Record<string, unknown>>>().default([]).notNull(),
  confidence: integer("confidence"),
  ...timestamps
});

export const tickets = pgTable("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  systemId: uuid("system_id").references(() => systems.id, { onDelete: "set null" }),
  status: ticketStatusEnum("status").default("open").notNull(),
  priority: ticketPriorityEnum("priority").default("medium").notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
  ...timestamps
});

export const ticketMessages = pgTable("ticket_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id").references(() => tickets.id, { onDelete: "cascade" }).notNull(),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  message: text("message").notNull(),
  ...timestamps
});

export const feedbacks = pgTable("feedbacks", {
  id: uuid("id").defaultRandom().primaryKey(),
  messageId: uuid("message_id").references(() => chatMessages.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  resolved: integer("resolved").notNull(),
  comment: text("comment"),
  ...timestamps
});

export const unansweredQuestions = pgTable("unanswered_questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  question: text("question").notNull(),
  systemId: uuid("system_id").references(() => systems.id, { onDelete: "set null" }),
  chatMessageId: uuid("chat_message_id").references(() => chatMessages.id, { onDelete: "set null" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  status: statusEnum("status").default("active").notNull(),
  ...timestamps
});

export const aiSettings = pgTable("ai_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  model: text("model").notNull(),
  temperature: integer("temperature").default(30).notNull(),
  maxTokens: integer("max_tokens").default(1200).notNull(),
  basePrompt: text("base_prompt").notNull(),
  ...timestamps
});

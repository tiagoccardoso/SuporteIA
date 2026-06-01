import { z } from "zod";

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
export const systemSchema = z.object({ name: z.string().min(2), slug: z.string().min(2).regex(/^[a-z0-9-]+$/), description: z.string().optional(), status: z.enum(["active", "inactive"]) });
export const articleSchema = z.object({ title: z.string().min(4), content: z.string().min(20), systemId: z.string().uuid(), category: z.string().min(2), tags: z.string().optional(), status: z.enum(["draft", "published", "archived"]) });
export const chatSchema = z.object({ question: z.string().min(5), systemId: z.string().uuid(), sessionId: z.string().uuid().optional() });
export const ticketSchema = z.object({ title: z.string().min(4), description: z.string().min(10), systemId: z.string().uuid(), priority: z.enum(["low", "medium", "high"]) });
export const aiSettingsSchema = z.object({ model: z.string().min(3), temperature: z.coerce.number().min(0).max(100), maxTokens: z.coerce.number().min(100).max(8000), basePrompt: z.string().min(30) });

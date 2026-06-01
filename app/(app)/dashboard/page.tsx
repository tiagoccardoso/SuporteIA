import { desc, eq, sql as dsql } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, documents, knowledgeArticles, tickets, unansweredQuestions } from "@/db/schema";
import { PageHeader } from "@/components/page-header";

export default async function DashboardPage() {
  const [articles] = await db.select({ count: dsql<number>`count(*)` }).from(knowledgeArticles);
  const [docs] = await db.select({ count: dsql<number>`count(*)` }).from(documents);
  const [openTickets] = await db.select({ count: dsql<number>`count(*)` }).from(tickets).where(eq(tickets.status, "open"));
  const [unanswered] = await db.select({ count: dsql<number>`count(*)` }).from(unansweredQuestions).where(eq(unansweredQuestions.status, "active"));
  const latest = await db.select().from(chatMessages).where(eq(chatMessages.role, "assistant")).orderBy(desc(chatMessages.createdAt)).limit(5);
  const cards = [["Artigos", articles.count], ["Documentos", docs.count], ["Tickets abertos", openTickets.count], ["Perguntas sem resposta", unanswered.count]];
  return <><PageHeader title="Dashboard" description="Resumo operacional da central de suporte." /><div className="grid gap-4 md:grid-cols-4">{cards.map(([label, value]) => <div className="card p-5" key={label}><div className="text-sm font-bold text-slate-500">{label}</div><div className="mt-2 text-4xl font-black">{value}</div></div>)}</div><section className="card mt-6 p-5"><h2 className="mb-3 text-xl font-black">Últimos atendimentos da IA</h2><div className="grid gap-3">{latest.map((message) => <article className="rounded-xl bg-slate-50 p-3" key={message.id}><p className="line-clamp-3 text-sm text-slate-700">{message.content}</p><span className="text-xs text-slate-500">Confiança: {message.confidence ?? 0}%</span></article>)}</div></section></>;
}

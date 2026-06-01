import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { ticketMessages, tickets } from "@/db/schema";
import { addTicketMessageAction, updateTicketAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  if (!ticket) notFound();
  const messages = await db.select().from(ticketMessages).where(eq(ticketMessages.ticketId, id)).orderBy(asc(ticketMessages.createdAt));
  return <><PageHeader title={ticket.title} description="Detalhe do ticket e histórico de comentários." /><div className="grid gap-5 lg:grid-cols-[1fr_340px]"><section className="card p-5"><p className="whitespace-pre-wrap text-slate-700">{ticket.description}</p><h2 className="mt-6 text-xl font-black">Comentários</h2><div className="mt-3 space-y-3">{messages.map((message) => <div className="rounded-xl bg-slate-50 p-3" key={message.id}>{message.message}<div className="mt-1 text-xs text-slate-500">{message.createdAt.toLocaleString("pt-BR")}</div></div>)}</div><form action={addTicketMessageAction} className="mt-4 grid gap-3"><input type="hidden" name="ticketId" value={ticket.id} /><textarea className="input" name="message" placeholder="Adicionar comentário" required /><button className="btn btn-primary w-fit">Comentar</button></form></section><form action={updateTicketAction} className="card grid h-fit gap-3 p-5"><input type="hidden" name="id" value={ticket.id} /><label>Status<select className="input mt-1" name="status" defaultValue={ticket.status}><option value="open">Aberto</option><option value="in_progress">Em andamento</option><option value="resolved">Resolvido</option><option value="closed">Fechado</option></select></label><label>Prioridade<select className="input mt-1" name="priority" defaultValue={ticket.priority}><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option></select></label><button className="btn btn-primary">Atualizar</button></form></div></>;
}

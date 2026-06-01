import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { systems, tickets } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { TicketForm } from "@/components/forms";

export default async function TicketsPage() {
  const [systemsList, rows] = await Promise.all([db.select().from(systems).orderBy(asc(systems.name)), db.select().from(tickets).orderBy(desc(tickets.createdAt))]);
  return <><PageHeader title="Tickets" description="Acompanhe solicitações que exigem análise humana." /><TicketForm systemsList={systemsList} /><div className="card mt-6 overflow-hidden"><table className="table"><thead><tr><th>Título</th><th>Status</th><th>Prioridade</th><th>Data</th></tr></thead><tbody>{rows.map((ticket) => <tr key={ticket.id}><td><Link className="font-bold text-blue-700" href={`/tickets/${ticket.id}`}>{ticket.title}</Link></td><td><span className="badge">{ticket.status}</span></td><td>{ticket.priority}</td><td>{ticket.createdAt.toLocaleDateString("pt-BR")}</td></tr>)}</tbody></table></div></>;
}

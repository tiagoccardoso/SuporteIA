import { asc } from "drizzle-orm";
import { db } from "@/db";
import { systems } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { SystemForm } from "@/components/forms";

export default async function SystemsPage() {
  const rows = await db.select().from(systems).orderBy(asc(systems.name));
  return <><PageHeader title="Sistemas e produtos" description="Cadastre os produtos internos que serão usados para segmentar o RAG." /><SystemForm /><div className="card mt-6 overflow-hidden"><table className="table"><thead><tr><th>Nome</th><th>Slug</th><th>Status</th><th>Descrição</th></tr></thead><tbody>{rows.map((system) => <tr key={system.id}><td className="font-bold">{system.name}</td><td>{system.slug}</td><td><span className="badge">{system.status}</span></td><td>{system.description}</td></tr>)}</tbody></table></div></>;
}

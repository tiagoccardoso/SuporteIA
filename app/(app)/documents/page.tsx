import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { documents, systems } from "@/db/schema";
import { uploadDocumentAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";

export default async function DocumentsPage() {
  const [systemsList, docs] = await Promise.all([db.select().from(systems).orderBy(asc(systems.name)), db.select().from(documents).orderBy(desc(documents.createdAt))]);
  return <><PageHeader title="Documentos" description="Faça upload de PDF, TXT ou Markdown para indexar na base semântica." /><form action={uploadDocumentAction} className="card grid gap-4 p-5 md:grid-cols-2"><input className="input" name="title" placeholder="Título opcional" /><select className="input" name="systemId" required>{systemsList.map((system) => <option key={system.id} value={system.id}>{system.name}</option>)}</select><input className="input md:col-span-2" name="file" type="file" accept=".pdf,.txt,.md,text/plain,text/markdown,application/pdf" required /><button className="btn btn-primary w-fit">Enviar e gerar embeddings</button></form><div className="card mt-6 overflow-hidden"><table className="table"><thead><tr><th>Título</th><th>Arquivo</th><th>Tipo</th><th>Data</th></tr></thead><tbody>{docs.map((doc) => <tr key={doc.id}><td className="font-bold">{doc.title}</td><td>{doc.fileName}</td><td>{doc.mimeType}</td><td>{doc.createdAt.toLocaleDateString("pt-BR")}</td></tr>)}</tbody></table></div></>;
}

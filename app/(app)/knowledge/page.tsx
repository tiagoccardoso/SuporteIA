import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { knowledgeArticles } from "@/db/schema";
import { deleteArticleAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";

export default async function KnowledgePage() {
  const rows = await db.select().from(knowledgeArticles).orderBy(desc(knowledgeArticles.createdAt));
  return <><PageHeader title="Base de conhecimento" description="Artigos versionáveis que alimentam a busca semântica." action={<Link className="btn btn-primary" href="/knowledge/new">Novo artigo</Link>} /><div className="card overflow-hidden"><table className="table"><thead><tr><th>Título</th><th>Categoria</th><th>Status</th><th>Tags</th><th></th></tr></thead><tbody>{rows.map((article) => <tr key={article.id}><td><Link className="font-bold text-blue-700" href={`/knowledge/${article.id}`}>{article.title}</Link></td><td>{article.category}</td><td><span className="badge">{article.status}</span></td><td>{article.tags?.join(", ")}</td><td><form action={deleteArticleAction}><input type="hidden" name="id" value={article.id} /><button className="text-sm font-bold text-red-600">Excluir</button></form></td></tr>)}</tbody></table></div></>;
}

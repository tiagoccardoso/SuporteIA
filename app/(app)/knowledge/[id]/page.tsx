import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { knowledgeArticles, systems } from "@/db/schema";
import { ArticleForm } from "@/components/forms";
import { PageHeader } from "@/components/page-header";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [article] = await db.select().from(knowledgeArticles).where(eq(knowledgeArticles.id, id)).limit(1);
  if (!article) notFound();
  const systemsList = await db.select().from(systems).orderBy(asc(systems.name));
  return <><PageHeader title="Editar artigo" description="Atualize o artigo e regenere os chunks e embeddings associados." /><ArticleForm systemsList={systemsList} article={article} /></>;
}

import { asc } from "drizzle-orm";
import { db } from "@/db";
import { systems } from "@/db/schema";
import { ArticleForm } from "@/components/forms";
import { PageHeader } from "@/components/page-header";

export default async function NewArticlePage({ searchParams }: { searchParams: Promise<{ question?: string; system?: string }> }) {
  const params = await searchParams;
  const systemsList = await db.select().from(systems).orderBy(asc(systems.name));
  return <><PageHeader title="Novo artigo" description="Ao salvar, o conteúdo será quebrado em chunks e indexado no pgvector." /><ArticleForm systemsList={systemsList} defaults={{ question: params.question, systemId: params.system }} /></>;
}

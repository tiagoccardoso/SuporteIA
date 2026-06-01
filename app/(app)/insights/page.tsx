import { desc } from "drizzle-orm";
import { db } from "@/db";
import { unansweredQuestions } from "@/db/schema";
import { convertQuestionToArticleAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";

export default async function InsightsPage() {
  const rows = await db.select().from(unansweredQuestions).orderBy(desc(unansweredQuestions.createdAt));
  return <><PageHeader title="Perguntas sem resposta" description="Transforme lacunas da IA em novos artigos para melhorar a cobertura da base." /><div className="card overflow-hidden"><table className="table"><thead><tr><th>Pergunta</th><th>Status</th><th>Data</th><th></th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td className="font-medium">{item.question}</td><td><span className="badge">{item.status}</span></td><td>{item.createdAt.toLocaleDateString("pt-BR")}</td><td><form action={convertQuestionToArticleAction}><input type="hidden" name="question" value={item.question} /><input type="hidden" name="systemId" value={item.systemId || ""} /><button className="text-sm font-bold text-blue-700">Criar artigo</button></form></td></tr>)}</tbody></table></div></>;
}

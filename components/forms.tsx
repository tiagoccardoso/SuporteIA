import type { systems, knowledgeArticles } from "@/db/schema";
import { saveArticleAction, saveSystemAction, createTicketAction } from "@/app/actions";

export function SystemForm({ system }: { system?: typeof systems.$inferSelect }) {
  return <form action={saveSystemAction} className="card grid gap-3 p-5 md:grid-cols-2">
    <input type="hidden" name="id" defaultValue={system?.id} />
    <label>Nome<input className="input mt-1" name="name" defaultValue={system?.name} required /></label>
    <label>Slug<input className="input mt-1" name="slug" defaultValue={system?.slug} required /></label>
    <label className="md:col-span-2">Descrição<textarea className="input mt-1" name="description" defaultValue={system?.description} /></label>
    <label>Status<select className="input mt-1" name="status" defaultValue={system?.status || "active"}><option value="active">Ativo</option><option value="inactive">Inativo</option></select></label>
    <div className="md:col-span-2"><button className="btn btn-primary">Salvar sistema</button></div>
  </form>;
}

export function ArticleForm({ systemsList, article, defaults }: { systemsList: Array<typeof systems.$inferSelect>; article?: typeof knowledgeArticles.$inferSelect; defaults?: { question?: string; systemId?: string } }) {
  return <form action={saveArticleAction} className="card grid gap-4 p-6">
    <input type="hidden" name="id" defaultValue={article?.id} />
    <label>Título<input className="input mt-1" name="title" defaultValue={article?.title || defaults?.question || ""} required /></label>
    <label>Sistema<select className="input mt-1" name="systemId" defaultValue={article?.systemId || defaults?.systemId} required>{systemsList.map((system) => <option key={system.id} value={system.id}>{system.name}</option>)}</select></label>
    <div className="grid gap-4 md:grid-cols-3"><label>Categoria<input className="input mt-1" name="category" defaultValue={article?.category || "Geral"} /></label><label>Tags<input className="input mt-1" name="tags" defaultValue={article?.tags?.join(", ")} placeholder="login, faturamento" /></label><label>Status<select className="input mt-1" name="status" defaultValue={article?.status || "draft"}><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label></div>
    <label>Conteúdo<textarea className="input mt-1 min-h-72" name="content" defaultValue={article?.content || "Descreva o procedimento, causas, passos e observações."} required /></label>
    <button className="btn btn-primary w-fit">Salvar artigo e gerar embeddings</button>
  </form>;
}

export function TicketForm({ systemsList, defaults }: { systemsList: Array<typeof systems.$inferSelect>; defaults?: { title?: string; description?: string; systemId?: string } }) {
  return <form action={createTicketAction} className="card grid gap-3 p-5">
    <input className="input" name="title" defaultValue={defaults?.title} placeholder="Título do ticket" required />
    <select className="input" name="systemId" defaultValue={defaults?.systemId} required>{systemsList.map((system) => <option key={system.id} value={system.id}>{system.name}</option>)}</select>
    <select className="input" name="priority" defaultValue="medium"><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option></select>
    <textarea className="input min-h-32" name="description" defaultValue={defaults?.description} placeholder="Descreva o problema" required />
    <button className="btn btn-primary w-fit">Abrir ticket</button>
  </form>;
}

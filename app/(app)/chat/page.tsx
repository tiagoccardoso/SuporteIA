import { asc, eq } from "drizzle-orm";
import { askChatAction, createTicketAction, feedbackAction } from "@/app/actions";
import { db } from "@/db";
import { chatMessages, systems } from "@/db/schema";
import { PageHeader } from "@/components/page-header";

type ChatSource = {
  metadata?: {
    title?: string;
    source?: string;
  };
  similarity?: number;
  system_id?: string;
};

export default async function ChatPage({
  searchParams
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const params = await searchParams;
  const systemsList = await db.select().from(systems).orderBy(asc(systems.name));
  const messages = params.session
    ? await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, params.session))
        .orderBy(asc(chatMessages.createdAt))
    : [];
  const lastAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const firstUser = messages.find((message) => message.role === "user");
  const lastAssistantSources = (lastAssistant?.sources ?? []) as ChatSource[];

  return (
    <>
      <PageHeader
        title="Chat com IA"
        description="Pergunte sobre um sistema e receba respostas com fontes da base de conhecimento."
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="card flex min-h-[560px] flex-col p-5">
          <div className="flex-1 space-y-4 overflow-auto">
            {messages.length === 0 && (
              <div className="rounded-2xl bg-blue-50 p-5 text-blue-900">
                Selecione um sistema, faça uma pergunta e o SupportAI Hub buscará os chunks mais relevantes no pgvector.
              </div>
            )}

            {messages.map((message) => {
              const sources = message.sources as ChatSource[];

              return (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-2xl rounded-2xl bg-blue-600 p-4 text-white"
                      : "max-w-3xl rounded-2xl bg-slate-100 p-4 text-slate-900"
                  }
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.role === "assistant" && (
                    <div className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-600">
                      <strong>Fontes:</strong>
                      {sources.map((source, index) => (
                        <span key={index}>
                          {" "}
                          {source.metadata?.title || source.metadata?.source || "Fonte"} ({Math.round((source.similarity || 0) * 100)}%)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <form action={askChatAction} className="mt-4 grid gap-3">
            <input type="hidden" name="sessionId" value={params.session || ""} />
            <select className="input" name="systemId" required>
              {systemsList.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.name}
                </option>
              ))}
            </select>
            <textarea className="input min-h-24" name="question" placeholder="Digite sua dúvida..." required />
            <button className="btn btn-primary">Perguntar</button>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="font-black">Feedback</h2>
            {lastAssistant ? (
              <form action={feedbackAction} className="mt-3 grid gap-2">
                <input type="hidden" name="messageId" value={lastAssistant.id} />
                <input type="hidden" name="question" value={firstUser?.content || ""} />
                <input
                  type="hidden"
                  name="systemId"
                  value={String(lastAssistantSources[0]?.system_id || systemsList[0]?.id || "")}
                />
                <button className="btn btn-secondary" name="resolved" value="1">
                  Resolveu minha dúvida
                </button>
                <button className="btn btn-secondary" name="resolved" value="0">
                  Não resolveu
                </button>
              </form>
            ) : (
              <p className="text-sm text-slate-500">Disponível após uma resposta.</p>
            )}
          </div>

          <form action={createTicketAction} className="card grid gap-3 p-5">
            <h2 className="font-black">Abrir ticket</h2>
            <input className="input" name="title" defaultValue={firstUser?.content?.slice(0, 80)} placeholder="Título" required />
            <select className="input" name="systemId" required>
              {systemsList.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.name}
                </option>
              ))}
            </select>
            <select className="input" name="priority" defaultValue="medium">
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
            <textarea className="input" name="description" defaultValue={firstUser?.content} placeholder="Descrição" required />
            <button className="btn btn-primary">Abrir ticket</button>
          </form>
        </aside>
      </div>
    </>
  );
}

import { buildContext, hasLowConfidence, type RagSource } from "./rag";

export const DEFAULT_PROMPT = `Você é a IA de suporte interno do SupportAI Hub.
Responda sempre em português do Brasil, de forma clara, objetiva e profissional.
Use exclusivamente as informações fornecidas no contexto da base de conhecimento.
Não invente procedimentos, links, políticas ou dados.
Quando o contexto não for suficiente, diga que não encontrou base suficiente e sugira abrir um ticket.
Ao final, cite as fontes usadas pelo título ou identificador.`;

type GenerateAnswerInput = {
  question: string;
  sources: RagSource[];
  settings?: { model: string; temperature: number; maxTokens: number; basePrompt: string } | null;
};

export async function generateAnswer({ question, sources, settings }: GenerateAnswerInput) {
  const lowConfidence = hasLowConfidence(sources);
  if (lowConfidence || !process.env.DEEPSEEK_API_KEY) {
    return {
      answer: lowConfidence
        ? "Não encontrei informações suficientes na base de conhecimento para responder com segurança. Recomendo abrir um ticket para que o time de suporte avalie o caso."
        : "A chave DEEPSEEK_API_KEY não está configurada. Configure a integração para gerar respostas com IA.",
      confidence: lowConfidence ? 20 : 0,
      shouldOpenTicket: true
    };
  }

  const model = settings?.model || process.env.DEEPSEEK_MODEL || "deepseek-chat";
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model,
      temperature: (settings?.temperature ?? 30) / 100,
      max_tokens: settings?.maxTokens ?? 1200,
      messages: [
        { role: "system", content: settings?.basePrompt || DEFAULT_PROMPT },
        { role: "user", content: `Contexto:\n${buildContext(sources)}\n\nPergunta do usuário:\n${question}` }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek retornou ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return {
    answer: data.choices?.[0]?.message?.content || "Não foi possível gerar uma resposta.",
    confidence: Math.round(Math.max(...sources.map((source) => source.similarity)) * 100),
    shouldOpenTicket: false
  };
}

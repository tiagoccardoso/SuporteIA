import { desc } from "drizzle-orm";
import { db } from "@/db";
import { aiSettings } from "@/db/schema";
import { saveAiSettingsAction } from "@/app/actions";
import { DEFAULT_PROMPT } from "@/lib/deepseek";
import { PageHeader } from "@/components/page-header";

export default async function AiSettingsPage() {
  const [settings] = await db.select().from(aiSettings).orderBy(desc(aiSettings.createdAt)).limit(1);
  return <><PageHeader title="Configurações de IA" description="Ajuste modelo DeepSeek, temperatura, limite de tokens e prompt base." /><form action={saveAiSettingsAction} className="card grid gap-4 p-6"><input type="hidden" name="id" defaultValue={settings?.id} /><label>Modelo<input className="input mt-1" name="model" defaultValue={settings?.model || process.env.DEEPSEEK_MODEL || "deepseek-chat"} /></label><div className="grid gap-4 md:grid-cols-2"><label>Temperatura (0-100)<input className="input mt-1" name="temperature" type="number" min="0" max="100" defaultValue={settings?.temperature ?? 30} /></label><label>Limite de tokens<input className="input mt-1" name="maxTokens" type="number" min="100" max="8000" defaultValue={settings?.maxTokens ?? 1200} /></label></div><label>Prompt base<textarea className="input mt-1 min-h-64" name="basePrompt" defaultValue={settings?.basePrompt || DEFAULT_PROMPT} /></label><button className="btn btn-primary w-fit">Salvar configurações</button></form></>;
}

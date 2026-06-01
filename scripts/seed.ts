import postgres from "postgres";
import { hashPassword } from "../lib/password";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL não configurada");

const client = postgres(databaseUrl, { max: 1, ssl: "require" });
const adminEmail = (process.env.ADMIN_EMAIL || "admin@supportai.local").toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456";

await client`
  INSERT INTO users (name, email, password_hash, role)
  VALUES ('Administrador', ${adminEmail}, ${hashPassword(adminPassword)}, 'admin')
  ON CONFLICT (email) DO NOTHING
`;

const products = [
  ["ClassFlow", "classflow", "Gestão de turmas, aulas e jornadas educacionais."],
  ["BuscaCNAE", "buscacnae", "Consulta e classificação de CNAEs."],
  ["PlantaSã", "plantasa", "Operações agrícolas e sanidade vegetal."],
  ["DentalSys", "dentalsys", "Gestão clínica odontológica."],
  ["FisioSys", "fisiosys", "Gestão de atendimentos de fisioterapia."],
  ["SelectSaaS", "selectsaas", "Plataforma SaaS de seleção e automação."]
];

for (const [name, slug, description] of products) {
  await client`
    INSERT INTO systems (name, slug, description, status)
    VALUES (${name}, ${slug}, ${description}, 'active')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, updated_at = now()
  `;
}

await client`
  INSERT INTO ai_settings (model, temperature, max_tokens, base_prompt)
  SELECT 'deepseek-chat', 30, 1200, 'Você é a IA de suporte interno do SupportAI Hub. Responda sempre em português do Brasil usando apenas o contexto da base de conhecimento. Não invente respostas. Informe quando não houver informação suficiente, cite fontes e sugira abertura de ticket quando necessário.'
  WHERE NOT EXISTS (SELECT 1 FROM ai_settings)
`;

await client.end();
console.log(`Seed concluído. Admin: ${adminEmail} / ${adminPassword}`);

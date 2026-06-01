import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL não configurada");

const client = postgres(databaseUrl, { max: 1, ssl: "require" });
const migrationsDir = join(process.cwd(), "migrations");

for (const file of readdirSync(migrationsDir).filter((name) => name.endsWith(".sql")).sort()) {
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  console.log(`Aplicando ${file}...`);
  await client.unsafe(sql);
}

await client.end();
console.log("Migrations aplicadas com sucesso.");

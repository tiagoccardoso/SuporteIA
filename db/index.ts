import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "test") {
  console.warn("DATABASE_URL não configurada. Operações de banco falharão até configurar o Neon PostgreSQL.");
}

const sql = neon(process.env.DATABASE_URL || "postgresql://invalid:invalid@localhost/invalid");
export const db = drizzle(sql, { schema });
export { sql };

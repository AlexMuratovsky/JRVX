import { env } from "cloudflare:workers";
export function plannerDatabase(): D1Database {
  const db=(env as unknown as {DB?:D1Database}).DB;
  if(!db) throw new Error("Planner database is unavailable");
  return db;
}

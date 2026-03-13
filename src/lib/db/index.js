import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

let db;

if (process.env.NODE_ENV === "production") {
  const client = postgres(connectionString);
  db = drizzle(client, { schema });
} else {
  if (!globalThis.__db) {
    const client = postgres(connectionString);
    globalThis.__db = drizzle(client, { schema });
  }
  db = globalThis.__db;
}

export { db };

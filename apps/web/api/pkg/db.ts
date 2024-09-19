import { createClient as createLibSqlClient, libSqlDrizzle } from "@chat/db";
import { Client as LibSqlClient } from "@chat/db";
import { env } from "../../env";

export * from "@chat/db";

export type Database = ReturnType<typeof libSqlDrizzle>;

let client = null as LibSqlClient | null;
let db = null as Database | null;

export function createClient() {
  if (client) return client;

  client = createLibSqlClient({
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  });

  return client;
}

export function createDB() {
  if (db) return db;

  let _client = client;
  if (!_client) {
    _client = createClient();
  }

  db = libSqlDrizzle(_client, {
    logger: env.ENVIRONMENT === "production",
  });

  return db;
}

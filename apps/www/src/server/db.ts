import { createClient, libSqlDrizzle } from "@chat/db";
import { env } from "../env";

export * from "@chat/db";

export const client = createClient({
  url: env.DATABASE_URL,
  authToken: env.DATABASE_AUTH_TOKEN,
});

export const db = libSqlDrizzle(client, { logger: env.PROD });

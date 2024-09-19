import { createClient } from "./db";
import { LibSQLAdapter } from "@lucia-auth/adapter-sqlite";
import { Lucia, TimeSpan } from "lucia";
import { env } from "../../env";

const adapter = new LibSQLAdapter(createClient(), {
  user: "users",
  session: "user_sessions",
});

export const lucia = new Lucia(adapter, {
  sessionExpiresIn: new TimeSpan(3, "d"),
  sessionCookie: {
    name: "chat-session",
    expires: true,
    attributes: {
      sameSite: "lax",
      secure: env.ENVIRONMENT === "production", // set to `true` when using HTTPS
    },
  },

  getUserAttributes: (attributes) => {
    return {
      // attributes has the type of DatabaseUserAttributes
      email: attributes.email,
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: Lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }

  interface DatabaseUserAttributes {
    email: string;
  }
}

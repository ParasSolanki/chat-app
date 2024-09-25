import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  server: {
    TOKEN_SECRET: z
      .string({ required_error: "TOKEN_SECRET is required" })
      .min(10, "TOKEN_SECRET must contain at most 10 character(s)"),
    PORT: z.coerce
      .number(z.string({ required_error: "PORT is required" }))
      .default(3000),
    BASE_URL: z
      .string({ required_error: "BASE_URL is required" })
      .min(1, "BASE_URL is required")
      .url(),
    DATABASE_URL: z
      .string({ required_error: "DATABASE_URL is required" })
      .min(1, "DATABASE_URL is required"),
    DATABASE_AUTH_TOKEN: z
      .string({ required_error: "DATABASE_AUTH_TOKEN is required" })
      .min(1, "DATABASE_AUTH_TOKEN is required"),
    UPLOADTHING_TOKEN: z
      .string({ required_error: "UPLOADTHING_TOKEN is required" })
      .min(1, "UPLOADTHING_TOKEN is required"),
  },

  shared: {
    ENVIRONMENT: z.enum(["development", "preview", "canary", "production"], {
      message: "ENVIRONMENT is required",
    }),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: "VITE_PUBLIC_",
  /*
   * Environment variables available on the client (and server).
   *
   * 💡 You'll get type errors if these are not prefixed with VITE_PUBLIC_.
   */
  client: {
    VITE_PUBLIC_API_URL: z
      .string({ required_error: "VITE_PUBLIC_API_URL is required" })
      .min(1, "VITE_PUBLIC_API_URL is required")
      .url("VITE_PUBLIC_API_URL is not an url"),
    VITE_PUBLIC_WEBSITE_URL: z
      .string({ required_error: "VITE_PUBLIC_WEBSITE_URL is required" })
      .min(1, "VITE_PUBLIC_WEBSITE_URL is required")
      .url("VITE_PUBLIC_WEBSITE_URL is not an url"),
  },

  runtimeEnv: {
    PORT: process.env.PORT,
    ENVIRONMENT: process.env.NODE_ENV,
    TOKEN_SECRET: process.env.TOKEN_SECRET,
    BASE_URL: process.env.BASE_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN,
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    VITE_PUBLIC_WEBSITE_URL: process.env.VITE_PUBLIC_WEBSITE_URL,
    VITE_PUBLIC_API_URL: process.env.VITE_PUBLIC_API_URL,
  },
});

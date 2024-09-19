import { z } from "zod";

export * from "./channel";

export const successResponseSchema = z.object({
  ok: z.boolean().default(true),
  code: z.literal("OK"),
});

export const workspaceSchema = z
  .string({
    invalid_type_error: "Invalid workspace",
    required_error: "Workspace is required",
  })
  .min(1, "Workspace is required")
  .max(13, "Invalid workspace");

export const channelSchema = z
  .string({ invalid_type_error: "Invalid channel" })
  .max(13, "Invalid workspace");

export const recipientSchema = z
  .string({ invalid_type_error: "Invalid recipient" })
  .max(13, "Invalid recipient");

export const memberSchema = z
  .string({ invalid_type_error: "Invalid member" })
  .max(13, "Invalid member");

export const messageSlugSchema = z
  .string({ invalid_type_error: "Invalid message" })
  .max(22, "Invalid message");

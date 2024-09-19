import { z } from "zod";

export const MAX_CHANNEL_NAME_LENGTH = 80;

export const createChannelSchema = z.object({
  name: z
    .string({
      required_error: "Name is required",
      invalid_type_error: "Name is required",
    })
    .min(1, { message: "Name is required" })
    .max(MAX_CHANNEL_NAME_LENGTH, {
      message: `Name must be at most ${MAX_CHANNEL_NAME_LENGTH} character(s)`,
    }),
  type: z.enum(["public", "private"], { message: "Required" }),
});

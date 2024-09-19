import { createRoute, z } from "@hono/zod-openapi";
import { createProtectedApp } from "../pkg/create-app";
import {
  badRequestErrorResponse,
  forbiddenErrorResponse,
  internalServerErrorResponse,
  requestTimeoutErrorResponse,
  tooManyRequestsErrorResponse,
} from "../pkg/errors/response";
import { successResponseSchema, workspaceSchema } from "../common/schema";

const sessionUserSchema = successResponseSchema.extend({
  data: z.object({
    user: z.object({
      id: z.string(),
      email: z.string(),
      name: z.string(),
      slug: z.string(),
      username: z.string(),
      avatarUrl: z.string().nullable(),
      role: z.object({
        id: z.string(),
        name: z.string(),
      }),
    }),
  }),
});

const sessionRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Session"],
  request: {
    query: z.object({
      workspace: workspaceSchema,
    }),
  },
  responses: {
    200: {
      description: "Session user",
      content: {
        "application/json": {
          schema: sessionUserSchema,
        },
      },
    },
    ...badRequestErrorResponse,
    ...forbiddenErrorResponse,
    ...requestTimeoutErrorResponse,
    ...tooManyRequestsErrorResponse,
    ...internalServerErrorResponse,
  },
});

export const route = createProtectedApp().openapi(sessionRoute, async (c) => {
  const member = c.get("member");

  return c.json(
    {
      ok: true,
      code: "OK" as const,
      data: {
        user: member,
      },
    },
    200
  );
});

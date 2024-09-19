import { createRoute, z } from "@hono/zod-openapi";
import { createProtectedApp } from "../pkg/create-app";
import { schema, eq, and } from "../pkg/db";
import {
  badRequestErrorResponse,
  forbiddenErrorResponse,
  internalServerErrorResponse,
  notFoundErrorResponse,
  requestTimeoutErrorResponse,
  tooManyRequestsErrorResponse,
} from "../pkg/errors/response";
import {
  memberSchema,
  successResponseSchema,
  workspaceSchema,
} from "../common/schema";
import { forbiddenError, internalServerError } from "../pkg/errors/http";

const getMemberDetailsResponseSchema = successResponseSchema.extend({
  data: z.object({
    member: z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      isActive: z.boolean(),
      username: z.string(),
      email: z.string().nullable(),
      avatarUrl: z.string().nullable(),
    }),
  }),
});

const getMemberDetailsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Members"],
  request: {
    query: z.object({
      workspace: workspaceSchema,
      member: memberSchema,
    }),
  },
  responses: {
    200: {
      description: "Member details",
      content: {
        "application/json": {
          schema: getMemberDetailsResponseSchema,
        },
      },
    },
    ...badRequestErrorResponse,
    ...forbiddenErrorResponse,
    ...notFoundErrorResponse,
    ...requestTimeoutErrorResponse,
    ...tooManyRequestsErrorResponse,
    ...internalServerErrorResponse,
  },
});

export const route = createProtectedApp().openapi(
  getMemberDetailsRoute,
  async (c) => {
    const query = c.req.valid("query");
    const db = c.get("db");
    const workspace = c.get("workspace");

    try {
      const [member] = await db
        .select({
          id: schema.workspaceMembersTable.id,
          name: schema.workspaceMembersTable.name,
          email: schema.usersTable.email,
          slug: schema.workspaceMembersTable.slug,
          avatarUrl: schema.workspaceMembersTable.avatarUrl,
          username: schema.workspaceMembersTable.username,
          isActive: schema.workspaceMembersTable.isActive,
        })
        .from(schema.workspaceMembersTable)
        .leftJoin(
          schema.usersTable,
          eq(schema.usersTable.id, schema.workspaceMembersTable.userId)
        )
        .where(
          and(
            eq(schema.workspaceMembersTable.slug, query.member),
            eq(schema.workspaceMembersTable.workspaceId, workspace.id)
          )
        )
        .limit(1);

      if (!member) return forbiddenError(c);

      return c.json(
        {
          ok: true,
          code: "OK" as const,
          data: { member },
        },
        200
      );
    } catch (e) {
      console.error(e);
      return internalServerError(c);
    }
  }
);

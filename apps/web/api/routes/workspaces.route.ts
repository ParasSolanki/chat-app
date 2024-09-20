import { createRoute, z } from "@hono/zod-openapi";
import { createProtectedApp } from "../pkg/create-app";
import { schema, eq, asc, aliasedTable } from "../pkg/db";
import {
  badRequestErrorResponse,
  forbiddenErrorResponse,
  internalServerErrorResponse,
  notFoundErrorResponse,
  requestTimeoutErrorResponse,
  tooManyRequestsErrorResponse,
} from "../pkg/errors/response";
import { successResponseSchema, workspaceSchema } from "../common/schema";
import { internalServerError, notFoundError } from "../pkg/errors/http";

const workspaceResponseSchema = successResponseSchema.extend({
  data: z.object({
    workspace: z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      description: z.string().nullable(),
      createdAt: z.string(),
      updatedAt: z.string().nullable(),
      channelSlug: z.string().nullable(),
      owner: z
        .object({
          id: z.string(),
          name: z.string(),
          slug: z.string(),
        })
        .nullable(),
    }),
  }),
});

const workspaceRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Workspace"],
  request: {
    query: z.object({
      workspace: workspaceSchema,
    }),
  },
  responses: {
    200: {
      description: "Workspace",
      content: {
        "application/json": {
          schema: workspaceResponseSchema,
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

export const route = createProtectedApp().openapi(workspaceRoute, async (c) => {
  const { workspace } = c.req.valid("query");
  const db = c.get("db");

  try {
    const wTable = aliasedTable(schema.workspacesTable, "w");
    const cTable = aliasedTable(schema.workspaceChannelsTable, "c");
    const subquery = db
      .select({
        workspaceSlug: wTable.slug,
        channelSlug: cTable.slug,
      })
      .from(cTable)
      .innerJoin(wTable, eq(wTable.id, cTable.workspaceId))
      .where(eq(wTable.slug, workspace))
      .groupBy(wTable.slug)
      .orderBy(asc(cTable.createdAt))
      .limit(1)
      .as("first_channel");

    const [w] = await db
      .select({
        id: schema.workspacesTable.id,
        name: schema.workspacesTable.name,
        slug: schema.workspacesTable.slug,
        createdAt: schema.workspacesTable.createdAt,
        updatedAt: schema.workspacesTable.updatedAt,
        description: schema.workspacesTable.description,
        channelSlug: subquery.channelSlug,
        owner: {
          id: schema.workspaceMembersTable.id,
          name: schema.workspaceMembersTable.name,
          slug: schema.workspaceMembersTable.slug,
        },
      })
      .from(schema.workspacesTable)
      .leftJoin(
        schema.workspaceMembersTable,
        eq(schema.workspaceMembersTable.workspaceId, schema.workspacesTable.id)
      )
      .leftJoin(
        subquery,
        eq(subquery.workspaceSlug, schema.workspacesTable.slug)
      )
      .where(eq(schema.workspacesTable.slug, workspace))
      .limit(1);

    if (!w) {
      return notFoundError(c, "Workspace not found");
    }

    return c.json(
      {
        ok: true,
        code: "OK" as const,
        data: {
          workspace: w,
        },
      },
      200
    );
  } catch (e) {
    return internalServerError(c);
  }
});

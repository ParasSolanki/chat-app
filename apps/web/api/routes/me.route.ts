import { createRoute, z } from "@hono/zod-openapi";
import { createProtectedApp } from "../pkg/create-app";
import { schema, eq, and, or, max, sql, desc, lt } from "../pkg/db";
import {
  badRequestErrorResponse,
  forbiddenErrorResponse,
  internalServerErrorResponse,
  requestTimeoutErrorResponse,
  tooManyRequestsErrorResponse,
} from "../pkg/errors/response";
import { successResponseSchema, workspaceSchema } from "../common/schema";
import { internalServerError } from "../pkg/errors/http";

const meGetChannelsResponseSchema = successResponseSchema.extend({
  data: z.object({
    channels: z
      .object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        isPrivate: z.boolean(),
      })
      .array(),
  }),
});

const meGetChannelsRoute = createRoute({
  method: "get",
  path: "/channels",
  tags: ["Me"],
  request: {
    query: z.object({
      workspace: workspaceSchema,
    }),
  },
  responses: {
    200: {
      description: "Me channels",
      content: {
        "application/json": {
          schema: meGetChannelsResponseSchema,
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

const meGetDmsResponseSchema = successResponseSchema.extend({
  data: z.object({
    dms: z
      .object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        username: z.string(),
        avatarUrl: z.string().nullable(),
      })
      .array(),
  }),
});

const meGetDmsRoute = createRoute({
  method: "get",
  path: "/dms",
  tags: ["Me"],
  request: {
    query: z.object({
      workspace: workspaceSchema,
    }),
  },
  responses: {
    200: {
      description: "Me dms",
      content: {
        "application/json": {
          schema: meGetDmsResponseSchema,
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

export const route = createProtectedApp()
  .openapi(meGetChannelsRoute, async (c) => {
    c.req.valid("query");
    const db = c.get("db");
    const member = c.get("member");

    try {
      const channels = await db
        .select({
          id: schema.workspaceChannelsTable.id,
          name: schema.workspaceChannelsTable.name,
          slug: schema.workspaceChannelsTable.slug,
          isPrivate: schema.workspaceChannelsTable.isPrivate,
        })
        .from(schema.workspaceChannelsTable)
        .leftJoin(
          schema.workspaceMembersTable,
          eq(
            schema.workspaceMembersTable.id,
            schema.workspaceChannelMembersTable.memberId
          )
        )
        .leftJoin(
          schema.workspaceChannelMembersTable,
          eq(
            schema.workspaceChannelMembersTable.channelId,
            schema.workspaceChannelsTable.id
          )
        )
        .where(and(eq(schema.workspaceMembersTable.id, member.id)));

      return c.json(
        {
          ok: true,
          code: "OK" as const,
          data: { channels },
        },
        200
      );
    } catch (e) {
      return internalServerError(c);
    }
  })
  .openapi(meGetDmsRoute, async (c) => {
    const query = c.req.valid("query");
    const workspace = c.get("workspace");
    const db = c.get("db");
    const member = c.get("member");

    try {
      const MEMBERS_LIMIT = 15;

      const rankedSq = db.$with("RankedMembers").as(
        db
          .select({
            id: schema.workspaceMembersTable.id,
            name: schema.workspaceMembersTable.name,
            slug: schema.workspaceMembersTable.slug,
            username: schema.workspaceMembersTable.username,
            avatarUrl: schema.workspaceMembersTable.avatarUrl,
            rowNum:
              sql`case when ${schema.workspaceMembersTable.id} = ${member.id} then 0 else ROW_NUMBER() over (order by MAX(${schema.workspaceMessagesTable.createdAt}) desc NULLS last) end`
                .mapWith(Number)
                .as("row_num"),
          })
          .from(schema.workspaceMembersTable)
          .leftJoin(
            schema.workspaceMessagesTable,
            and(
              or(
                eq(
                  schema.workspaceMessagesTable.senderId,
                  schema.workspaceMembersTable.id
                ),
                eq(
                  schema.workspaceMessagesTable.recipientId,
                  schema.workspaceMembersTable.id
                )
              ),
              or(
                eq(schema.workspaceMessagesTable.senderId, member.id), // current user
                eq(schema.workspaceMessagesTable.recipientId, member.id) // current user
              )
            )
          )
          .where(
            and(
              eq(schema.workspaceMembersTable.isActive, true),
              eq(schema.workspaceMembersTable.workspaceId, workspace.id) // only of current workspace
            )
          )
          .groupBy(schema.workspaceMembersTable.id)
      );

      const dms = await db
        .with(rankedSq)
        .select({
          id: rankedSq.id,
          name: rankedSq.name,
          slug: rankedSq.slug,
          username: rankedSq.username,
          avatarUrl: rankedSq.avatarUrl,
        })
        .from(rankedSq)
        .where(lt(rankedSq.rowNum, MEMBERS_LIMIT))
        .orderBy(desc(rankedSq.rowNum))
        .limit(MEMBERS_LIMIT);

      return c.json(
        {
          ok: true,
          code: "OK" as const,
          data: { dms },
        },
        200
      );
    } catch (e) {
      return internalServerError(c);
    }
  });

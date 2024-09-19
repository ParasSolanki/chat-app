import { createRoute, z } from "@hono/zod-openapi";
import { createProtectedApp } from "../pkg/create-app";
import { schema, eq, asc, aliasedTable, and } from "../pkg/db";
import {
  badRequestErrorResponse,
  conflictErrorResponse,
  forbiddenErrorResponse,
  internalServerErrorResponse,
  notFoundErrorResponse,
  requestTimeoutErrorResponse,
  tooManyRequestsErrorResponse,
} from "../pkg/errors/response";
import {
  channelSchema,
  createChannelSchema,
  successResponseSchema,
  workspaceSchema,
} from "../common/schema";
import {
  conflictError,
  internalServerError,
  notFoundError,
} from "../pkg/errors/http";
import { generateChannelSlug } from "../utils/generate";

const channelResponseSchema = successResponseSchema.extend({
  data: z.object({
    channel: z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      isPrivate: z.boolean(),
      description: z.string().nullable(),
      createdAt: z.string(),
      updatedAt: z.string().nullable(),
      archivedAt: z.string().nullable(),
      createdBy: z
        .object({
          id: z.string(),
          name: z.string(),
          slug: z.string(),
          username: z.string(),
        })
        .nullable(),
      archivedBy: z
        .object({
          id: z.string(),
          name: z.string(),
          slug: z.string(),
          username: z.string(),
        })
        .nullable(),
    }),
  }),
});

const channelRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Channel"],
  request: {
    query: z.object({
      workspace: workspaceSchema,
      channel: channelSchema,
    }),
  },
  responses: {
    200: {
      description: "Workspace",
      content: {
        "application/json": {
          schema: channelResponseSchema,
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

const createChannelResponseSchema = successResponseSchema.extend({
  data: z.object({
    channel: z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      isPrivate: z.boolean(),
    }),
  }),
});

const createChannelRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Channel"],
  request: {
    query: z.object({
      workspace: workspaceSchema,
    }),
    body: {
      description: "Create workspace channel schema",
      content: {
        "application/json": {
          schema: createChannelSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Create workspace channel",
      content: {
        "application/json": {
          schema: createChannelResponseSchema,
        },
      },
    },
    ...badRequestErrorResponse,
    ...forbiddenErrorResponse,
    ...notFoundErrorResponse,
    ...conflictErrorResponse,
    ...requestTimeoutErrorResponse,
    ...tooManyRequestsErrorResponse,
    ...internalServerErrorResponse,
  },
});

export const route = createProtectedApp()
  .openapi(channelRoute, async (c) => {
    const query = c.req.valid("query");
    const db = c.get("db");
    const member = c.get("member");

    try {
      const createdByTable = aliasedTable(
        schema.workspaceMembersTable,
        "created_by_members"
      );
      const archivedByTable = aliasedTable(
        schema.workspaceMembersTable,
        "archived_by_members"
      );

      const [channel] = await db
        .select({
          id: schema.workspaceChannelsTable.id,
          name: schema.workspaceChannelsTable.name,
          slug: schema.workspaceChannelsTable.slug,
          isPrivate: schema.workspaceChannelsTable.isPrivate,
          description: schema.workspaceChannelsTable.description,
          createdAt: schema.workspaceChannelsTable.createdAt,
          updatedAt: schema.workspaceChannelsTable.updatedAt,
          archivedAt: schema.workspaceChannelsTable.archivedAt,
          createdBy: {
            id: createdByTable.id,
            slug: createdByTable.slug,
            name: createdByTable.name,
            username: createdByTable.username,
          },
          archivedBy: {
            id: archivedByTable.id,
            slug: archivedByTable.slug,
            name: archivedByTable.name,
            username: archivedByTable.username,
          },
        })
        .from(schema.workspaceChannelsTable)
        .leftJoin(
          schema.workspaceChannelMembersTable,
          and(
            eq(
              schema.workspaceChannelMembersTable.channelId,
              schema.workspaceChannelsTable.id
            ),
            eq(
              schema.workspaceChannelMembersTable.memberId,
              schema.workspaceMembersTable.id
            )
          )
        )
        .leftJoin(
          schema.workspaceMembersTable,
          eq(
            schema.workspaceMembersTable.id,
            schema.workspaceChannelMembersTable.memberId
          )
        )
        .leftJoin(
          createdByTable,
          eq(createdByTable.id, schema.workspaceChannelsTable.createdById)
        )
        .leftJoin(
          archivedByTable,
          eq(archivedByTable.id, schema.workspaceChannelsTable.archivedById)
        )
        .where(
          and(
            eq(schema.workspaceChannelsTable.slug, query.channel),
            eq(schema.workspaceChannelMembersTable.memberId, member.id)
          )
        );

      if (!channel) {
        return notFoundError(c, "Channel not found");
      }

      return c.json(
        {
          ok: true,
          code: "OK" as const,
          data: { channel },
        },
        200
      );
    } catch (e) {
      console.log(e);
      return internalServerError(c);
    }
  })
  .openapi(createChannelRoute, async (c) => {
    const query = c.req.valid("query");
    const body = c.req.valid("json");
    const db = c.get("db");
    const member = c.get("member");
    const workspace = c.get("workspace");

    try {
      const [channel] = await db
        .select({
          id: schema.workspaceChannelsTable.id,
        })
        .from(schema.workspaceChannelsTable)
        .where(
          and(
            eq(schema.workspaceChannelsTable.name, body.name),
            eq(schema.workspaceChannelsTable.workspaceId, workspace.id)
          )
        )
        .limit(1);

      if (channel) {
        return conflictError(c, {
          message: "Channel already exists with name",
        });
      }
    } catch (e) {
      console.error(e);
      return internalServerError(c);
    }

    // TODO: We should also check that workspace member has access to create channel or not based on role
    // If its admin or member allow else if its guest dont allow

    try {
      const channel = await db.transaction(async (tx) => {
        let slug = generateChannelSlug();
        let hasWorkspaceWithSlug = true;

        do {
          const [channel] = await db
            .select({
              id: schema.workspaceChannelsTable.id,
            })
            .from(schema.workspaceChannelsTable)
            .where(
              and(
                eq(schema.workspaceChannelsTable.slug, slug),
                eq(schema.workspaceChannelsTable.workspaceId, workspace.id)
              )
            )
            .limit(1);

          if (channel) slug = generateChannelSlug();
          else hasWorkspaceWithSlug = false;
        } while (hasWorkspaceWithSlug);

        const [channel] = await tx
          .insert(schema.workspaceChannelsTable)
          .values({
            name: body.name,
            slug,
            createdById: member.id,
            workspaceId: workspace.id,
            isPrivate: body.type === "private",
          })
          .returning({
            id: schema.workspaceChannelsTable.id,
            slug: schema.workspaceChannelsTable.slug,
            name: schema.workspaceChannelsTable.name,
            isPrivate: schema.workspaceChannelsTable.isPrivate,
          });

        await tx.insert(schema.workspaceChannelMembersTable).values({
          channelId: channel.id,
          memberId: member.id,
          isExternal: false,
        });

        return channel;
      });

      return c.json(
        {
          ok: true,
          code: "OK" as const,
          data: {
            channel,
          },
        },
        201
      );
    } catch (e) {
      console.error(e);
      return internalServerError(c);
    }
  });

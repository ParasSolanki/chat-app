import { createRoute, z } from "@hono/zod-openapi";
import { createProtectedApp } from "../pkg/create-app";
import {
  badRequestErrorResponse,
  forbiddenErrorResponse,
  internalServerErrorResponse,
  requestTimeoutErrorResponse,
  tooManyRequestsErrorResponse,
  contentTooLargeErrorResponse,
} from "../pkg/errors/response";
import { aliasedTable, and, desc, eq, lt, schema, sql, isNull } from "@chat/db";
import {
  badRequestError,
  forbiddenError,
  internalServerError,
} from "../pkg/errors/http";
import { generateMessageSlug } from "../utils/generate";
import {
  channelSchema,
  messageSlugSchema,
  recipientSchema,
  successResponseSchema,
  workspaceSchema,
} from "../common/schema";

const messageSchema = z.object(
  {
    type: z.enum(["message"], {
      invalid_type_error: "Message type is invalid",
      required_error: "Message type is required",
      message: "Message type is required",
    }),
    body: z
      .string({
        required_error: "Message body is required",
        invalid_type_error: "Message body is invalid",
      })
      .nullable(),
  },
  {
    invalid_type_error: "Message is invalid",
    required_error: "Message is required",
    message: "Message is required",
  }
);

const messagePayloadSchema = z.object(
  {
    channel: channelSchema.optional(),
    recipient: recipientSchema.optional(),
    parentMessageId: z
      .string({ invalid_type_error: "Invalid parent message" })
      .max(22, "Invalid parent message")
      .optional(),
    replyToId: z
      .string({ invalid_type_error: "Invalid reply to" })
      .max(22, "Invalid reply to")
      .optional(),
    message: messageSchema,
  },
  {
    invalid_type_error: "Message is invalid",
    required_error: "Message is required",
    message: "Message is required",
  }
);

const createMessageRoute = createRoute({
  method: "post",
  path: "/messages",
  tags: ["Messages"],
  request: {
    query: z.object({
      workspace: workspaceSchema,
    }),
    body: {
      description: "Message body",
      content: {
        "application/json": {
          schema: messagePayloadSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Message created",
      content: {
        "application/json": {
          schema: successResponseSchema.extend({
            data: z.object({
              message: z.object({
                id: z.string(),
                slug: z.string(),
                body: z.string().nullable(),
                createdAt: z.string(),
                updatedAt: z.string().nullable(),
              }),
            }),
          }),
        },
      },
    },
    ...badRequestErrorResponse,
    ...forbiddenErrorResponse,
    ...requestTimeoutErrorResponse,
    ...tooManyRequestsErrorResponse,
    ...contentTooLargeErrorResponse,
    ...internalServerErrorResponse,
  },
});

const getMessagesRoute = createRoute({
  method: "get",
  path: "/messages",
  tags: ["Messages"],
  request: {
    query: z.object({
      workspace: workspaceSchema,
      channel: channelSchema.optional(),
      recipient: recipientSchema.optional(),
      cursor: z.coerce.number(z.string()).optional(),
    }),
  },
  responses: {
    200: {
      description: "Messages",
      content: {
        "application/json": {
          schema: successResponseSchema.extend({
            data: z.object({
              cursor: z.number().optional(),
              messages: z
                .object({
                  id: z.string(),
                  type: z.string(),
                  slug: z.string(),
                  body: z.string().nullable(),
                  createdAt: z.string(),
                  updatedAt: z.string().nullable(),
                  workspace: z
                    .object({
                      id: z.string(),
                      slug: z.string(),
                      name: z.string(),
                    })
                    .nullable(),
                  sender: z
                    .object({
                      id: z.string(),
                      slug: z.string(),
                      name: z.string(),
                      username: z.string(),
                      avatarUrl: z.string().nullable(),
                    })
                    .nullable(),
                  channel: z
                    .object({
                      id: z.string(),
                      slug: z.string(),
                      name: z.string(),
                    })
                    .nullable(),
                  recipient: z
                    .object({
                      id: z.string(),
                      slug: z.string(),
                      name: z.string(),
                      username: z.string(),
                      avatarUrl: z.string().nullable(),
                    })
                    .nullable(),
                  files: z
                    .object({
                      id: z.string(),
                      slug: z.string(),
                      name: z.string(),
                      mimetype: z.string(),
                      url: z.string(),
                      originalW: z.number().nullable(),
                      originalH: z.number().nullable(),
                    })
                    .array(),
                })
                .array(),
            }),
          }),
        },
      },
    },
    ...badRequestErrorResponse,
    ...forbiddenErrorResponse,
    ...requestTimeoutErrorResponse,
    ...tooManyRequestsErrorResponse,
    ...contentTooLargeErrorResponse,
    ...internalServerErrorResponse,
  },
});

const updateMessageRoute = createRoute({
  method: "put",
  path: "/messages/{slug}",
  tags: ["Messages"],
  request: {
    query: z.object({
      workspace: workspaceSchema,
    }),
    params: z.object({
      slug: messageSlugSchema,
    }),
    body: {
      description: "Message body",
      content: {
        "application/json": {
          schema: messageSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Message updated",
      content: {
        "application/json": {
          schema: successResponseSchema.extend({
            data: z.object({
              message: z.object({
                id: z.string(),
                slug: z.string(),
                body: z.string().nullable(),
                createdAt: z.string(),
                updatedAt: z.string().nullable(),
              }),
            }),
          }),
        },
      },
    },
    ...badRequestErrorResponse,
    ...forbiddenErrorResponse,
    ...requestTimeoutErrorResponse,
    ...tooManyRequestsErrorResponse,
    ...contentTooLargeErrorResponse,
    ...internalServerErrorResponse,
  },
});

const deleteMessageRoute = createRoute({
  method: "delete",
  path: "/messages/{slug}",
  tags: ["Messages"],
  request: {
    query: z.object({
      workspace: workspaceSchema,
    }),
    params: z.object({
      slug: messageSlugSchema,
    }),
  },
  responses: {
    200: {
      description: "Message updated",
      content: {
        "application/json": {
          schema: successResponseSchema,
        },
      },
    },
    ...badRequestErrorResponse,
    ...forbiddenErrorResponse,
    ...requestTimeoutErrorResponse,
    ...tooManyRequestsErrorResponse,
    ...contentTooLargeErrorResponse,
    ...internalServerErrorResponse,
  },
});

export const route = createProtectedApp()
  .openapi(createMessageRoute, async (c) => {
    const query = c.req.valid("query");
    const db = c.get("db");
    const member = c.get("member");
    const body = c.req.valid("json");

    try {
      var [workspace] = await db
        .select({
          id: schema.workspacesTable.id,
          slug: schema.workspacesTable.slug,
        })
        .from(schema.workspacesTable)
        .where(eq(schema.workspacesTable.slug, query.workspace))
        .limit(1);

      if (!workspace) return forbiddenError(c);
    } catch (e) {
      console.error(e);
      return internalServerError(c);
    }

    let channel = null;
    // Check whether channel exists or not
    if (body.channel && !body.recipient) {
      try {
        const channels = await db
          .select({
            id: schema.workspaceChannelsTable.id,
          })
          .from(schema.workspaceChannelsTable)
          .leftJoin(
            schema.workspacesTable,
            eq(
              schema.workspacesTable.id,
              schema.workspaceChannelsTable.workspaceId
            )
          )
          .rightJoin(
            schema.workspaceChannelMembersTable,
            and(
              eq(
                schema.workspaceChannelsTable.id,
                schema.workspaceChannelMembersTable.channelId
              ),
              eq(
                schema.workspaceMembersTable.id,
                schema.workspaceChannelMembersTable.memberId
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
          .where(
            and(
              eq(schema.workspaceChannelsTable.slug, body.channel),
              isNull(schema.workspaceChannelsTable.archivedAt), // channel should not be archived
              isNull(schema.workspaceChannelsTable.archivedById), // channel should not be archived
              eq(schema.workspaceChannelMembersTable.memberId, member.id),
              eq(schema.workspacesTable.slug, workspace.slug)
            )
          )
          .limit(1);

        if (!channels[0]) return forbiddenError(c);
        channel = channels[0];
      } catch (e) {
        console.error(e, "here");
        return internalServerError(c);
      }
    }

    let recipient = null;
    if (body.recipient && !body.channel) {
      try {
        const recipients = await db
          .select({
            id: schema.workspaceMembersTable.id,
          })
          .from(schema.workspaceMembersTable)
          .where(eq(schema.workspaceMembersTable.slug, body.recipient))
          .limit(1);

        if (!recipients[0]) return forbiddenError(c);
        recipient = recipients[0];
      } catch (e) {
        console.error(e);
        return internalServerError(c);
      }
    }

    try {
      const message = await db.transaction(async (tx) => {
        let messageSlug = generateMessageSlug();
        let hasMessageSlug = true;

        do {
          const [message] = await tx
            .select({ id: schema.workspaceMessagesTable.id })
            .from(schema.workspaceMessagesTable)
            .leftJoin(
              schema.workspacesTable,
              eq(
                schema.workspacesTable.id,
                schema.workspaceMessagesTable.workspaceId
              )
            )
            .where(
              and(
                eq(schema.workspaceMessagesTable.slug, messageSlug),
                eq(schema.workspacesTable.id, workspace.id)
              )
            );

          if (message) messageSlug = generateMessageSlug();
          else hasMessageSlug = false;
        } while (hasMessageSlug);

        const [message] = await tx
          .insert(schema.workspaceMessagesTable)
          .values({
            slug: messageSlug,
            senderId: member.id,
            type: body.message.type,
            body: body.message.body,
            workspaceId: workspace.id,
            channelId: channel ? channel.id : null,
            recipientId: recipient ? recipient.id : null,
          })
          .returning({
            id: schema.workspaceMessagesTable.id,
            slug: schema.workspaceMessagesTable.slug,
            body: schema.workspaceMessagesTable.body,
            createdAt: schema.workspaceMessagesTable.createdAt,
            updatedAt: schema.workspaceMessagesTable.updatedAt,
          });

        return message;
      });

      return c.json(
        {
          ok: true,
          code: "OK" as const,
          data: {
            message,
          },
        },
        201
      );
    } catch (e) {
      console.error(e, "add");
      return internalServerError(c);
    }
  })
  .openapi(getMessagesRoute, async (c) => {
    const query = c.req.valid("query");
    const db = c.get("db");
    const workspace = c.get("workspace");

    if (query?.cursor && isNaN(new Date(query.cursor).getTime())) {
      return badRequestError(c, { message: "Invalid cursor" });
    }

    let channel = null;
    // Check whether channel exists or not
    if (query.channel) {
      try {
        const channels = await db
          .select({
            id: schema.workspaceChannelsTable.id,
            slug: schema.workspaceChannelsTable.slug,
          })
          .from(schema.workspaceChannelsTable)
          .leftJoin(
            schema.workspacesTable,
            eq(
              schema.workspacesTable.id,
              schema.workspaceChannelsTable.workspaceId
            )
          )
          .where(
            and(
              eq(schema.workspaceChannelsTable.slug, query.channel),
              eq(schema.workspacesTable.slug, workspace.slug)
            )
          )
          .limit(1);

        if (!channels[0]) return forbiddenError(c);
        channel = channels[0];
      } catch (e) {
        console.error(e);
        return internalServerError(c);
      }
    }

    let recipient = null;
    // Check whether recipint exists or not
    if (query.recipient) {
      try {
        const recipients = await db
          .select({
            id: schema.workspaceMembersTable.id,
            slug: schema.workspaceMembersTable.slug,
          })
          .from(schema.workspaceMembersTable)
          .leftJoin(
            schema.workspacesTable,
            eq(
              schema.workspacesTable.id,
              schema.workspaceMembersTable.workspaceId
            )
          )
          .where(
            and(
              eq(schema.workspaceMembersTable.slug, query.recipient),
              eq(schema.workspacesTable.slug, workspace.slug)
            )
          )
          .limit(1);

        if (!recipients[0]) return forbiddenError(c);
        recipient = recipients[0];
      } catch (e) {
        console.error(e);
        return internalServerError(c);
      }
    }

    try {
      const sendersTable = aliasedTable(
        schema.workspaceMembersTable,
        "senders"
      );
      const recipientsTable = aliasedTable(
        schema.workspaceMembersTable,
        "recipients"
      );

      // const replyToMessagesTable = aliasedTable(
      //   schema.workspaceMessagesTable,
      //   "reply_to_messages"
      // );
      const cursor = query?.cursor ? new Date(query.cursor) : new Date();
      const channelFilter = channel
        ? eq(schema.workspaceChannelsTable.slug, channel.slug)
        : undefined;
      const recipientFilter = recipient
        ? eq(recipientsTable.slug, recipient.slug)
        : undefined;

      const messages = await db
        .select({
          id: schema.workspaceMessagesTable.id,
          type: schema.workspaceMessagesTable.type,
          slug: schema.workspaceMessagesTable.slug,
          body: schema.workspaceMessagesTable.body,
          createdAt: schema.workspaceMessagesTable.createdAt,
          updatedAt: schema.workspaceMessagesTable.updatedAt,
          workspace: {
            id: schema.workspacesTable.id,
            slug: schema.workspacesTable.slug,
            name: schema.workspacesTable.name,
          },
          sender: {
            id: sendersTable.id,
            slug: sendersTable.slug,
            name: sendersTable.name,
            username: sendersTable.username,
            avatarUrl: sendersTable.avatarUrl,
          },
          channel: {
            id: schema.workspaceChannelsTable.id,
            slug: schema.workspaceChannelsTable.slug,
            name: schema.workspaceChannelsTable.name,
          },
          recipient: {
            id: recipientsTable.id,
            slug: recipientsTable.slug,
            name: recipientsTable.name,
            username: recipientsTable.username,
            avatarUrl: recipientsTable.avatarUrl,
          },

          //   replyTo: {
          //     id: replyToMessagesTable.id,
          //     type: replyToMessagesTable.type,
          //     slug: replyToMessagesTable.slug,
          //     body: replyToMessagesTable.body,
          //     createdAt: replyToMessagesTable.createdAt,
          //     updatedAt: replyToMessagesTable.updatedAt,
          //   },
          files: sql`
            case
                when count(${schema.workspaceMessageFilesTable.id}) = 0 then json('[]')
                else json(json_group_array(json_object('id', ${schema.workspaceMessageFilesTable.id}, 'mimetype', ${schema.workspaceMessageFilesTable.mimetype},  'name', ${schema.workspaceMessageFilesTable.name}, 'url', ${schema.workspaceMessageFilesTable.url}, 'slug', ${schema.workspaceMessageFilesTable.slug}, 'originalH', ${schema.workspaceMessageFilesTable.originalH}, 'originalW', ${schema.workspaceMessageFilesTable.originalW})))
            end`.mapWith({
            mapFromDriverValue: (value) => {
              return JSON.parse(value) as Array<{
                id: string;
                mimetype: string;
                name: string;
                slug: string;
                url: string;
                originalW: number | null;
                originalH: number | null;
              }>;
            },
          }),
        })
        .from(schema.workspaceMessagesTable)
        .leftJoin(
          schema.workspacesTable,
          eq(
            schema.workspacesTable.id,
            schema.workspaceMessagesTable.workspaceId
          )
        ) // workspaces
        .leftJoin(
          sendersTable,
          eq(sendersTable.id, schema.workspaceMessagesTable.senderId)
        ) // senders
        .leftJoin(
          recipientsTable,
          eq(recipientsTable.id, schema.workspaceMessagesTable.recipientId)
        ) // recipients
        .leftJoin(
          schema.workspaceMessageFilesTable,
          eq(
            schema.workspaceMessageFilesTable.messageId,
            schema.workspaceMessagesTable.id
          )
        ) // files
        .leftJoin(
          schema.workspaceChannelsTable,
          eq(
            schema.workspaceChannelsTable.id,
            schema.workspaceMessagesTable.channelId
          )
        ) // channels
        // .leftJoin(
        //   replyToMessagesTable,
        //   and(
        //     eq(replyToMessagesTable.workspaceId, schema.workspacesTable.id),
        //     eq(replyToMessagesTable.id, schema.workspaceMessagesTable.replyToId)
        //   )
        // ) // reply to messages
        .where(
          and(
            lt(schema.workspaceMessagesTable.createdAt, cursor),
            isNull(schema.workspaceMessagesTable.parentMessageId),
            eq(schema.workspaceMessagesTable.workspaceId, workspace.id),
            channelFilter,
            recipientFilter
          )
        )
        .orderBy(desc(schema.workspaceMessagesTable.createdAt))
        .groupBy(schema.workspaceMessagesTable.id)
        .limit(20);

      return c.json(
        {
          ok: true,
          code: "OK" as const,
          data: {
            messages,
            cursor: messages.at(-1)?.createdAt.getTime(),
          },
        },
        200
      );
    } catch (e) {
      console.error(e);
      return internalServerError(c);
    }
  })
  .openapi(updateMessageRoute, async (c) => {
    c.req.valid("query");
    const messageSlug = c.req.valid("param").slug;
    const db = c.get("db");
    const member = c.get("member");
    const workspace = c.get("workspace");

    try {
      const [message] = await db
        .select({ id: schema.workspaceMessagesTable.id })
        .from(schema.workspaceMessagesTable)
        .where(
          and(
            eq(schema.workspaceMessagesTable.slug, messageSlug),
            eq(schema.workspaceMessagesTable.senderId, member.id),
            eq(schema.workspaceMessagesTable.workspaceId, workspace.id)
          )
        )
        .limit(1);

      // Message not found means either slug is invalid or current member has not sender of this message
      if (!message) return forbiddenError(c);
    } catch (e) {
      console.error(e);
      return internalServerError(c);
    }

    const json = c.req.valid("json");

    try {
      const [message] = await db.transaction(async (tx) => {
        return await tx
          .update(schema.workspaceMessagesTable)
          .set({
            body: json.body,
          })
          .where(
            and(
              eq(schema.workspaceMessagesTable.slug, messageSlug),
              eq(schema.workspaceMessagesTable.senderId, member.id),
              eq(schema.workspaceMessagesTable.workspaceId, workspace.id)
            )
          )
          .returning({
            id: schema.workspaceMessagesTable.id,
            slug: schema.workspaceMessagesTable.slug,
            body: schema.workspaceMessagesTable.body,
            createdAt: schema.workspaceMessagesTable.createdAt,
            updatedAt: schema.workspaceMessagesTable.updatedAt,
          });
      });

      if (!message)
        throw new Error("Something went wrong message not found on update");

      return c.json(
        {
          ok: true,
          code: "OK" as const,
          data: { message },
        },
        200
      );
    } catch (e) {
      console.error(e);
      return internalServerError(c);
    }
  })
  .openapi(deleteMessageRoute, async (c) => {
    c.req.valid("query");
    const messageSlug = c.req.valid("param").slug;
    const db = c.get("db");
    const member = c.get("member");
    const workspace = c.get("workspace");

    try {
      const [message] = await db
        .select({ id: schema.workspaceMessagesTable.id })
        .from(schema.workspaceMessagesTable)
        .where(
          and(
            eq(schema.workspaceMessagesTable.slug, messageSlug),
            eq(schema.workspaceMessagesTable.senderId, member.id),
            eq(schema.workspaceMessagesTable.workspaceId, workspace.id)
          )
        )
        .limit(1);

      // Message not found means either slug is invalid or current member has not sender of this message
      if (!message) return forbiddenError(c);
    } catch (e) {
      console.error(e);
      return internalServerError(c);
    }

    try {
      await db.transaction(async (tx) => {
        return await tx
          .delete(schema.workspaceMessagesTable)
          .where(
            and(
              eq(schema.workspaceMessagesTable.slug, messageSlug),
              eq(schema.workspaceMessagesTable.senderId, member.id),
              eq(schema.workspaceMessagesTable.workspaceId, workspace.id)
            )
          );
      });

      return c.json(
        {
          ok: true,
          code: "OK" as const,
        },
        200
      );
    } catch (e) {
      console.error(e);
      return internalServerError(c);
    }
  });

import {
  text,
  sqliteTable,
  integer,
  unique,
  index,
  foreignKey,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { ulid } from "ulid";
import crypto from "node:crypto";

const uuid = () => crypto.randomUUID();
const primaryId = (name = "id") =>
  text(name)
    .notNull()
    .primaryKey()
    .$defaultFn(() => ulid());

const lifecycleDates = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`NULL`)
    .$onUpdate(() => new Date()),
};

export const usersTable = sqliteTable("users", {
  id: primaryId(),
  email: text("email", { length: 255 }).notNull().unique(),
  displayName: text("display_name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  ...lifecycleDates,
});

export const userSessionsTable = sqliteTable(
  "user_sessions",
  {
    id: primaryId(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  },
  (t) => ({
    indexUserId: index("sessions_user_id_index").on(t.userId),
  })
);

export const userPasswordsTable = sqliteTable("user_passwords", {
  id: primaryId(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  hashedPassword: text("hashed_password"),
  ...lifecycleDates,
});

export const userAccountsTable = sqliteTable(
  "user_accounts",
  {
    id: primaryId(),
    providerId: text("provider_key").notNull(),
    providerUserId: text("provider_user_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    ...lifecycleDates,
  },
  (t) => ({
    indexUserId: index("accounts_user_id_index").on(t.userId),
    uniqueUserIdAndProviderId: unique().on(t.userId, t.providerId),
  })
);

export const workspacesTable = sqliteTable(
  "workspaces",
  {
    id: primaryId(),
    name: text("name", { length: 255 }).notNull(),
    slug: text("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    inviteCode: text("invite_code").notNull().unique(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    ...lifecycleDates,
  },
  (t) => ({
    indexOwnerId: index("workspaces_owner_id_index").on(t.ownerId),
  })
);

export const workspaceRolesTable = sqliteTable(
  "workspace_roles",
  {
    id: primaryId(),
    name: text("name", { length: 255 }).notNull(),
    description: text("description"),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    ...lifecycleDates,
  },
  (t) => ({
    indexWorkspaceId: index("roles_workspace_id_index").on(t.workspaceId),
    uniqueWorkspaceIdAndName: unique().on(t.workspaceId, t.name),
  })
);

export const workspaceMembersTable = sqliteTable(
  "workspace_members",
  {
    id: primaryId(),
    name: text("name", { length: 255 }).notNull(),
    username: text("username", { length: 255 }).notNull(),
    slug: text("slug", { length: 255 }).notNull().unique(),
    avatarUrl: text("avatar_url"),
    isActive: integer("is_active", { mode: "boolean" }).notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    workspaceRoleId: text("workspace_role_id")
      .notNull()
      .references(() => workspaceRolesTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    ...lifecycleDates,
  },
  (t) => ({
    indexUserId: index("members_user_id_index").on(t.userId),
    indexWorkspaceId: index("members_workspace_id_index").on(t.workspaceId),
    indexWorkspaceRoleId: index("members_workspace_role_id_index").on(
      t.workspaceRoleId
    ),
    uniqueUserIdAndWorkspaceId: unique().on(t.userId, t.workspaceId),
    uniqueWorkspaceIdAndUsername: unique().on(t.workspaceId, t.username),
    uniqueWorkspaceIdAndSlug: unique().on(t.workspaceId, t.slug),
    uniqueUserIdWorkspaceAndWorkspaceRoleId: unique().on(
      t.userId,
      t.workspaceId,
      t.workspaceRoleId
    ),
  })
);

export const workspaceInvitationsTable = sqliteTable(
  "workspace_invitations",
  {
    id: primaryId(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    invitationCode: text("invitation_code")
      .notNull()
      .$defaultFn(() => uuid()),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => workspaceMembersTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    inviteeEmail: text("invitee_email").notNull(),
    inviteeUserId: text("invitee_user_id").references(() => usersTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    status: text("status", { enum: ["pending", "accepted", "rejected"] })
      .notNull()
      .default("pending"),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    acceptedAt: integer("accepted_at", { mode: "timestamp" }),
    ...lifecycleDates,
  },
  (t) => ({
    workspaceIdIndex: index("invitations_workspace_id_index").on(t.workspaceId),
    inviterIdIndex: index("invitations_inviter_id_index").on(t.inviterId),
    inviteeEmailIndex: index("invitations_invitee_email_index").on(
      t.inviteeEmail
    ),
    inviteeUserIdIndex: index("invitations_invitee_user_id_index").on(
      t.inviteeUserId
    ),
    uniqueWorkspaceInvitation: unique().on(t.workspaceId, t.inviteeEmail),
    uniqueInvitationCode: unique().on(t.invitationCode),
  })
);

export const workspaceChannelsTable = sqliteTable(
  "workspace_channels",
  {
    id: primaryId(),
    name: text("name", { length: 255 }).notNull(),
    slug: text("slug", { length: 255 }).notNull(),
    description: text("description"),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    createdById: text("created_by_id")
      .notNull()
      .references(() => workspaceMembersTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    isPrivate: integer("is_private", { mode: "boolean" }).notNull(),
    archivedAt: integer("archived_at", { mode: "timestamp" }),
    archivedById: text("archived_by_id").references(
      () => workspaceMembersTable.id,
      {
        onDelete: "cascade",
        onUpdate: "cascade",
      }
    ),
    ...lifecycleDates,
  },
  (t) => ({
    indexWorkspaceId: index("channels_workspace_id_index").on(t.workspaceId),
    indexCreatedById: index("channels_created_by_id_index").on(t.createdById),
    indexArchivedById: index("channels_archived_by_id_index").on(
      t.archivedById
    ),
    uniqueWorkspaceIdAndSlug: unique().on(t.workspaceId, t.slug),
  })
);

export const workspaceChannelMembersTable = sqliteTable(
  "workspace_channel_members",
  {
    id: primaryId(),
    channelId: text("channel_id")
      .notNull()
      .references(() => workspaceChannelsTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    memberId: text("member_id")
      .notNull()
      .references(() => workspaceMembersTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    isExternal: integer("is_external", { mode: "boolean" })
      .notNull()
      .$defaultFn(() => false),
    ...lifecycleDates,
  },
  (t) => ({
    indexChannelId: index("channel_members_channel_id_index").on(t.channelId),
    indexMemberId: index("channel_members_channel_id_index").on(t.memberId),
    uniqueWorkspaceIdChannelIdAndMemberId: unique().on(t.channelId, t.memberId),
  })
);

export const workspaceMessagesTable = sqliteTable(
  "workspace_messages",
  {
    id: primaryId(),
    type: text("type", { length: 255 }).notNull(),
    slug: text("slug", { length: 255 }).notNull(),
    body: text("body"),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    senderId: text("sender_id")
      .notNull()
      .references(() => workspaceMembersTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    channelId: text("channel_id").references(() => workspaceChannelsTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    recipientId: text("recipient_id").references(
      () => workspaceMembersTable.id,
      {
        onDelete: "cascade",
        onUpdate: "cascade",
      }
    ),
    parentMessageId: text("parent_message_id"),
    replyToId: text("reply_to_id"),
    ...lifecycleDates,
  },
  (t) => ({
    indexWorkspaceId: index("messages_workspace_id_index").on(t.workspaceId),
    indexChannelId: index("messages_channel_id_index").on(t.channelId),
    indexSenderId: index("messages_sender_id_index").on(t.senderId),
    indexRecipientId: index("messages_recipient_id_index").on(t.recipientId),
    uniqueSlugAndWorkspaceId: unique().on(t.slug, t.workspaceId),
    parentIdRef: foreignKey({
      columns: [t.parentMessageId],
      foreignColumns: [t.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    replyToIdRef: foreignKey({
      columns: [t.replyToId],
      foreignColumns: [t.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  })
);

export const workspaceMessageReactionsTable = sqliteTable(
  "workspace_message_reactions",
  {
    id: primaryId(),
    reaction: text("reaction").notNull(),
    memberId: text("member_id")
      .notNull()
      .references(() => workspaceMembersTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    messageId: text("message_id")
      .notNull()
      .references(() => workspaceMessagesTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    ...lifecycleDates,
  },
  (t) => ({
    indexMemberId: index("reactions_member_id_index").on(t.memberId),
    indexMessageId: index("reactions_message_id_index").on(t.messageId),
    uniqueMessageIdMemberIdAndReaction: unique().on(
      t.messageId,
      t.memberId,
      t.reaction
    ),
  })
);

export const workspaceMessageFilesTable = sqliteTable(
  "workspace_message_files",
  {
    id: primaryId(),
    name: text("name").notNull(),
    slug: text("slug", { length: 255 }).notNull().unique(),
    mimetype: text("mimetype").notNull(),
    url: text("url").notNull(),
    originalW: integer("original_w"),
    originalH: integer("original_h"),
    messageId: text("message_id")
      .notNull()
      .references(() => workspaceMessagesTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    ...lifecycleDates,
  },
  (t) => ({
    indexMessageId: index("files_message_id_index").on(t.messageId),
  })
);

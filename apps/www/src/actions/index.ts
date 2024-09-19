import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { validateCSRFToken } from "../server/utils";
import { and, db, eq, schema } from "../server/db";
import { Argon2id } from "oslo/password";
import {
  generateChannelSlug,
  generateMemberSlug,
  generateUsername,
  generateWorkspaceInviteCode,
  generateWorkspaceName,
  generateWorkspaceSlug,
} from "../utils/generate";

const EMAIL_KEY = "email";

const USER_AVATAR_URLS = [
  "https://api.dicebear.com/9.x/glass/svg?seed=Lily",
  "https://api.dicebear.com/9.x/glass/svg?seed=Miss%20kitty",
  "https://api.dicebear.com/9.x/glass/svg?seed=Muffin",
  "https://api.dicebear.com/9.x/glass/svg?seed=Sheba",
  "https://api.dicebear.com/9.x/glass/svg?seed=Willow",
  "https://api.dicebear.com/9.x/glass/svg?seed=Jasmine",
  "https://api.dicebear.com/9.x/glass/svg?seed=Sassy",
  "https://api.dicebear.com/9.x/glass/svg?seed=Bandit",
  "https://api.dicebear.com/9.x/glass/svg?seed=Precious",
  "https://api.dicebear.com/9.x/glass/svg?seed=Milo",
];

const AVATAR_URLS = [
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Lily",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Miss%20kitty",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Muffin",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Sheba",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Willow",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Jasmine",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Sassy",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Bandit",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Precious",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Milo",
];

function getRandomAvatar() {
  return AVATAR_URLS[Math.floor(Math.random() * AVATAR_URLS.length - 1)];
}
function getRandomUserAvatar() {
  return USER_AVATAR_URLS[
    Math.floor(Math.random() * USER_AVATAR_URLS.length - 1)
  ];
}

const csrfSchmea = z.string();

const authSchema = z.object({
  _csrf: csrfSchmea,
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email is required",
    })
    .min(1, "Email is required")
    .email("Email is invalid"),
  password: z
    .string({
      required_error: "Password is required",
      invalid_type_error: "Password is required",
    })
    .min(8, "Password must contain at least 8 character(s)")
    .max(100, "Password must contain at most 100 character(s)"),
});

export const server = {
  signup: defineAction({
    accept: "form",
    input: authSchema,
    handler: async ({ email, password, _csrf }) => {
      if (!validateCSRFToken(_csrf)) {
        throw new ActionError({
          code: "FORBIDDEN",
          message: "forbidden",
        });
      }

      {
        const [user] = await db
          .select({ id: schema.usersTable.id })
          .from(schema.usersTable)
          .where(eq(schema.usersTable.email, email))
          .limit(1);

        if (user) {
          throw new ActionError({
            code: "CONFLICT",
            message: "User already exists with email",
          });
        }
      }

      try {
        const user = await db.transaction(async (tx) => {
          const username = generateUsername(email);

          const [user] = await tx
            .insert(schema.usersTable)
            .values({
              email,
              avatarUrl: getRandomUserAvatar(),
              displayName: username,
            })
            .returning();
          const hashedPassword = await new Argon2id().hash(password);

          await tx.insert(schema.userPasswordsTable).values({
            hashedPassword,
            userId: user.id,
          });

          await tx.insert(schema.userAccountsTable).values({
            providerId: EMAIL_KEY,
            providerUserId: email,
            userId: user.id,
          });

          let inviteCode = generateWorkspaceInviteCode();
          let hasWorkspaceWithInviteCode = true;

          do {
            const [workspace] = await tx
              .select({ id: schema.workspacesTable.id })
              .from(schema.workspacesTable)
              .where(eq(schema.workspacesTable.inviteCode, inviteCode))
              .limit(1);

            if (workspace) inviteCode = generateWorkspaceInviteCode();
            else hasWorkspaceWithInviteCode = false;
          } while (hasWorkspaceWithInviteCode);

          let workspaceSlug = generateWorkspaceSlug();
          let hasWorkspaceWithSlug = true;

          do {
            const [workspace] = await tx
              .select({ id: schema.workspacesTable.id })
              .from(schema.workspacesTable)
              .where(eq(schema.workspacesTable.slug, workspaceSlug))
              .limit(1);

            if (workspace) workspaceSlug = generateWorkspaceSlug();
            else hasWorkspaceWithSlug = false;
          } while (hasWorkspaceWithSlug);

          const [workspace] = await tx
            .insert(schema.workspacesTable)
            .values({
              inviteCode,
              slug: workspaceSlug,
              ownerId: user.id,
              name: generateWorkspaceName(email),
            })
            .returning({ id: schema.workspacesTable.id });

          const [adminRole] = await tx
            .insert(schema.workspaceRolesTable)
            .values({
              workspaceId: workspace.id,
              name: "admin",
            })
            .returning({ id: schema.workspaceRolesTable.id });

          await tx
            .insert(schema.workspaceRolesTable)
            .values({
              workspaceId: workspace.id,
              name: "member",
            })
            .returning({ id: schema.workspaceRolesTable.id });

          const [member] = await tx
            .insert(schema.workspaceMembersTable)
            .values({
              name: username,
              username: username,
              userId: user.id,
              avatarUrl: getRandomAvatar(),
              slug: generateMemberSlug(),
              workspaceId: workspace.id,
              workspaceRoleId: adminRole.id,
              isActive: true,
            })
            .returning({ id: schema.workspaceMembersTable.id });

          const [channel] = await tx
            .insert(schema.workspaceChannelsTable)
            .values({
              name: "General",
              isPrivate: false,
              createdById: member.id,
              slug: generateChannelSlug(),
              workspaceId: workspace.id,
            })
            .returning({ id: schema.workspaceChannelsTable.id });

          await tx.insert(schema.workspaceChannelMembersTable).values({
            channelId: channel.id,
            memberId: member.id,
          });

          return user;
        });

        return { user };
      } catch (e) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to sign up. Please try again later.",
        });
      }
    },
  }),
  login: defineAction({
    accept: "form",
    input: authSchema,
    handler: async ({ email, password, _csrf }) => {
      if (!validateCSRFToken(_csrf)) {
        throw new ActionError({
          code: "FORBIDDEN",
          message: "forbidden",
        });
      }

      {
        const [users, accounts] = await Promise.all([
          db
            .select({ id: schema.usersTable.id })
            .from(schema.usersTable)
            .where(eq(schema.usersTable.email, email))
            .limit(1),
          db
            .select({
              userId: schema.userAccountsTable.userId,
            })
            .from(schema.userAccountsTable)
            .where(
              and(
                eq(schema.userAccountsTable.providerId, EMAIL_KEY),
                eq(schema.userAccountsTable.providerUserId, email)
              )
            )
            .limit(1),
        ]);

        const user = users[0];
        const account = accounts[0];

        if (!user || !account) {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: "Incorrect email or password",
          });
        }
      }

      const [user] = await db
        .select({
          id: schema.usersTable.id,
          email: schema.usersTable.email,
          hashedPassword: schema.userPasswordsTable.hashedPassword,
        })
        .from(schema.usersTable)
        .leftJoin(
          schema.userPasswordsTable,
          eq(schema.usersTable.id, schema.userPasswordsTable.userId)
        )
        .where(eq(schema.usersTable.email, email))
        .limit(1);

      // no user found
      if (!user) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "Incorrect email or password",
        });
      }

      // user does not have password
      if (!user.hashedPassword) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "Incorrect email or password",
        });
      }

      const isPasswordValid = await new Argon2id().verify(
        user.hashedPassword,
        password
      );

      if (!isPasswordValid) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "Incorrect email or password",
        });
      }

      const { hashedPassword, ...userWithoutPassword } = user;

      console.log(userWithoutPassword);

      return { user: userWithoutPassword };
    },
  }),
  logout: defineAction({
    accept: "form",
    input: z.object({
      _csrf: csrfSchmea,
    }),
    handler: async ({ _csrf }) => {
      if (!validateCSRFToken(_csrf)) {
        throw new ActionError({
          code: "FORBIDDEN",
          message: "forbidden",
        });
      }
    },
  }),
};

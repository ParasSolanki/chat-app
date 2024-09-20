import { createRoute } from "@hono/zod-openapi";
import { createApp } from "../pkg/create-app";
import { env } from "../../env";
import { validateRedirectToken } from "../utils/generate";
import { and, asc, eq, schema } from "../pkg/db";
import { lucia } from "../pkg/lucia";

const redirectRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Redirect"],
  responses: {
    302: {
      description: "Redirect",
    },
  },
});

export const route = createApp().openapi(redirectRoute, async (c) => {
  const db = c.get("db");
  const query = c.req.query();
  const token = query?.t;

  if (!token) return c.redirect(`${env.VITE_PUBLIC_WEBSITE_URL}/login`, 302);

  try {
    const payload = validateRedirectToken(token, env.TOKEN_SECRET);

    const channelSq = db
      .select({
        workspaceSlug: schema.workspacesTable.slug,
        channelSlug: schema.workspaceChannelsTable.slug,
      })
      .from(schema.workspaceChannelsTable)
      .leftJoin(
        schema.workspacesTable,
        eq(schema.workspacesTable.id, schema.workspaceChannelsTable.workspaceId)
      )
      .where(eq(schema.workspacesTable.slug, payload.w))
      .orderBy(asc(schema.workspaceChannelsTable.createdAt))
      .limit(1)
      .as("channel_sq");

    const [user] = await db
      .select({
        id: schema.usersTable.id,
        email: schema.usersTable.email,
        workspace: {
          id: schema.workspacesTable.id,
          slug: schema.workspacesTable.slug,
        },
        member: {
          id: schema.workspaceMembersTable.id,
          slug: schema.workspaceMembersTable.slug,
        },
        channelSlug: channelSq.channelSlug,
      })
      .from(schema.usersTable)
      .leftJoin(
        schema.workspacesTable,
        eq(schema.workspacesTable.id, schema.workspaceMembersTable.workspaceId)
      )
      .leftJoin(
        channelSq,
        eq(channelSq.workspaceSlug, schema.workspacesTable.slug)
      )
      .leftJoin(
        schema.workspaceMembersTable,
        and(
          eq(schema.workspaceMembersTable.userId, schema.usersTable.id),
          eq(
            schema.workspaceMembersTable.workspaceId,
            schema.workspacesTable.id
          )
        )
      )
      .where(
        and(
          eq(schema.usersTable.id, payload.u),
          eq(schema.workspacesTable.slug, payload.w),
          eq(schema.workspaceMembersTable.isActive, true)
        )
      )
      .limit(1);

    if (!user) throw new Error("User not found");
    if (!user.workspace)
      throw new Error("Workspace not found or user is not part of workspace");
    if (!user.member)
      throw new Error(
        "Member not found or user is not part of workspace as member or deactivated account"
      );
    if (!user.channelSlug)
      throw new Error("No workspace channel which should not happen");

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    c.header("Set-Cookie", sessionCookie.serialize(), { append: true });
    return c.redirect(
      `${env.BASE_URL}/workspace/${user.workspace.slug}/${user.channelSlug}`,
      302
    );
  } catch (e) {
    console.log(e);
    return c.redirect(`${env.VITE_PUBLIC_WEBSITE_URL}/login`, 302);
  }
});

import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { lucia } from "../lucia";
import { and, schema, eq } from "../db";
import { forbiddenError } from "../errors/http";

export function auth() {
  return createMiddleware(async (c, next) => {
    const db = c.get("db");
    const query = c.req.query();
    const workspaceSlug = query?.workspace;

    if (!workspaceSlug) {
      c.set("user", undefined);
      c.set("session", undefined);
      return forbiddenError(c);
    }

    const sessionCookie = getCookie(c, lucia.sessionCookieName);

    if (!sessionCookie) {
      c.set("user", undefined);
      c.set("session", undefined);
      return forbiddenError(c);
    }

    const { session, user } = await lucia.validateSession(sessionCookie);

    if (!session) {
      c.set("user", undefined);
      c.set("session", undefined);
      c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize(), {
        append: true,
      });
      return forbiddenError(c);
    }

    try {
      var [workspace] = await db
        .select({
          id: schema.workspacesTable.id,
          slug: schema.workspacesTable.slug,
        })
        .from(schema.workspacesTable)
        .where(eq(schema.workspacesTable.slug, workspaceSlug))
        .limit(1);

      if (!workspace) {
        throw new Error(`Workspace not found: ${workspaceSlug}`);
      }

      const members = await db
        .select({
          id: schema.workspaceMembersTable.id,
          email: schema.usersTable.email,
          name: schema.workspaceMembersTable.name,
          slug: schema.workspaceMembersTable.slug,
          username: schema.workspaceMembersTable.username,
          avatarUrl: schema.workspaceMembersTable.avatarUrl,
          role: {
            id: schema.workspaceRolesTable.id,
            name: schema.workspaceRolesTable.name,
          },
        })
        .from(schema.workspaceMembersTable)
        .leftJoin(
          schema.usersTable,
          eq(schema.usersTable.id, schema.workspaceMembersTable.userId)
        )
        .leftJoin(
          schema.workspacesTable,
          eq(
            schema.workspacesTable.id,
            schema.workspaceMembersTable.workspaceId
          )
        )
        .leftJoin(
          schema.workspaceRolesTable,
          and(
            eq(
              schema.workspaceRolesTable.id,
              schema.workspaceMembersTable.workspaceRoleId
            ),
            eq(
              schema.workspaceRolesTable.workspaceId,
              schema.workspacesTable.id
            )
          )
        )
        .where(
          and(
            eq(schema.usersTable.id, user.id),
            eq(schema.workspacesTable.slug, workspace.slug),
            eq(schema.workspaceMembersTable.isActive, true)
          )
        )
        .limit(1);

      const m = members[0];
      if (!m) throw new Error("Member not found");
      if (!m.email) throw new Error("Member email not found");
      const role = m.role;
      if (!role) throw new Error("Member role not found");

      var member = { ...m, role };
    } catch (error) {
      return forbiddenError(c);
    }

    if (session.fresh) {
      c.header(
        "Set-Cookie",
        lucia.createSessionCookie(session.id).serialize(),
        { append: true }
      );
    }

    c.set("user", user);
    c.set("session", session);
    c.set("member", member);
    c.set("workspace", workspace);

    await next();
  });
}

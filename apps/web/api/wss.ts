import { defineHooks } from "crossws";
import crossws from "crossws/adapters/node";
import { env } from "../env";
import { createDB, and, schema, eq } from "./pkg/db";
import { parseCookies } from "oslo/cookie";
import { lucia } from "./pkg/lucia";

const hooks = defineHooks({
  upgrade: async (request) => {
    try {
      await authorizeUser(request);
    } catch (e) {
      return new Response("Unauthorized", { status: 401 });
    }
  },
  open: async (peer) => {
    try {
      const request = peer.request;

      if (!request) throw new Error("No peer request");

      const { workspace } = await authorizeUser(request);

      peer.subscribe(workspace);
    } catch (e) {
      peer.terminate();
    }
  },
  close: (peer) => {},
  error: () => {},
  message: (peer, message) => {
    const payload = message.json();
    try {
      if (payload.type === "chat-message") {
        peer.publish(
          payload.workspace,
          JSON.stringify({
            type: "chat-message",
            message: {
              body: payload.message.body,
              "client-message-id": payload.message["client-message-id"],
              createdAt: payload.message.createdAt,
            },
          })
        );
      }
    } catch (e) {
      console.error(e);
    }
  },
});

export const wss = crossws({ hooks });

async function authorizeUser(request: Request) {
  const url = new URL(request.url ?? "/", env.BASE_URL ?? "http://localhost");
  const workspace = url.searchParams.get("workspace");

  if (!workspace) throw new Error("Unauthorized");

  const cookieHeader = request.headers.get("Cookie");

  if (!cookieHeader) throw new Error("Unauthorized");

  const cookies = parseCookies(cookieHeader);
  const sessionCookie = cookies.get(lucia.sessionCookieName);

  if (!sessionCookie) throw new Error("Unauthorized");

  const { session, user } = await lucia.validateSession(sessionCookie);

  if (!session || !user) throw new Error("Unauthorized");

  try {
    const db = createDB();

    const [member] = await db
      .select({
        id: schema.workspaceMembersTable.id,
        email: schema.usersTable.email,
        role: {
          id: schema.workspaceRolesTable.id,
        },
      })
      .from(schema.workspaceMembersTable)
      .leftJoin(
        schema.usersTable,
        eq(schema.usersTable.id, schema.workspaceMembersTable.userId)
      )
      .leftJoin(
        schema.workspacesTable,
        eq(schema.workspacesTable.id, schema.workspaceMembersTable.workspaceId)
      )
      .leftJoin(
        schema.workspaceRolesTable,
        and(
          eq(
            schema.workspaceRolesTable.id,
            schema.workspaceMembersTable.workspaceRoleId
          ),
          eq(schema.workspaceRolesTable.workspaceId, schema.workspacesTable.id)
        )
      )
      .where(
        and(
          eq(schema.usersTable.id, user.id),
          eq(schema.workspacesTable.slug, workspace),
          eq(schema.workspaceMembersTable.isActive, true)
        )
      )
      .limit(1);

    if (!member) throw new Error("Member not found");
    if (!member.email) throw new Error("Member email not found");
    if (!member.role) throw new Error("Member role not found");

    return { member, workspace, user, session };
  } catch (e) {
    throw new Error("Unauthorized");
  }
}

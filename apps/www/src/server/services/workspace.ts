import {
  db,
  schema,
  eq,
  and,
  count,
  desc,
  aliasedTable,
  sql,
  asc,
} from "../db";

export async function getUserWorkspaces(userId: string) {
  // Alias for the subquery
  const recentMembers = aliasedTable(
    schema.workspaceMembersTable,
    "recent_members"
  );
  const members = aliasedTable(schema.workspaceMembersTable, "members");

  const recentMembersSq = db
    .select({
      workspaceId: recentMembers.workspaceId,
      avatarUrls: sql`group_concat(${recentMembers.avatarUrl}, ',')`
        .mapWith({
          mapFromDriverValue: (value) => {
            return value.split(",") as string[];
          },
        })
        .as("avatar_urls"),
    })
    .from(recentMembers)
    .groupBy(recentMembers.workspaceId)
    .orderBy(desc(recentMembers.createdAt))
    .limit(5)
    .as("recent_members_sq");

  const membersSq = db
    .select({
      workspaceId: members.workspaceId,
      membersCount: count(members.id).as("members_count"),
    })
    .from(members)
    .groupBy(members.workspaceId)
    .orderBy(desc(members.createdAt))
    .limit(5)
    .as("members_sq");

  return await db
    .select({
      id: schema.workspacesTable.id,
      slug: schema.workspacesTable.slug,
      name: schema.workspacesTable.name,
      ownerId: schema.workspacesTable.ownerId,
      membersCount: membersSq.membersCount,
      membersAvatars: recentMembersSq.avatarUrls,
    })
    .from(schema.workspacesTable)
    .leftJoin(
      schema.workspaceMembersTable,
      and(
        eq(schema.workspaceMembersTable.userId, userId),
        eq(schema.workspaceMembersTable.workspaceId, schema.workspacesTable.id)
      )
    )
    .leftJoin(
      recentMembersSq,
      eq(recentMembersSq.workspaceId, schema.workspacesTable.id)
    )
    .leftJoin(membersSq, eq(membersSq.workspaceId, schema.workspacesTable.id))
    .where(eq(schema.workspaceMembersTable.userId, userId))
    .orderBy(asc(schema.workspaceMembersTable.createdAt))
    .groupBy(schema.workspacesTable.id);
}

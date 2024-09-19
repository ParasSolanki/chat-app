import { useQuery } from "@tanstack/react-query";
import { sessionQueries } from "~/common/keys/session";
import { workspaceQueries } from "~/common/keys/workspaces";

export function useWorkspace(workspace: string) {
  return useQuery(workspaceQueries.details({ workspace }));
}

export function useSession(workspace: string) {
  return useQuery(sessionQueries.session({ workspace }));
}

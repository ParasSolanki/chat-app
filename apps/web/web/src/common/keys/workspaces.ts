import { queryOptions } from "@tanstack/react-query";
import { client } from "~/utils/api";

type WorkspaceParams = {
  workspace: string;
};

export const workspaceKeys = {
  all: ["workspace"] as const,
  details: (params: WorkspaceParams) => [...workspaceKeys.all, params],
};

export const workspaceQueries = {
  details: (params: WorkspaceParams) => {
    return queryOptions({
      queryKey: workspaceKeys.details(params),
      queryFn: async () => {
        const response = await client.api.workspaces.$get({
          query: { workspace: params.workspace },
        });

        if (!response.ok) throw new Error("Something went wrong");

        return await response.json();
      },
    });
  },
};

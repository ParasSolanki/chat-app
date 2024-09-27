import { queryOptions } from "@tanstack/react-query";
import { client } from "~/utils/api";

type SessionParams = {
  workspace: string;
};

export const sessionKeys = {
  all: ["session"] as const,
  session: (params: SessionParams) => [...sessionKeys.all, params],
};

export const sessionQueries = {
  session: (params: SessionParams) => {
    return queryOptions({
      queryKey: sessionKeys.session(params),
      queryFn: async () => {
        const response = await client.api.session.$get({
          query: { workspace: params.workspace },
        });

        if (!response.ok) throw new Error("Something went wrong");

        return await response.json();
      },
    });
  },
};

import { queryOptions } from "@tanstack/react-query";
import { client } from "~/utils/api";

type MemberParams = {
  workspace: string;
  member: string;
};

export const memberKeys = {
  all: ["members"] as const,
  details: (params: MemberParams) => [...memberKeys.all, params],
};

export const memberQueries = {
  details: (params: MemberParams) => {
    return queryOptions({
      queryKey: memberKeys.details(params),
      queryFn: async () => {
        const response = await client.api.members.$get({
          query: { workspace: params.workspace, member: params.member },
        });

        if (!response.ok) throw new Error("Something went wrong");

        return await response.json();
      },
      refetchOnWindowFocus: false,
    });
  },
};

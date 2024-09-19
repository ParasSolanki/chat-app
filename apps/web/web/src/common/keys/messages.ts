import { infiniteQueryOptions } from "@tanstack/react-query";
import { client } from "~/utils/api";

type ListParams = {
  workspace: string;
  channel?: string;
  recipient?: string;
  cursor?: number;
};

export const messagesKeys = {
  all: ["messages"] as const,
  listInfinite: (params: ListParams) => [
    ...messagesKeys.all,
    "list-infinite",
    params,
  ],
};

export const messagesQueries = {
  listInfinite: (params: ListParams) => {
    return infiniteQueryOptions({
      queryKey: messagesKeys.listInfinite(params),
      queryFn: async ({ pageParam }) => {
        const response = await client.api.messages.messages.$get({
          query: {
            workspace: params.workspace,
            channel: params.channel,
            recipient: params.recipient,
            cursor: pageParam.toString(),
          },
        });

        if (!response.ok) throw new Error("Something went wrong");

        return await response.json();
      },
      initialPageParam: new Date().getTime(),
      getPreviousPageParam: (firstPage) => firstPage.data.cursor ?? undefined,
      getNextPageParam: (lastPage) => lastPage.data.cursor ?? undefined,
      refetchOnWindowFocus: false,
    });
  },
};

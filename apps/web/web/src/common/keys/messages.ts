import { infiniteQueryOptions, skipToken } from "@tanstack/react-query";
import { client } from "~/utils/api";

type ListParams = {
  workspace: string;
  channel?: string;
  recipient?: string;
};

type RepliesParams = {
  workspace: string;
  parentSlug?: string;
  channel?: string;
  recipient?: string;
};

export const messagesKeys = {
  all: ["messages"] as const,
  listInfinite: (params: ListParams) => [
    ...messagesKeys.all,
    "list-infinite",
    params,
  ],
  repliesInfinite: (params: RepliesParams) => [
    ...messagesKeys.all,
    "replies-infinite",
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
      getPreviousPageParam: (firstPage) => firstPage.data.cursor ?? undefined,
      initialPageParam: new Date().getTime(),
      getNextPageParam: (lastPage) => lastPage.data.cursor ?? undefined,
      refetchOnWindowFocus: false,
    });
  },
  repliesInfinite: (params: RepliesParams) => {
    const parentSlug = params.parentSlug;
    return infiniteQueryOptions({
      queryKey: messagesKeys.repliesInfinite({ ...params, parentSlug }),
      queryFn: parentSlug
        ? async ({ pageParam }) => {
            const response = await client.api.messages.messages[
              ":slug"
            ].replies.$get({
              param: {
                slug: parentSlug,
              },
              query: {
                workspace: params.workspace,
                channel: params.channel,
                recipient: params.recipient,
                cursor: pageParam.toString(),
              },
            });

            if (!response.ok) throw new Error("Something went wrong");

            return await response.json();
          }
        : skipToken,
      getPreviousPageParam: (firstPage) => firstPage.data.cursor ?? undefined,
      initialPageParam: new Date().getTime(),
      getNextPageParam: (lastPage) => lastPage.data.cursor ?? undefined,
      refetchOnWindowFocus: false,
    });
  },
};

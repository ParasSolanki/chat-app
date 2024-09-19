import { queryOptions } from "@tanstack/react-query";
import { client } from "~/utils/api";

type ChannelParams = {
  workspace: string;
  channel: string;
};

export const channelKeys = {
  all: ["channel"] as const,
  details: (params: ChannelParams) => [...channelKeys.all, params],
};

export const channelQueries = {
  details: (params: ChannelParams) => {
    return queryOptions({
      queryKey: channelKeys.details(params),
      queryFn: async () => {
        const response = await client.api.channels.$get({
          query: { workspace: params.workspace, channel: params.channel },
        });

        if (!response.ok) throw new Error("Something went wrong");

        return await response.json();
      },
      refetchOnWindowFocus: false,
    });
  },
};

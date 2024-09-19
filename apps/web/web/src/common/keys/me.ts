import { queryOptions } from "@tanstack/react-query";
import { client } from "~/utils/api";

type meChannelParams = {
  workspace: string;
};
type meDmsParams = {
  workspace: string;
};

export const meKeys = {
  all: ["me"] as const,
  channels: (params: meChannelParams) => [...meKeys.all, "channels", params],
  dms: (params: meDmsParams) => [...meKeys.all, "dms", params],
};

export const meQueries = {
  channels: (params: meChannelParams) => {
    return queryOptions({
      queryKey: meKeys.channels(params),
      queryFn: async () => {
        const response = await client.api.me.channels.$get({
          query: { workspace: params.workspace },
        });

        if (!response.ok) throw new Error("Something went wrong");

        return await response.json();
      },
      refetchOnWindowFocus: false,
    });
  },
  dms: (params: meDmsParams) => {
    return queryOptions({
      queryKey: meKeys.dms(params),
      queryFn: async () => {
        const response = await client.api.me.dms.$get({
          query: { workspace: params.workspace },
        });

        if (!response.ok) throw new Error("Something went wrong");

        return await response.json();
      },
      refetchOnWindowFocus: false,
    });
  },
};

import { env } from "~/env";
import { hc } from "hono/client";
import { default as _ky } from "ky";
import type { AppType } from "../../../api/app";

const ky = _ky.create({
  retry: 0,
});

export const client = hc<AppType>(env.VITE_PUBLIC_API_URL, {
  fetch: (input: RequestInfo | URL, requestInit?: RequestInit) => {
    return ky(input, {
      ...requestInit,
      credentials: "include",
    });
  },
});

export const createWebsocketConnection = (workspace: string) => {
  return client.ws.$ws({ query: { workspace } });
};
